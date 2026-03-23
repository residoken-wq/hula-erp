'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/CartContext';
import { resolveImageUrl } from '@/lib/utils';

// Dynamically import ModelViewer (client-only, no SSR)
const ModelViewer3D = dynamic(() => import('@/components/ModelViewer'), {
    ssr: false,
    loading: () => <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">⏳ Loading 3D...</div>
});

interface Product {
    id: number;
    sku: string;
    name: string;
    base_price: number;
    image_url?: string;
    category?: string;
    customer_description?: string;
    attributes?: any;
    customization_config?: {
        allow_logo?: boolean;
        logo_price?: number;
        logo_position?: { x: number; y: number; width: number; height: number };
        base_image?: string;
        pillow_image?: string;
        model_3d_url?: string;
        colors?: Array<{ name: string; code: string; image_url?: string; pillow_image_url?: string }>;
        accessories?: Array<{ name: string; price: number; image_url?: string }>;
        gallery_images?: string[];
    };
}

export default function ProductDetailClient({ product }: { product: Product }) {
    const { addToCart } = useCart();

    // Customization State
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
    const [isLogoSelected, setIsLogoSelected] = useState(false);
    const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    const galleryImages = product.customization_config?.gallery_images || [];
    const allImages = useMemo(() => {
        const images: string[] = [];
        if (product.image_url) {
            let parsedImg = product.image_url;
            if (typeof parsedImg === 'string' && parsedImg.startsWith('{')) {
                try { parsedImg = JSON.parse(parsedImg).url || parsedImg; } catch { }
            }
            images.push(parsedImg);
        }
        galleryImages.forEach((img: any) => {
            if (img && typeof img === 'string' && !images.includes(img)) images.push(img);
        });
        return images;
    }, [product.image_url, galleryImages]);

    const [mainImage, setMainImage] = useState<string | null>(allImages[0] || null);

    useEffect(() => {
        if (allImages.length > 0 && !allImages.includes(mainImage as string)) {
            setMainImage(allImages[0]);
        }
    }, [allImages, mainImage]);

    // Initial check for default color
    const colors = product.customization_config?.colors || [];
    const accessories = product.customization_config?.accessories || [];
    const allowLogo = product.customization_config?.allow_logo;
    const logoPrice = product.customization_config?.logo_price || 0;

    // Calculate Total Price
    const totalPrice = useMemo(() => {
        let total = Number(product.base_price);

        // Add Accessories Price
        selectedAccessories.forEach(accName => {
            const acc = accessories.find(a => a.name === accName);
            if (acc) total += Number(acc.price);
        });

        // Add Logo Price
        if (isLogoSelected) total += Number(logoPrice);

        return total;
    }, [product.base_price, selectedAccessories, isLogoSelected, accessories, logoPrice]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleAddToCart = () => {
        // Construct customization note
        const customizationParts = [];
        if (selectedColor) customizationParts.push(`Màu: ${selectedColor}`);
        if (isLogoSelected) customizationParts.push(`In Logo (+${formatPrice(logoPrice)})`);
        if (selectedAccessories.length > 0) {
            const accNames = selectedAccessories.join(', ');
            customizationParts.push(`Phụ kiện: ${accNames}`);
        }

        const customizationNote = customizationParts.join(' | ');

        addToCart({
            id: product.id,
            sku: product.sku,
            name: product.name,
            base_price: totalPrice,
            image_url: product.image_url,
            // @ts-ignore
            customization: {
                color: selectedColor,
                logo: isLogoSelected,
                accessories: selectedAccessories,
                note: customizationNote,
                original_price: product.base_price
            },
            quantity
        });
    };

    const toggleAccessory = (name: string) => {
        setSelectedAccessories(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : [...prev, name]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">

                    {/* Left: 3D Model or Image Gallery */}
                    <div className="p-8 bg-gray-50 flex items-center justify-center">
                        {product.customization_config?.model_3d_url ? (
                            <div className="w-full">
                                <ModelViewer3D
                                    src={product.customization_config.model_3d_url}
                                    poster={resolveImageUrl(product.image_url)}
                                    alt={product.name}
                                />
                                <p className="text-center text-xs text-gray-500 mt-2">🔄 Xoay để xem 360° | 📱 Nhấn AR để xem trong không gian thực</p>
                            </div>
                        ) : mainImage ? (
                            <div className="w-full flex flex-col gap-4">
                                <img
                                    src={resolveImageUrl(mainImage)}
                                    alt={product.name}
                                    className="max-w-full h-auto rounded-lg shadow-md"
                                />
                                {allImages.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
                                        {allImages.map((img, idx) => (
                                            <button 
                                                key={idx} 
                                                onClick={() => setMainImage(img)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                    mainImage === img ? 'border-primary-600 shadow-sm' : 'border-transparent hover:border-gray-300 opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <img src={resolveImageUrl(img)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-9xl">📦</div>
                        )}
                    </div>

                    {/* Right: Info & Config */}
                    <div className="p-8 lg:pr-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <p className="text-sm text-gray-500 mb-6">SKU: {product.sku}</p>

                        <div className="text-3xl font-bold text-primary-600 mb-8">
                            {formatPrice(totalPrice)}
                        </div>

                        <hr className="border-gray-100 my-6" />

                        {/* --- Customization Section --- */}

                        {/* 1. Colors */}
                        {colors.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Màu sắc</h3>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((c) => (
                                        <button
                                            key={c.name}
                                            onClick={() => setSelectedColor(c.name)}
                                            className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedColor === c.name ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : 'hover:scale-110'
                                                }`}
                                            style={{ backgroundColor: c.code }}
                                            title={c.name}
                                        >
                                            {selectedColor === c.code && (
                                                <span className="text-white text-xs">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {selectedColor && <p className="mt-2 text-sm text-gray-600">Đã chọn: <span className="font-medium text-gray-900">{selectedColor}</span></p>}
                            </div>
                        )}

                        {/* 2. Logo Service */}
                        {allowLogo && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Dịch vụ in Logo</h3>

                                {/* Checkbox Option */}
                                <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors mb-3">
                                    <input
                                        type="checkbox"
                                        checked={isLogoSelected}
                                        onChange={(e) => setIsLogoSelected(e.target.checked)}
                                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-gray-900">In Logo trường học/đơn vị</span>
                                        <p className="text-xs text-gray-500">Thêm {formatPrice(logoPrice)} / sản phẩm</p>
                                    </div>
                                </label>

                                {/* Logo Upload & Preview Area */}
                                {isLogoSelected && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <div className="mb-3">
                                            <p className="text-sm font-medium mb-2">Tải lên Logo của bạn (để xem demo):</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setUploadedLogo(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-primary-50 file:text-primary-700
                                                    hover:file:bg-primary-100"
                                            />
                                        </div>

                                        {/* Visual Preview */}
                                        {(product.customization_config?.base_image || uploadedLogo) && (
                                            <div className="relative w-full aspect-[3/4] bg-white rounded border overflow-hidden">
                                                {/* Base Image (Product/Mattress) */}
                                                <img
                                                    src={resolveImageUrl(product.customization_config?.base_image || product.image_url)}
                                                    alt="Base"
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Pillow Layer (Optional) */}
                                                {product.customization_config?.pillow_image && (
                                                    <img
                                                        src={resolveImageUrl(product.customization_config.pillow_image)}
                                                        alt="Pillow"
                                                        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                                                    />
                                                )}

                                                {/* Logo Overlay */}
                                                {uploadedLogo && product.customization_config?.logo_position && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${product.customization_config.logo_position.x}%`,
                                                            top: `${product.customization_config.logo_position.y}%`,
                                                            width: `${product.customization_config.logo_position.width}%`,
                                                            height: `${product.customization_config.logo_position.height}%`,
                                                            zIndex: 20
                                                        }}
                                                        className="flex items-center justify-center overflow-hidden"
                                                    >
                                                        <img src={uploadedLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                )}

                                                {/* Text Hint if no logo uploaded yet */}
                                                {!uploadedLogo && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-20 pointer-events-none">
                                                        <span className="bg-white/80 px-3 py-1 rounded text-xs">Preview Area</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Accessories */}
                        {accessories.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Phụ kiện đi kèm</h3>
                                <div className="space-y-3">
                                    {accessories.map((acc) => (
                                        <label key={acc.name} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessories.includes(acc.name)
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAccessories.includes(acc.name)}
                                                    onChange={() => toggleAccessory(acc.name)}
                                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-gray-900">{acc.name}</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">+{formatPrice(acc.price)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Actions */}
                        <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                            {/* Quantity */}
                            <div className="flex items-center border border-gray-300 rounded-lg">
                                <button onClick={() => setQuantity((q: number) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-100">-</button>
                                <span className="px-3 py-2 font-medium text-gray-900 w-12 text-center">{quantity}</span>
                                <button onClick={() => setQuantity((q: number) => q + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100">+</button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                Thêm vào giỏ - {formatPrice(totalPrice * quantity)}
                            </button>
                        </div>

                        <div className="mt-8 prose prose-sm text-gray-600">
                            <h3 className="text-gray-900">Mô tả sản phẩm</h3>
                            <p className="whitespace-pre-line">
                                {product.customer_description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
