'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import HTMLFlipBook from 'react-pageflip';
import useSound from 'use-sound';
import { resolveImageUrl } from '@/lib/utils';
import Link from 'next/link';

interface Project {
    id: number;
    title: string;
    image_url: string;
    slug: string;
}

interface FlipbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    projects: number[];
}

export default function FlipbookModal({ isOpen, onClose, images, projects }: FlipbookModalProps) {
    const [page, setPage] = useState(0);
    const bookRef = useRef<any>(null);
    const [playFlip] = useSound('/sounds/page-flip.mp3', { volume: 0.5 });
    const [projectDetails, setProjectDetails] = useState<Project[]>([]);

    useEffect(() => {
        if (isOpen && projects && projects.length > 0) {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api') + '/public/projects?limit=100';
            fetch(apiUrl)
                .then(res => res.json())
                .then(data => {
                    if (data?.data) {
                        const matched = data.data.filter((p: any) => projects.includes(p.id));
                        setProjectDetails(matched);
                    }
                })
                .catch(err => console.error("Failed to load projects", err));
        }
    }, [isOpen, projects]);

    if (!isOpen) return null;

    const onFlip = (e: any) => {
        setPage(e.data);
        try {
            playFlip();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8 transition-opacity">
            {/* Close button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[101]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Flipbook Container */}
            <div className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center relative">
                {images && images.length > 0 ? (
                    <div className="relative w-full max-w-[1024px] flex items-center justify-center mt-4">
                        <HTMLFlipBook 
                            width={1024} 
                            height={1024} 
                            size="stretch"
                            minWidth={300}
                            maxWidth={1024}
                            minHeight={300}
                            maxHeight={1024}
                            maxShadowOpacity={0.5}
                            showCover={true}
                            mobileScrollSupport={true}
                            onFlip={onFlip}
                            className="flipbook-wrapper mx-auto"
                            ref={bookRef}
                            style={{ margin: '0 auto' }}
                        >
                            {images.map((img, i) => (
                                <div key={i} className="page bg-white shadow-xl overflow-hidden relative border border-gray-200">
                                    <Image 
                                        src={resolveImageUrl(img)} 
                                        alt={`Page ${i + 1}`} 
                                        fill 
                                        className="object-contain bg-white" 
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </HTMLFlipBook>
                        
                        {/* Navigation Arrows */}
                        <button 
                            className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 hidden md:block"
                            onClick={() => bookRef.current?.pageFlip().flipPrev()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button 
                            className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 hidden md:block"
                            onClick={() => bookRef.current?.pageFlip().flipNext()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                ) : (
                    <div className="text-white text-xl">Đang cập nhật nội dung...</div>
                )}
                
                {images && images.length > 0 && (
                    <div className="text-white/70 text-sm mt-8 mb-4">
                        Trang {page + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Projects Footer Slider */}
            {projectDetails.length > 0 && (
                <div className="w-full max-w-6xl mt-auto pb-4 pt-4 border-t border-white/10">
                    <h4 className="text-white/80 text-sm mb-4 font-semibold uppercase tracking-wider text-center md:text-left">Dự án liên quan</h4>
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                        {projectDetails.map(p => (
                            <Link 
                                href={`/du-an/${p.slug}`} 
                                key={p.id}
                                onClick={onClose}
                                className="snap-start shrink-0 w-36 md:w-48 group block"
                            >
                                <div className="aspect-video relative rounded-lg overflow-hidden mb-2 bg-gray-800">
                                    <Image 
                                        src={resolveImageUrl(p.image_url)} 
                                        alt={p.title} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                        unoptimized
                                    />
                                </div>
                                <h5 className="text-white text-xs md:text-sm font-medium line-clamp-2 group-hover:text-primary-400 transition-colors">
                                    {p.title}
                                </h5>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
