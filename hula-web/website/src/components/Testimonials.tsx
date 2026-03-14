'use client';

import { useState, useEffect } from 'react';
import { resolveImageUrl } from '@/lib/utils';

interface TestimonialsProps {
    testimonials?: Array<{
        name: string;
        school: string;
        content: string;
        rating?: number;
        image_url?: string;
        product_image_url?: string;
        product_name?: string;
    }>;
    bgColor?: string;
    textColor?: string;
}

const defaultTestimonials = [
    {
        name: 'Cô Nguyễn Thị A',
        school: 'Trường MN Hoa Sen',
        content: 'Trường rất hài lòng về sản phẩm của HULA. Nệm êm ái, chất liệu mềm mại, các bé rất thích. Sau 2 năm sử dụng vẫn giữ form tốt.',
        rating: 5,
        image_url: '',
        product_image_url: '',
        product_name: 'Bộ Chăn Ga Gối HULA Classic',
    },
    {
        name: 'Thầy Trần Văn B',
        school: 'Trường TH Ngôi Sao',
        content: 'Đội ngũ HULA tư vấn rất nhiệt tình, thiết kế logo riêng cho trường. Giao hàng đúng hẹn, chất lượng vượt mong đợi.',
        rating: 5,
        image_url: '',
        product_image_url: '',
        product_name: 'Nệm Mầm Non HULA Premium',
    },
    {
        name: 'Cô Lê Thị C',
        school: 'Trường MN Quốc Tế ABC',
        content: 'Sản phẩm của HULA rất đẹp và chất lượng. Phụ huynh đều khen ngợi. Đã đặt thêm lần 3 cho năm học mới.',
        rating: 5,
        image_url: '',
        product_image_url: '',
        product_name: 'Combo Tiết Kiệm HULA',
    },
];

export default function Testimonials({ testimonials, bgColor, textColor }: TestimonialsProps) {
    const items = (testimonials && testimonials.length > 0) ? testimonials : defaultTestimonials;
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % items.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [items.length]);

    const current = items[activeIndex] as any;

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#e6e7e8', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase" style={{ color: textColor || '#1a365d' }}>
                        Đánh Giá Từ Khách Hàng
                    </h2>
                </div>

                {/* Slider content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left — Review */}
                    <div className="bg-white rounded-[16px] p-8 lg:p-10">
                        {/* Stars */}
                        <div className="flex gap-1 mb-4">
                            {Array.from({ length: current.rating || 5 }).map((_: any, i: number) => (
                                <span key={i} className="text-yellow-400 text-lg">⭐</span>
                            ))}
                        </div>

                        {/* Quote */}
                        <p className="text-gray-700 text-sm lg:text-base leading-relaxed mb-6">
                            &ldquo;{current.content}&rdquo;
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {current.image_url ? (
                                    <img
                                        src={resolveImageUrl(current.image_url)}
                                        alt={current.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-bold">{current.name?.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{current.name}</p>
                                <p className="text-gray-500 text-sm">{current.school}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right — Product image */}
                    <div className="rounded-[16px] overflow-hidden aspect-[4/3] bg-gray-100">
                        {current.product_image_url ? (
                            <img
                                src={resolveImageUrl(current.product_image_url)}
                                alt={current.product_name || 'Sản phẩm'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-section-blue to-primary-100 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-6xl block mb-2">🛏️</span>
                                    <p className="text-primary-600 font-heading font-bold text-lg">
                                        {current.product_name || 'Sản phẩm HULA'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation dots */}
                {items.length > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {items.map((_: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-primary-500 w-8' : 'bg-gray-400 w-2 hover:bg-gray-500'
                                    }`}
                                aria-label={`Testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
