'use client';

import { useState, useEffect, FormEvent } from 'react';
import PageHeroBanner from '@/components/PageHeroBanner';

interface Settings {
    contact_phone?: string;
    contact_email?: string;
    contact_address?: string;
    banner_contact_title?: string;
    banner_contact_desc?: string;
    banner_contact_image?: string;
    facebook?: string;
    facebook_url?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    pinterest?: string;
    zalo_url?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ContactPage() {
    const [settings, setSettings] = useState<Settings>({});
    const [formData, setFormData] = useState({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        expected_quantity: '100-500',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/public/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const response = await fetch(`${API_URL}/public/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            setSubmitResult({ success: data.success, message: data.message });

            if (data.success) {
                setFormData({
                    company_name: '',
                    contact_person: '',
                    phone: '',
                    email: '',
                    address: '',
                    expected_quantity: '100-500',
                    notes: '',
                });
            }
        } catch (error) {
            setSubmitResult({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeroBanner
                title={settings.banner_contact_title || "Liên Hệ Với Chúng Tôi"}
                description={settings.banner_contact_desc || "Bạn là đại lý, trường mầm non hoặc muốn mua sỉ? Liên hệ ngay để được tư vấn"}
                backgroundImage={settings.banner_contact_image}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left: Contact Info */}
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            Liên Hệ Với Chúng Tôi
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Bạn là đại lý, trường mầm non hoặc muốn mua sỉ?
                            Điền form bên dưới để đội ngũ Sales của chúng tôi liên hệ tư vấn.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Hotline</h3>
                                    <a href={`tel:${settings.contact_phone || ''}`} className="text-primary-600 hover:text-primary-700 font-medium">
                                        {settings.contact_phone || 'Đang cập nhật...'}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Email</h3>
                                    <a href={`mailto:${settings.contact_email || ''}`} className="text-primary-600 hover:text-primary-700">
                                        {settings.contact_email || 'Đang cập nhật...'}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Địa chỉ</h3>
                                    <p className="text-gray-600">{settings.contact_address || 'Đang cập nhật...'}</p>
                                </div>
                            </div>

                            {/* Social Icons */}
                            <div className="flex items-center gap-3 pt-4">
                                {(settings.facebook || settings.facebook_url) && (
                                    <a href={settings.facebook || settings.facebook_url} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                                    </a>
                                )}
                                {settings.zalo_url && (
                                    <a href={settings.zalo_url} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" viewBox="0 0 48 48" fill="currentColor"><path d="M24 4C12.954 4 4 12.954 4 24c0 4.584 1.548 8.802 4.143 12.18L4.61 44l8.074-3.465C15.672 42.095 19.682 44 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4z"/></svg>
                                    </a>
                                )}
                                {settings.instagram && (
                                    <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                    </a>
                                )}
                                {settings.tiktok && (
                                    <a href={settings.tiktok} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                                    </a>
                                )}
                                {settings.youtube && (
                                    <a href={settings.youtube} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                    </a>
                                )}
                                {settings.linkedin && (
                                    <a href={settings.linkedin} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    </a>
                                )}
                                {settings.pinterest && (
                                    <a href={settings.pinterest} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-gray-100 hover:bg-primary-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z"/></svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* --- Login Portal Button --- */}
                        <div className="mt-10 pt-8 border-t border-gray-200">
                            <div className="bg-gradient-to-r from-[#23A7D3]/10 to-[#23A7D3]/5 rounded-2xl p-6 border border-[#23A7D3]/20">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-10 h-10 bg-[#23A7D3] rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Cổng Đối Tác B2B</h3>
                                        <p className="text-sm text-gray-500">Dành cho đại lý & trường học đã đăng ký</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Đăng nhập để xem lịch sử đơn hàng, báo giá, đặt hàng nhanh và nhận ưu đãi đối tác độc quyền.
                                </p>
                                <a
                                    href="https://erp.nemmamnon.com/portal/login"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#23A7D3] text-white font-semibold rounded-full shadow-lg shadow-[#23A7D3]/30 hover:bg-[#1e8fb5] hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Đăng Nhập Đối Tác
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Đăng Ký Mua Hàng Sỉ
                        </h2>

                        {submitResult && (
                            <div className={`mb-6 p-4 rounded-lg ${submitResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {submitResult.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên doanh nghiệp / Trường <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    placeholder="VD: Trường Mầm Non ABC"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Người đại diện <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    placeholder="Họ và tên"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                        placeholder="0912 345 678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    placeholder="Địa chỉ giao hàng"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số lượng dự kiến
                                </label>
                                <select
                                    value={formData.expected_quantity}
                                    onChange={(e) => setFormData({ ...formData, expected_quantity: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                >
                                    <option value="10-50">10 - 50 sản phẩm</option>
                                    <option value="50-100">50 - 100 sản phẩm</option>
                                    <option value="100-500">100 - 500 sản phẩm</option>
                                    <option value="500+">Trên 500 sản phẩm</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                                    placeholder="Yêu cầu đặc biệt hoặc câu hỏi..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Đăng Ký Ngay'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
