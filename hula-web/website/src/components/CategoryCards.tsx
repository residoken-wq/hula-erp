'use client';

import Link from 'next/link';
import { getGoogleDriveImageUrl } from '@/lib/utils';

interface CategoryCardsProps {
    categories?: Array<{
        title: string;
        image_url?: string;
        slug?: string;
        icon?: string;
    }>;
    bgColor?: string;
    textColor?: string;
}

const defaultCategories = [
    { title: 'Nệm', image_url: '', slug: '/san-pham?category=nem', icon: '🛏️' },
    { title: 'Gối', image_url: '', slug: '/san-pham?category=goi', icon: '🌙' },
    { title: 'Bộ Ga Giường', image_url: '', slug: '/san-pham?category=ga-giuong', icon: '🛌' },
    { title: 'Combo Tiết Kiệm', image_url: '', slug: '/san-pham?category=combo', icon: '✨' },
];

export default function CategoryCards({ categories, bgColor, textColor }: CategoryCardsProps) {
    const items = (categories && categories.length > 0) ? categories : defaultCategories;

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold" style={{ color: textColor || undefined }}>
                        Danh Mục Sản Phẩm
                    </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {items.map((cat: any, index: number) => (
                        <Link
                            key={index}
                            href={cat.slug || '/san-pham'}
                            className="group text-center"
                        >
                            {/* Image — no card, no border, no shadow */}
                            <div className="aspect-square bg-white rounded-[12px] overflow-hidden mb-4 flex items-center justify-center">
                                {cat.image_url ? (
                                    <img
                                        src={getGoogleDriveImageUrl(cat.image_url)}
                                        alt={cat.title}
                                        className="w-full h-full object-contain p-4"
                                    />
                                ) : (
                                    <span className="text-6xl lg:text-7xl">
                                        {cat.icon || '📦'}
                                    </span>
                                )}
                            </div>
                            {/* Text below, separated */}
                            <h3 className="font-heading font-semibold text-sm lg:text-base group-hover:text-accent transition-colors" style={{ color: textColor || '#1F2937' }}>
                                {cat.title}
                            </h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
