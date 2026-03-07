'use client';

import { useState, useEffect } from 'react';
import { getGoogleDriveImageUrl } from '@/lib/utils';
import Link from 'next/link';

interface HeroSlide {
    url: string;
    alt?: string;
    title?: string;
    link?: string;
}

interface HeroCarouselProps {
    images: (string | HeroSlide)[];
    heroTitle1?: string;
    heroTitle2?: string;
    heroDescription?: string;
    heroButton1?: string;
    heroButton2?: string;
}

function resolveImageUrl(img: string | HeroSlide): string {
    const url = typeof img === 'string' ? img : img.url;
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
        const base = API_URL.endsWith('/api') ? API_URL.replace(/\/api$/, '') : API_URL;
        return `${base}/api/upload/files/${url.replace('/uploads/', '')}`;
    }
    return getGoogleDriveImageUrl(url);
}

function getAlt(img: string | HeroSlide, index: number): string {
    if (typeof img === 'string') return `Hero Slide ${index + 1}`;
    return img.alt || img.title || `Hero Slide ${index + 1}`;
}

function getLink(img: string | HeroSlide): string | undefined {
    if (typeof img === 'string') return undefined;
    return img.link;
}

export default function HeroCarousel({
    images,
    heroTitle1,
    heroTitle2,
    heroDescription,
    heroButton1,
    heroButton2,
}: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[60vh] lg:h-[80vh] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-6xl">🛏️</span>
                    </div>
                    <p className="mt-4 text-primary-100">Hero Image</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[60vh] lg:h-[80vh] overflow-hidden">
            {/* Background slides */}
            {images.map((img, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <img
                        src={resolveImageUrl(img)}
                        alt={getAlt(img, index)}
                        className="w-full h-full object-cover"
                    />
                    {/* Blur overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>
            ))}

            {/* Text + CTA overlay */}
            <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-heading font-bold leading-tight text-white drop-shadow-lg">
                            {heroTitle1 || 'Giấc Ngủ Học Đường'}
                            <br />
                            <span className="text-secondary-300">{heroTitle2 || 'Hoàn Hảo'}</span>
                        </h1>
                        <p className="mt-6 text-lg text-white/90 max-w-xl leading-relaxed drop-shadow">
                            {heroDescription || 'Giải pháp nệm trường học toàn diện - Hơn 10 năm đồng hành cùng hàng trăm trường học trên toàn quốc.'}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href="/san-pham"
                                className="inline-flex items-center px-7 py-3.5 bg-white text-primary-600 font-semibold rounded-pill hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                {heroButton1 || 'Xem Sản Phẩm'}
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                href="/lien-he"
                                className="inline-flex items-center px-7 py-3.5 border-2 border-white text-white font-semibold rounded-pill hover:bg-white hover:text-primary-600 transition-all"
                            >
                                {heroButton2 || 'Tư Vấn Ngay'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clickable link overlay for current slide */}
            {getLink(images[currentIndex]) && (
                <Link
                    href={getLink(images[currentIndex])!}
                    className="absolute bottom-20 right-8 z-30 px-4 py-2 bg-white/20 backdrop-blur-md text-white text-sm rounded-full hover:bg-white/30 transition-all"
                >
                    Xem thêm →
                </Link>
            )}

            {/* Navigation dots */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
