'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { resolveImageUrl } from '@/lib/utils';

interface GalleryViewerProps {
    images: string[];
    title?: string;
}

export default function GalleryViewer({ images, title }: GalleryViewerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openModal = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextImage = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, nextImage, prevImage]);

    if (!images || images.length === 0) return null;

    return (
        <section className="container mx-auto px-4 py-8 md:py-16">
            {title && (
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-[#2C3E50] relative overflow-hidden inline-block left-1/2 -translate-x-1/2">
                    {title}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#23A7D3] rounded-full transform translate-y-1"></div>
                </h2>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {images.map((url, idx) => (
                    <div 
                        key={idx} 
                        className="group relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gray-100"
                        onClick={() => openModal(idx)}
                    >
                        <img
                            src={resolveImageUrl(url)}
                            alt={`Gallery image ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Lightbox */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in"
                    onClick={closeModal}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 z-10"
                        onClick={closeModal}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>

                    <div 
                        className="relative w-full max-w-6xl max-h-[90vh] px-4 flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Navigation Arrows */}
                        <button 
                            className="absolute left-2 md:left-10 text-white/50 hover:text-white transition-all transform hover:scale-110 p-2 md:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm z-20"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        
                        <div className="relative group overflow-hidden rounded-xl shadow-2xl mx-12 md:mx-0">
                            <img
                                src={resolveImageUrl(images[currentIndex])}
                                alt={`Fullscreen view ${currentIndex + 1}`}
                                className="max-w-full max-h-[85vh] object-contain select-none animate-slide-up"
                            />
                            
                            {/* Mobile Navigation Areas (Touch) */}
                            <div className="md:hidden absolute inset-0 flex">
                                <div className="w-1/2 h-full" onClick={(e) => { e.stopPropagation(); prevImage(); }} />
                                <div className="w-1/2 h-full" onClick={(e) => { e.stopPropagation(); nextImage(); }} />
                            </div>
                        </div>

                        <button 
                            className="absolute right-2 md:right-10 text-white/50 hover:text-white transition-all transform hover:scale-110 p-2 md:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm z-20"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>

                        {/* Counter */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 font-medium tracking-widest text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </section>
    );
}
