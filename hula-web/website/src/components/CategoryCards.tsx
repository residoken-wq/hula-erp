'use client';

import Link from 'next/link';

interface CategoryCardsProps {
    categories?: Array<{
        title: string;
        image_url?: string;
        slug?: string;
    }>;
}

const defaultCategories = [
    { title: 'Bộ nệm gối mền', image_url: '', slug: '/san-pham?category=nem-goi-men', icon: '🛏️' },
    { title: 'Túi ngủ', image_url: '', slug: '/san-pham?category=tui-ngu', icon: '👶' },
    { title: 'Túi bảo quản', image_url: '', slug: '/san-pham?category=tui-bao-quan', icon: '👜' },
    { title: 'Sản phẩm khác', image_url: '', slug: '/san-pham', icon: '✨' },
];

export default function CategoryCards({ categories }: CategoryCardsProps) {
    const items = (categories && categories.length > 0) ? categories : defaultCategories;

    return (
        <section className="py-16 lg:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900">
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
                            <div className="aspect-[4/3] bg-gradient-to-br from-section-blue to-primary-100 flex items-center justify-center relative overflow-hidden">
                                {cat.image_url ? (
                                    <img
                                        src={cat.image_url}
                                        alt={cat.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <span className="text-5xl lg:text-6xl group-hover:scale-110 transition-transform duration-300">
                                        {cat.icon || '📦'}
                                    </span>
                                )}
                            </div>
                            <div className="p-4 text-center">
                                <h3 className="font-heading font-semibold text-gray-800 group-hover:text-primary-500 transition-colors">
                                    {cat.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
