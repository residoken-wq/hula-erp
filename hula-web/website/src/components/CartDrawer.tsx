'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CartDrawer() {
    const { items, itemCount, total, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Handle animations
    useEffect(() => {
        if (isCartOpen) {
            setIsVisible(true);
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isCartOpen]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const handleClose = () => {
        setIsCartOpen(false);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop with fade animation */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={handleClose}
            />

            {/* Drawer - Full screen on mobile, sidebar on desktop */}
            <div
                className={`fixed z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out
                    /* Mobile: Bottom sheet */
                    inset-x-0 bottom-0 h-[85vh] rounded-t-3xl
                    /* Desktop: Right sidebar */
                    md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-full md:max-w-md md:rounded-none md:rounded-l-2xl
                    ${isAnimating
                        ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
                        : 'translate-y-full md:translate-y-0 md:translate-x-full'
                    }`}
            >
                {/* Handle bar (mobile only) */}
                <div className="md:hidden flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Giỏ hàng</h2>
                            <p className="text-sm text-gray-500">{itemCount} sản phẩm</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-6 py-12">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                <span className="text-5xl">🛒</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Giỏ hàng trống</h3>
                            <p className="text-gray-500 text-center mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-white transition-all active:scale-95"
                            >
                                Khám phá sản phẩm
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {items.map((item, index) => (
                                <div
                                    key={item.instanceId}
                                    className="flex gap-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Product Image */}
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden shadow-inner">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                                                <span className="text-3xl">🛏️</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight">
                                            {item.name}
                                        </h3>
                                        {item.customization && item.customization.note && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 bg-gray-50 p-1 rounded">
                                                {item.customization.note}
                                            </p>
                                        )}
                                        <p className="text-primary-600 font-bold text-base sm:text-lg mt-1">
                                            {formatPrice(item.price)}
                                        </p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center justify-between mt-auto pt-2">
                                            <div className="flex items-center bg-gray-100 rounded-xl p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.instanceId, item.quantity - 1)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                </button>
                                                <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.instanceId, item.quantity + 1)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.instanceId)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all active:scale-95"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Footer - Enhanced */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 bg-white p-5 space-y-4 safe-area-inset-bottom">
                        {/* Summary */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Tổng thanh toán</p>
                                <p className="text-2xl font-bold text-gray-900">{formatPrice(total)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Miễn phí vận chuyển</p>
                                <p className="text-sm text-green-600 font-medium">Tiết kiệm 30.000đ</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 py-3.5 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-[#23a7d3] hover:text-[#23a7d3] transition-all active:scale-[0.98]"
                            >
                                Mua thêm
                            </button>
                            <Link
                                href="/checkout"
                                onClick={handleClose}
                                className="flex-[2] py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-center rounded-xl hover:bg-none hover:bg-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Thanh toán
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
