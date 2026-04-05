'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface Product {
    id: number;
    sku: string;
    name: string;
    website_display_name?: string;
    base_price?: number;  // From product detail API
    price?: number;       // From product list API
    original_price?: number; // Original price before sale
    sale_price?: number;     // Sale/promotional price
    contact_for_price?: boolean;
    image_url?: string;
    category?: string;
}

interface ProductCardProps {
    product: Product;
}

import { resolveImageUrl } from '@/lib/utils';

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAdding(true);
        addToCart({
            ...product,
            base_price: product.price ?? product.base_price ?? 0
        });

        // Show success feedback
        setShowSuccess(true);
        setTimeout(() => {
            setIsAdding(false);
            setShowSuccess(false);
        }, 1500);
    };

    const imageUrl = resolveImageUrl(product.image_url);
    const currentPrice = product.price ?? product.base_price ?? 0;
    const hasSale = !!(product.sale_price && product.original_price && product.original_price > product.sale_price);

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* Image Container */}
            <Link href={`/san-pham/${product.sku}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.website_display_name || product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                        <span className="text-6xl">🛏️</span>
                    </div>
                )}

                {/* Category Badge */}
                {product.category && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-600 rounded-full shadow-sm">
                        {product.category}
                    </span>
                )}

                {/* Sale Badge */}
                {hasSale && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                        -{Math.round((1 - product.sale_price! / product.original_price!) * 100)}%
                    </span>
                )}

            </Link>

            {/* Content */}
            <div className="p-4">
                <Link href={`/san-pham/${product.sku}`}>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-accent transition-colors">
                        {product.website_display_name || product.name}
                    </h3>
                </Link>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                        {product.contact_for_price ? (
                            <span className="text-lg sm:text-xl font-bold text-primary-600">
                                Liên hệ
                            </span>
                        ) : hasSale ? (
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-bold text-red-500">
                                    {formatPrice(currentPrice)}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-400 line-through">
                                    {formatPrice(product.original_price!)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-lg sm:text-xl font-bold text-primary-600">
                                {formatPrice(currentPrice)}
                            </span>
                        )}
                    </div>

                    {/* Add to Cart / Liên Hệ Button */}
                    {product.contact_for_price ? (
                        <Link
                            href={`/lien-he?product_sku=${product.sku}`}
                            className="relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 bg-primary-600 text-white border border-primary-600 hover:bg-primary-700 whitespace-nowrap"
                        >
                            Tư vấn
                        </Link>
                    ) : (
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className={`relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${showSuccess
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-900 border border-gray-200 hover:bg-[#23a7d3] hover:border-[#23a7d3]'
                                }`}
                        >
                            {showSuccess ? (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="hidden sm:inline">Đã thêm</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Thêm</span>
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
