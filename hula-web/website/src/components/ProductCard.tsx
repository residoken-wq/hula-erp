'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface Product {
    id: number;
    sku: string;
    name: string;
    base_price: number;
    image_url?: string;
    category?: string;
}

interface ProductCardProps {
    product: Product;
}

const getGoogleDriveImageUrl = (url?: string) => {
    if (!url) return '';
    // Check if it's a Google Drive link
    if (url.includes('drive.google.com')) {
        // Extract ID from /file/d/ID/view or ?id=ID
        let id = '';
        const parts = url.split('/');
        const fileIndex = parts.indexOf('d');

        if (fileIndex !== -1 && fileIndex + 1 < parts.length) {
            id = parts[fileIndex + 1].split('/')[0].split('?')[0];
        } else {
            const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match) id = match[1];
        }

        if (id) {
            return `https://drive.google.com/uc?export=view&id=${id}`;
        }
    }
    return url;
};

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
        addToCart(product);

        // Show success feedback
        setShowSuccess(true);
        setTimeout(() => {
            setIsAdding(false);
            setShowSuccess(false);
        }, 1500);
    };

    const imageUrl = getGoogleDriveImageUrl(product.image_url);

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* Image Container */}
            <Link href={`/san-pham/${product.sku}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🛏️</span>
                    </div>
                )}

                {/* Category Badge */}
                {product.category && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-600 rounded-full shadow-sm">
                        {product.category}
                    </span>
                )}

                {/* Quick View Button - Desktop hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end justify-center pb-4">
                    <span className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Xem chi tiết
                    </span>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4">
                <Link href={`/san-pham/${product.sku}`}>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                        <span className="text-lg sm:text-xl font-bold text-primary-600">
                            {formatPrice(product.base_price)}
                        </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={`relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${showSuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40'
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
                </div>
            </div>
        </div>
    );
}
