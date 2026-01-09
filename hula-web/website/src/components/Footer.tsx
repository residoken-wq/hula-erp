'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Settings {
    site_name?: string;
    contact_phone?: string;
    contact_email?: string;
    contact_address?: string;
    facebook_url?: string;
    zalo_url?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Footer() {
    const [settings, setSettings] = useState<Settings>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/api/public/settings`);
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

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="font-bold text-xl text-white">HULA</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Nệm mầm non HULA - Mang đến giấc ngủ ngon và an toàn cho bé yêu của bạn.
                            Chất liệu cao cấp, thiết kế thông minh, bảo hành uy tín.
                        </p>
                        <div className="flex space-x-4">
                            {settings.facebook_url && (
                                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                                    </svg>
                                </a>
                            )}
                            {settings.zalo_url && (
                                <a href={settings.zalo_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" viewBox="0 0 48 48" fill="currentColor">
                                        <path d="M24 4C12.954 4 4 12.954 4 24c0 4.584 1.548 8.802 4.143 12.18L4.61 44l8.074-3.465C15.672 42.095 19.682 44 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Liên kết nhanh</h3>
                        <ul className="space-y-2">
                            <li><Link href="/san-pham" className="hover:text-white transition-colors">Sản phẩm</Link></li>
                            <li><Link href="/tin-tuc" className="hover:text-white transition-colors">Tin tức</Link></li>
                            <li><Link href="/lien-he" className="hover:text-white transition-colors">Liên hệ mua sỉ</Link></li>
                            <li><Link href="/chinh-sach" className="hover:text-white transition-colors">Chính sách</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Liên hệ</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <a href={`tel:${settings.contact_phone || ''}`} className="hover:text-white transition-colors">
                                    {settings.contact_phone || 'Đang cập nhật...'}
                                </a>
                            </li>
                            <li className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href={`mailto:${settings.contact_email || ''}`} className="hover:text-white transition-colors">
                                    {settings.contact_email || 'Đang cập nhật...'}
                                </a>
                            </li>
                            <li className="flex items-start space-x-2">
                                <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{settings.contact_address || 'Đang cập nhật...'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                    <p>&copy; 2026 Nệm Mầm Non HULA. Tất cả quyền được bảo lưu.</p>
                </div>
            </div>
        </footer>
    );
}
