'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils';
import Image from 'next/image';
import FlipbookModal from './FlipbookModal';

interface CategoryCardsProps {
    categories?: Array<{
        title: string;
        image_url?: string;
        slug?: string;
        icon?: string;
        brochure_images?: string[];
        projects?: number[];
    }>;
    bgColor?: string;
    textColor?: string;
}

const defaultCategories = [
    { title: 'Bộ nệm gối mền', image_url: '', slug: '/san-pham?category=nem-goi-men', icon: '🛏️' },
    { title: 'Túi ngủ', image_url: '', slug: '/san-pham?category=tui-ngu', icon: '👶' },
    { title: 'Túi bảo quản', image_url: '', slug: '/san-pham?category=tui-bao-quan', icon: '👜' },
    { title: 'Sản phẩm khác', image_url: '', slug: '/san-pham', icon: '✨' },
];

export default function CategoryCards({ categories, bgColor, textColor }: CategoryCardsProps) {
    const items = (categories && categories.length > 0) ? categories : defaultCategories;
    const [selectedCat, setSelectedCat] = useState<any>(null);

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold" style={{ color: textColor || undefined }}>
                        Danh Mục Sản Phẩm
                    </h2>
                    <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
                        Khám phá các sản phẩm tiêu chuẩn cao cấp dành cho không gian mầm non
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                    {items.map((cat: any, index: number) => {
                        const hasBrochure = cat.brochure_images && cat.brochure_images.length > 0;
                        
                        const CardContent = (
                            <div className="group cursor-pointer block text-center">
                                {/* Image with modern rounded styling and shadow */}
                                <div className="aspect-[4/3] rounded-[24px] bg-white shadow-sm border border-gray-100 flex items-center justify-center relative overflow-hidden mb-4 group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                                    {cat.image_url ? (
                                        <Image
                                            src={resolveImageUrl(cat.image_url)}
                                            alt={cat.title}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-section-blue to-primary-50 opacity-50"></div>
                                    )}
                                    
                                    {!cat.image_url && cat.icon && (
                                        <span className="text-6xl lg:text-7xl relative z-10 group-hover:scale-110 transition-transform duration-500">
                                            {cat.icon}
                                        </span>
                                    )}

                                    {/* E-brochure indicator */}
                                    {hasBrochure && (
                                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-primary-600 p-2 rounded-full shadow-md z-20">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Title */}
                                <h3 className="font-heading font-semibold text-sm lg:text-lg group-hover:text-primary-600 transition-colors" style={{ color: textColor || '#1F2937' }}>
                                    {cat.title}
                                </h3>
                                {hasBrochure && (
                                    <span className="text-xs text-gray-500 mt-1 block">Xem E-Brochure</span>
                                )}
                            </div>
                        );

                        if (hasBrochure) {
                            return (
                                <div key={index} onClick={() => setSelectedCat(cat)}>
                                    {CardContent}
                                </div>
                            );
                        }

                        return (
                            <Link key={index} href={cat.slug || '/san-pham'}>
                                {CardContent}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Modal Flipbook */}
            <FlipbookModal 
                isOpen={!!selectedCat}
                onClose={() => setSelectedCat(null)}
                images={selectedCat?.brochure_images || []}
                projects={selectedCat?.projects || []}
            />
        </section>
    );
}
