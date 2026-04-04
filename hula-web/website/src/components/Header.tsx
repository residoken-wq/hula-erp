'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { resolveImageUrl } from '@/lib/utils';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const { itemCount, setIsCartOpen } = useCart();
    const { settings } = useSettings();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    let hiddenPages: string[] = [];
    try {
        if (settings.hidden_pages) {
            hiddenPages = JSON.parse(settings.hidden_pages);
        }
    } catch (e) { }

    const navLinks = [
        { href: '/', label: 'Trang chủ' },
        { href: '/ve-hula', label: 'Về Hula' },
        { href: '/du-an', label: 'Dự án' },
        { href: '/dat-hang-si', label: 'Đặt hàng B2B' },
        { href: '/san-pham', label: 'Hula Shop' },
        { href: '/tin-tuc', label: 'Blog tư vấn' },
        { href: '/lien-he', label: 'Liên hệ' },
    ].filter(link => !hiddenPages.includes(link.href));

    const logoUrl = resolveImageUrl(settings.logo_url);

    return (
        <>
            <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/95 backdrop-blur-lg shadow-soft'
                : 'bg-white border-b border-gray-100'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-[72px]">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={settings.site_name || 'HULA'}
                                    className="h-[5rem] w-auto object-contain"
                                />
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[12px] flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
                                        <span className="text-white font-bold text-xl">H</span>
                                    </div>
                                    <span className="font-heading font-bold text-xl text-gray-900 hidden sm:block">HULA</span>
                                </>
                            )}
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-3 xl:px-4 py-2 text-sm xl:text-base font-medium rounded-[12px] hover:bg-transparent transition-all ${isActive ? 'text-[#F3CB58] font-bold' : 'text-[#23a7d3] hover:text-[#F3CB58]'}`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center space-x-2">
                            {/* Search Button */}
                            <button className="p-2.5 rounded-[12px] bg-transparent text-gray-500 hover:text-accent transition-all active:scale-95">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            {/* Cart Button */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2.5 rounded-[12px] bg-transparent text-gray-500 hover:text-accent transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-subtle">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </button>

                            {/* CTA Button - Desktop */}
                            <Link
                                href="/lien-he"
                                className="hidden sm:inline-flex items-center px-5 py-2.5 bg-primary-500 text-white font-semibold rounded-pill hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30 transition-all active:scale-95"
                            >
                                Tư vấn ngay
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-2.5 rounded-[12px] bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="fixed inset-x-0 top-16 bottom-0 bg-white z-40 lg:hidden overflow-y-auto animate-slide-up">
                        <div className="p-4 space-y-2">
                            {navLinks.map((link, index) => {
                                const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-4 p-4 rounded-[12px] bg-transparent font-medium transition-all active:scale-[0.98] ${isActive ? 'text-[#F3CB58] font-bold bg-primary-50' : 'text-[#23a7d3] hover:text-[#F3CB58] hover:bg-gray-50'}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <span className="text-lg">{link.label}</span>
                                        <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="p-4 mt-4 space-y-3">
                            <Link
                                href="/lien-he"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-primary-500 text-white font-semibold rounded-pill shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98]"
                            >
                                <span>Tư vấn ngay</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>

                            <button
                                onClick={() => { setIsMenuOpen(false); setIsCartOpen(true); }}
                                className="flex items-center justify-center gap-2 w-full py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-pill transition-all active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span>Giỏ hàng</span>
                                {itemCount > 0 && (
                                    <span className="px-2 py-0.5 bg-primary-500 text-white text-sm font-bold rounded-full">
                                        {itemCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
