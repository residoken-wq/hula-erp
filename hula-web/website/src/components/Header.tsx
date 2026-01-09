'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { itemCount, setIsCartOpen } = useCart();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const navLinks = [
        { href: '/', label: 'Trang chủ', icon: '🏠' },
        { href: '/san-pham', label: 'Sản phẩm', icon: '📦' },
        { href: '/tin-tuc', label: 'Tin tức', icon: '📰' },
        { href: '/lien-he', label: 'Liên hệ', icon: '📞' },
    ];

    return (
        <>
            <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-lg shadow-lg shadow-gray-200/50'
                    : 'bg-white border-b border-gray-100'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900 hidden sm:block">HULA</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 font-medium rounded-xl transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Cart Button - Enhanced */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2.5 sm:p-3 rounded-xl bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-secondary-400 to-secondary-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-secondary-500/30 animate-bounce-subtle">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </button>

                            {/* CTA Button - Desktop */}
                            <Link
                                href="/lien-he"
                                className="hidden sm:inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all active:scale-95"
                            >
                                Mua sỉ
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={isMenuOpen
                                            ? "M6 18L18 6M6 6l12 12"
                                            : "M4 6h16M4 12h16M4 18h16"
                                        }
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu - Full Screen Overlay */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu Panel */}
                    <div className="fixed inset-x-0 top-16 bottom-0 bg-white z-40 md:hidden overflow-y-auto animate-slide-up">
                        <div className="p-4 space-y-2">
                            {navLinks.map((link, index) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-600 font-medium transition-all active:scale-[0.98]"
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <span className="text-2xl">{link.icon}</span>
                                    <span className="text-lg">{link.label}</span>
                                    <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="p-4 mt-4 space-y-3">
                            <Link
                                href="/lien-he"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98]"
                            >
                                <span>Liên hệ mua sỉ</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>

                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsCartOpen(true);
                                }}
                                className="flex items-center justify-center gap-2 w-full py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl transition-all active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span>Giỏ hàng</span>
                                {itemCount > 0 && (
                                    <span className="px-2 py-0.5 bg-secondary-500 text-white text-sm font-bold rounded-full">
                                        {itemCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Contact Info */}
                        <div className="p-4 mt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-3">Hỗ trợ khách hàng</p>
                            <a href="tel:0123456789" className="flex items-center gap-3 text-gray-700 font-medium">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <span>0123 456 789</span>
                            </a>
                        </div>
                    </div>
                </>
            )}

            {/* Custom animations */}
            <style jsx global>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
