'use client';

import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils';

interface CategoryCardsProps {
    categories?: Array<{
        title: string;
        image_url?: string;
        slug?: string;
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

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold" style={{ color: textColor || undefined }}>
                        Danh Mục Sản Phẩm
                    </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {items.map((cat: any, index: number) => (
                        <Link
                            key={index}
                            href={cat.slug || '/san-pham'}
                            className="card-v2 group overflow-hidden cursor-pointer"
                        >
                            {/* Image — no card, no border, no shadow */}
                            <div className="aspect-[4/3] bg-gradient-to-br from-section-blue to-primary-100 flex items-center justify-center relative overflow-hidden">
                                {cat.image_url ? (
                                    <img
                                        src={resolveImageUrl(cat.image_url)}
                                        alt={cat.title}
                                        className="w-full h-full object-cover"
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
