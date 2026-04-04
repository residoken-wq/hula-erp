'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeroProps {
    title1: string;
    title2: string;
    description: string;
    btn1: string;
    btn2: string;
    images: string[];
}

export default function HeroSection({ title1, title2, description, btn1, btn2, images }: HeroProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto slide
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                            {title1}
                            <br />
                            <span className="text-secondary-400">{title2}</span>
                        </h1>
                        <p className="mt-6 text-lg text-primary-100 max-w-xl">
                            {description}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                href="/san-pham"
                                className="inline-flex items-center px-6 py-3 bg-white text-[#23a7d3] font-semibold rounded-lg hover:text-[#E5A82F] transition-colors shadow-lg"
                            >
                                {btn1}
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                href="/lien-he"
                                className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#23a7d3] transition-colors"
                            >
                                {btn2}
                            </Link>
                        </div>
                    </div>

                    {/* Hero Slider */}
                    <div className="relative">
                        <div className="w-full h-80 lg:h-96 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center overflow-hidden relative">
                            {images.length > 0 ? (
                                <>
                                    {images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={img}
                                                alt={`Hero Slide ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e: any) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    ))}

                                    {/* Dots */}
                                    {images.length > 1 && (
                                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                            {images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentSlide(idx)}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-6xl">🛏️</span>
                                    </div>
                                    <p className="mt-4 text-primary-100">Hero Image</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave decoration */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FAFBFC" />
                </svg>
            </div>
        </section>
    );
}
