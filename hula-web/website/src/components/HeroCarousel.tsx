'use client';

import { useState, useEffect } from 'react';
import { getGoogleDriveImageUrl } from '@/lib/utils';

interface HeroCarouselProps {
    images: string[];
}

export default function HeroCarousel({ images }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000); // 5 seconds per slide
        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-80 lg:h-96 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-6xl">🛏️</span>
                    </div>
                    <p className="mt-4 text-primary-100">Hero Image</p>
                </div>
            </div>
        );
    }

    // Single image optimization (preserve original style)
    if (images.length === 1) {
        return (
            <img
                src={getGoogleDriveImageUrl(images[0])}
                alt="Hero"
                className="w-full h-auto rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-500"
                style={{ maxHeight: 500, objectFit: 'contain' }}
            />
        );
    }

    return (
        <div className="relative w-full h-[300px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl bg-white/5 backdrop-blur-sm">
            {images.map((img, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    <img
                        src={getGoogleDriveImageUrl(img)}
                        alt={`Hero Slide ${index + 1}`}
                        className="w-full h-full object-contain"
                    />
                </div>
            ))}

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
