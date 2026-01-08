'use client';

import Link from 'next/link';

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

export default function ProductCard({ product }: ProductCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-6xl">🛏️</span>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-primary-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-primary-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {product.category && (
                    <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                        {product.category}
                    </span>
                )}

                <Link href={`/san-pham/${product.sku}`}>
                    <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">
                        {formatPrice(product.base_price)}
                    </span>

                    <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                        Thêm
                    </button>
                </div>
            </div>
        </div>
    );
}
