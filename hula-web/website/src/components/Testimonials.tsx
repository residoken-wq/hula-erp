'use client';

import { useState } from 'react';

interface TestimonialsProps {
    testimonials?: Array<{
        name: string;
        school: string;
        content: string;
        rating?: number;
        image_url?: string;
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
    },
    {
        name: 'Thầy Trần Văn B',
        school: 'Trường TH Ngôi Sao',
        content: 'Đội ngũ HULA tư vấn rất nhiệt tình, thiết kế logo riêng cho trường. Giao hàng đúng hẹn, chất lượng vượt mong đợi.',
        rating: 5,
        image_url: '',
    },
    {
        name: 'Cô Lê Thị C',
        school: 'Trường MN Quốc Tế ABC',
        content: 'Sản phẩm của HULA rất đẹp và chất lượng. Phụ huynh đều khen ngợi. Đã đặt thêm lần 3 cho năm học mới.',
        rating: 5,
        image_url: '',
    },
];

export default function Testimonials({ testimonials, bgColor, textColor }: TestimonialsProps) {
    const items = (testimonials && testimonials.length > 0) ? testimonials : defaultTestimonials;
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#B9E5FB', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold" style={{ color: textColor || undefined }}>
                        Đánh Giá Khách Hàng
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="bg-white rounded-[12px] p-6 shadow-soft hover:shadow-soft-md transition-shadow"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {Array.from({ length: item.rating || 5 }).map((_, i) => (
                                    <span key={i} className="text-yellow-400 text-lg">⭐</span>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                                &ldquo;{item.content}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span className="text-white font-bold text-sm">{item.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                    <p className="text-gray-500 text-xs">{item.school}</p>
                                </div>
                            </div>

                            {/* Photo if available */}
                            {item.delivery_image_url && (
                                <div className="mt-4 rounded-[8px] overflow-hidden">
                                    <img src={item.delivery_image_url} alt="Ảnh thực tế" className="w-full h-32 object-cover" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
