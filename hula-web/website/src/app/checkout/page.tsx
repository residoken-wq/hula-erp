'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { resolveImageUrl } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, total, clearCart, itemCount } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderCode, setOrderCode] = useState('');
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_address: '',
        notes: '',
        payment_method: 'COD',
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const orderData = {
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                customer_email: formData.customer_email || undefined,
                delivery_address: formData.delivery_address,
                notes: formData.notes || undefined,
                payment_method: formData.payment_method,
                items: items.map(item => ({
                    sku: item.sku,
                    quantity: item.quantity,
                    unit_price: item.price,
                })),
            };

            const res = await fetch(`${API_URL}/api/public/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await res.json();

            if (data.success) {
                setOrderCode(data.order_code);
                setOrderSuccess(true);
                clearCart();
            } else {
                setError(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Order error:', err);
            setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success screen - Modern celebration style
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        {/* Success animation */}
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
                        <p className="text-gray-500 mb-6">Cảm ơn bạn đã tin tưởng HULA. Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>

                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 mb-6">
                            <p className="text-sm text-gray-500 mb-1">Mã đơn hàng của bạn</p>
                            <p className="text-2xl font-bold text-primary-600 tracking-wider">{orderCode}</p>
                        </div>

                        <Link
                            href="/san-pham"
                            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
                        >
                            <span>Tiếp tục mua sắm</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Empty cart - Friendly illustration style
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span className="text-6xl">🛒</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h1>
                    <p className="text-gray-500 mb-8">Hãy khám phá các sản phẩm nệm mầm non chất lượng cao của chúng tôi</p>
                    <Link
                        href="/san-pham"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
                    >
                        <span>Khám phá sản phẩm</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 lg:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/san-pham" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Thanh toán</h1>
                    <span className="ml-auto text-sm text-gray-500">{itemCount} sản phẩm</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Thanh toán an toàn & bảo mật</span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-3 order-2 lg:order-1">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Customer Info Section */}
                            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Thông tin người mua</h2>
                                </div>

                                {error && (
                                    <div className="mb-5 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="customer_phone"
                                                value={formData.customer_phone}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                                                placeholder="0912 345 678"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email <span className="text-gray-400">(tuỳ chọn)</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="customer_email"
                                                value={formData.customer_email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address Section */}
                            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h2>
                                </div>

                                <textarea
                                    name="delivery_address"
                                    value={formData.delivery_address}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                />
                            </div>

                            {/* Payment Method Section */}
                            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Phương thức thanh toán</h2>
                                </div>

                                <div className="space-y-3">
                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'COD' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="COD"
                                            checked={formData.payment_method === 'COD'}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-primary-600"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                                            <p className="text-sm text-gray-500">Thanh toán bằng tiền mặt cho shipper</p>
                                        </div>
                                        <span className="text-2xl">💵</span>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'BANK_TRANSFER' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="BANK_TRANSFER"
                                            checked={formData.payment_method === 'BANK_TRANSFER'}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-primary-600"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Chuyển khoản ngân hàng</p>
                                            <p className="text-sm text-gray-500">Chuyển khoản trước khi giao hàng</p>
                                        </div>
                                        <span className="text-2xl">🏦</span>
                                    </label>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú đơn hàng <span className="text-gray-400">(tuỳ chọn)</span>
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                                    placeholder="Ví dụ: Giao hàng giờ hành chính, gọi điện trước..."
                                />
                            </div>

                            {/* Submit Button - Mobile Fixed */}
                            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg safe-area-inset-bottom">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-500">Tổng thanh toán</span>
                                    <span className="text-xl font-bold text-primary-600">{formatPrice(total)}</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Đặt hàng ngay</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Desktop Submit */}
                            <div className="hidden lg:block">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Hoàn tất đặt hàng</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Spacer for mobile fixed button */}
                        <div className="h-32 lg:hidden" />
                    </div>

                    {/* Order Summary - Sticky Sidebar */}
                    <div className="lg:col-span-2 order-1 lg:order-2">
                        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 lg:sticky lg:top-24">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span>Đơn hàng</span>
                                <span className="text-sm font-normal text-gray-500">({itemCount} sản phẩm)</span>
                            </h2>

                            <div className="space-y-3 max-h-60 lg:max-h-80 overflow-y-auto">
                                {items.map((item) => (
                                    <div key={item.sku} className="flex gap-3 p-2 bg-gray-50 rounded-xl">
                                        <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
                                            {item.image_url ? (
                                                <img src={resolveImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 text-2xl">🛏️</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-500">x{item.quantity}</span>
                                                <span className="text-sm font-semibold text-primary-600">{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tạm tính</span>
                                    <span className="text-gray-900">{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Phí vận chuyển</span>
                                    <span className="text-green-600 font-medium">Miễn phí</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                                    <span className="text-gray-900">Tổng cộng</span>
                                    <span className="text-primary-600">{formatPrice(total)}</span>
                                </div>
                            </div>

                            {/* Trust badges */}
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Miễn phí đổi trả</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Bảo hành 12 tháng</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Giao hàng nhanh</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Thanh toán an toàn</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
