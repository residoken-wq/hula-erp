'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

export default function CartDrawer() {
    const { items, itemCount, total, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    if (!isCartOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Giỏ hàng ({itemCount})
                    </h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">🛒</span>
                            </div>
                            <p className="text-gray-500">Giỏ hàng trống</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.sku} className="flex gap-4 bg-gray-50 rounded-lg p-3">
                                    {/* Product Image */}
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">🛏️</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</h3>
                                        <p className="text-primary-600 font-semibold mt-1">{formatPrice(item.price)}</p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item.sku)}
                                                className="ml-auto text-red-500 hover:text-red-600 p-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Tạm tính:</span>
                            <span className="text-xl font-bold text-primary-600">{formatPrice(total)}</span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={() => setIsCartOpen(false)}
                            className="block w-full py-3 bg-primary-600 text-white text-center font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            Tiến hành thanh toán
                        </Link>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="block w-full mt-2 py-2 text-gray-600 text-center hover:text-gray-900"
                        >
                            Tiếp tục mua sắm
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
