'use client';

import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { useState, useEffect } from 'react';
import { resolveImageUrl } from '@/lib/utils';

interface FooterLink {
    id: string;
    label: string;
    url: string;
}

interface FooterConfig {
    footer_bg?: string;
    footer_text_color?: string;
    footer_slogan?: string;
    footer_copyright?: string;
    footer_quick_links?: FooterLink[];
    footer_product_links?: FooterLink[];
}

const defaultQuickLinks: FooterLink[] = [
    { id: '1', label: 'Trang chủ', url: '/' },
    { id: '2', label: 'Về Hula', url: '/ve-hula' },
    { id: '3', label: 'Dự án', url: '/du-an' },
    { id: '4', label: 'Đặt hàng B2B', url: '/dat-hang-si' },
    { id: '5', label: 'Tuyển dụng', url: '/tuyen-dung' },
    { id: '6', label: 'Liên hệ', url: '/lien-he' },
];

const defaultProductLinks: FooterLink[] = [
    { id: '1', label: 'Hula Shop', url: '/san-pham' },
    { id: '2', label: 'Blog tư vấn', url: '/tin-tuc' },
    { id: '3', label: 'Chính sách', url: '/chinh-sach' },
];

export default function Footer() {
    const { settings, loading } = useSettings();
    const [footerConfig, setFooterConfig] = useState<FooterConfig>({});

    useEffect(() => {
        const fetchFooterConfig = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const res = await fetch(`${apiUrl}/public/home-config`, {
                    cache: 'no-store',
                    headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    setFooterConfig({
                        footer_bg: typeof data.footer_bg === 'string' ? data.footer_bg : data.footer_bg?.toHexString ? data.footer_bg.toHexString() : data.footer_bg?.metaColor?.originalInput?.hex,
                        footer_text_color: typeof data.footer_text_color === 'string' ? data.footer_text_color : data.footer_text_color?.toHexString ? data.footer_text_color.toHexString() : data.footer_text_color?.metaColor?.originalInput?.hex,
                        footer_slogan: data.footer_slogan,
                        footer_copyright: data.footer_copyright,
                        footer_quick_links: data.footer_quick_links,
                        footer_product_links: data.footer_product_links,
                    });
                }
            } catch (error) {
                console.error('Error fetching footer config:', error);
            }
        };
        fetchFooterConfig();
    }, []);

    let hiddenPages: string[] = [];
    try {
        if (settings.hidden_pages) {
            hiddenPages = JSON.parse(settings.hidden_pages);
        }
    } catch (e) { }

    const slogan = footerConfig.footer_slogan || 'Hơn 10 năm đồng hành cùng giấc ngủ học đường. Giải pháp nệm, gối, chăn trường học toàn diện.';
    const copyright = footerConfig.footer_copyright || `© ${new Date().getFullYear()} HULA - Giải pháp nệm trường học toàn diện. Tất cả quyền được bảo lưu.`;
    const quickLinks = ((footerConfig.footer_quick_links && footerConfig.footer_quick_links.length > 0) ? footerConfig.footer_quick_links : defaultQuickLinks).filter(link => !hiddenPages.includes(link.url));
    const productLinks = ((footerConfig.footer_product_links && footerConfig.footer_product_links.length > 0) ? footerConfig.footer_product_links : defaultProductLinks).filter(link => !hiddenPages.includes(link.url));

    const bgStyle = footerConfig.footer_bg && typeof footerConfig.footer_bg === 'string' ? { backgroundColor: footerConfig.footer_bg } : {};
    const textStyle = footerConfig.footer_text_color && typeof footerConfig.footer_text_color === 'string' ? { color: footerConfig.footer_text_color } : {};

    const getIframeSrc = (input: string) => {
        if (!input) return '';
        const match = input.match(/src="([^"]+)"/);
        return match ? match[1] : input;
    };
    const mapsUrl = getIframeSrc(settings.google_maps_url || '');

    return (
        <footer className={`bg-gray-900 text-gray-300`} style={{ ...bgStyle, ...textStyle }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

                    {/* Column 1: Logo + Contact */}
                    <div>
                        <Link href="/" className="flex items-center space-x-2 mb-6 inline-block">
                            {settings.logo_url ? (
                                <img
                                    src={resolveImageUrl(settings.logo_url, 'original')}
                                    alt={settings.site_name || 'HULA'}
                                    className="h-20 md:h-24 lg:h-[12rem] w-auto object-contain max-w-[280px] md:max-w-[320px] lg:max-w-[400px]"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[12px] flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">H</span>
                                    </div>
                                    <span className="font-heading font-bold text-xl text-white">HULA</span>
                                </>
                            )}
                        </Link>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {slogan}
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
                                    <a href={`tel:${settings.contact_phone}`} className="text-sm hover:text-accent transition-colors font-medium">
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
                                    <a href={`mailto:${settings.contact_email}`} className="text-sm hover:text-accent transition-colors">
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
                            {quickLinks.map((link) => (
                                <li key={link.id}>
                                    <Link href={link.url} className="text-sm hover:text-accent transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <h3 className="text-white font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Sản phẩm</h3>
                        <ul className="space-y-2.5">
                            {productLinks.map((link) => (
                                <li key={link.id}>
                                    <Link href={link.url} className="text-sm hover:text-accent transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Google Maps */}
                    <div>
                        <h3 className="text-white font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Bản đồ</h3>
                        <div className="rounded-[12px] overflow-hidden">
                            {mapsUrl ? (
                                <iframe
                                    src={mapsUrl}
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
                                    src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(settings.facebook_page_url)}&tabs=timeline&width=300&height=200&small_header=true&adapt_container_width=false&hide_cover=false&show_facepile=true`}
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
                            {(settings.facebook || settings.facebook_url) && (
                                <a href={settings.facebook || settings.facebook_url} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                                    </svg>
                                </a>
                            )}
                            {settings.zalo_url && (
                                <a href={settings.zalo_url} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" viewBox="0 0 48 48" fill="currentColor">
                                        <path d="M24 4C12.954 4 4 12.954 4 24c0 4.584 1.548 8.802 4.143 12.18L4.61 44l8.074-3.465C15.672 42.095 19.682 44 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4z" />
                                    </svg>
                                </a>
                            )}
                            {settings.instagram && (
                                <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                    </svg>
                                </a>
                            )}
                            {settings.tiktok && (
                                <a href={settings.tiktok} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                    </svg>
                                </a>
                            )}
                            {settings.youtube && (
                                <a href={settings.youtube} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                </a>
                            )}
                            {settings.linkedin && (
                                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                </a>
                            )}
                            {settings.pinterest && (
                                <a href={settings.pinterest} target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-transparent rounded-[12px] flex items-center justify-center text-gray-400 hover:text-accent transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z"/>
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-gray-500 text-sm">
                        {copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}
