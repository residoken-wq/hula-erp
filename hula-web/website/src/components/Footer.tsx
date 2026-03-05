'use client';

import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';

export default function Footer() {
    const { settings, loading } = useSettings();

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

                    {/* Column 1: Logo + Contact */}
                    <div>
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[12px] flex items-center justify-center">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="font-heading font-bold text-xl text-white">HULA</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Hơn 10 năm đồng hành cùng giấc ngủ học đường. Giải pháp nệm, gối, chăn trường học toàn diện.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                {loading ? (
                                    <span className="text-sm animate-pulse">Đang tải...</span>
                                ) : settings.contact_phone ? (
                                    <a href={`tel:${settings.contact_phone}`} className="text-sm hover:text-primary-400 transition-colors font-medium">
                                        {settings.contact_phone}
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-500">Chưa cập nhật</span>
                                )}
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {loading ? (
                                    <span className="text-sm animate-pulse">Đang tải...</span>
                                ) : settings.contact_email ? (
                                    <a href={`mailto:${settings.contact_email}`} className="text-sm hover:text-primary-400 transition-colors">
                                        {settings.contact_email}
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-500">Chưa cập nhật</span>
                                )}
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                {loading ? (
                                    <span className="text-sm animate-pulse">Đang tải...</span>
                                ) : settings.contact_address ? (
                                    <span className="text-sm leading-relaxed">{settings.contact_address}</span>
                                ) : (
                                    <span className="text-sm text-gray-500">Chưa cập nhật</span>
                                )}
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Menu nhanh + Sản phẩm */}
                    <div>
                        <h3 className="text-white font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Menu nhanh</h3>
                        <ul className="space-y-2.5 mb-8">
                            <li><Link href="/" className="text-sm hover:text-primary-400 transition-colors">Trang chủ</Link></li>
                            <li><Link href="/ve-hula" className="text-sm hover:text-primary-400 transition-colors">Về Hula</Link></li>
                            <li><Link href="/du-an" className="text-sm hover:text-primary-400 transition-colors">Dự án</Link></li>
                            <li><Link href="/dat-hang-si" className="text-sm hover:text-primary-400 transition-colors">Đặt hàng B2B</Link></li>
                            <li><Link href="/lien-he" className="text-sm hover:text-primary-400 transition-colors">Liên hệ</Link></li>
                        </ul>

                        <h3 className="text-white font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Sản phẩm</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/san-pham" className="text-sm hover:text-primary-400 transition-colors">Hula Shop</Link></li>
                            <li><Link href="/tin-tuc" className="text-sm hover:text-primary-400 transition-colors">Blog tư vấn</Link></li>
                            <li><Link href="/chinh-sach" className="text-sm hover:text-primary-400 transition-colors">Chính sách</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Google Maps */}
                    <div>
                        <h3 className="text-white font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Bản đồ</h3>
                        <div className="rounded-[12px] overflow-hidden">
                            {settings.google_maps_url ? (
                                <iframe
                                    src={settings.google_maps_url}
                                    width="100%"
                                    height="200"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="HULA Location"
                                ></iframe>
                            ) : (
                                <div className="w-full h-[200px] bg-gray-800 rounded-[12px] flex items-center justify-center">
                                    <span className="text-gray-500 text-sm">Bản đồ chưa được cấu hình</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 4: Facebook Page + Social */}
                    <div>
                        <h3 className="text-white font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Kết nối</h3>
                        {settings.facebook_page_url ? (
                            <div className="rounded-[12px] overflow-hidden mb-6">
                                <iframe
                                    src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(settings.facebook_page_url)}&tabs=timeline&width=300&height=200&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                                    width="100%"
                                    height="200"
                                    style={{ border: 'none', overflow: 'hidden' }}
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    title="Facebook Page"
                                ></iframe>
                            </div>
                        ) : (
                            <div className="w-full h-[200px] bg-gray-800 rounded-[12px] flex items-center justify-center mb-6">
                                <span className="text-gray-500 text-sm">Facebook chưa được cấu hình</span>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            {settings.facebook_url && (
                                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-[12px] flex items-center justify-center text-gray-400 hover:text-white transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                                    </svg>
                                </a>
                            )}
                            {settings.zalo_url && (
                                <a href={settings.zalo_url} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-blue-500 rounded-[12px] flex items-center justify-center text-gray-400 hover:text-white transition-all">
                                    <svg className="w-5 h-5" viewBox="0 0 48 48" fill="currentColor">
                                        <path d="M24 4C12.954 4 4 12.954 4 24c0 4.584 1.548 8.802 4.143 12.18L4.61 44l8.074-3.465C15.672 42.095 19.682 44 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} HULA - Giải pháp nệm trường học toàn diện. Tất cả quyền được bảo lưu.
                    </p>
                </div>
            </div>
        </footer>
    );
}
