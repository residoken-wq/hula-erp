'use client';

import { useState, useEffect, useRef } from 'react';
import { resolveImageUrl } from '@/lib/utils';

interface JourneySliderProps {
    milestones?: Array<{
        title: string;
        description: string;
        icon?: string;
        image_url?: string;
    }>;
    subtitle?: string;
    socialLink?: string;
    bgColor?: string;
    textColor?: string;
}

const defaultMilestones = [
    { icon: '🏪', title: 'Showroom trải nghiệm', description: 'Đa dạng, nhiều mẫu mã tại...', image_url: '' },
    { icon: '👷', title: 'Nhân công lành nghề', description: 'Kỹ thuật cao mang lại chất...', image_url: '' },
    { icon: '📦', title: 'Kệ hàng nhà máy', description: 'Được sắp xếp khoa học, hiện đại, rộng...', image_url: '' },
    { icon: '🏢', title: 'Văn phòng hiện đại', description: 'Môi trường làm việc năng động...', image_url: '' },
];

export default function JourneySlider({ milestones, subtitle, socialLink, bgColor, textColor }: JourneySliderProps) {
    const items = (milestones && milestones.length > 0) ? milestones : defaultMilestones;
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (totalPages <= 1) return;
        const interval = setInterval(() => {
            setCurrentPage((prev) => (prev + 1) % totalPages);
        }, 6000);
        return () => clearInterval(interval);
    }, [totalPages]);

    const visibleItems = items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Title */}
                <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase mb-2 text-center" style={{ color: textColor || '#1a365d' }}>
                    Hành Trình HULA Đồng Hành Cùng Trường Học
                </h2>

                {/* Subtitle + social */}
                <div className="text-center mb-10">
                    <h3 className="text-lg lg:text-xl font-heading font-bold uppercase mb-1" style={{ color: textColor || '#1a365d' }}>
                        {subtitle || 'An Giấc Mỗi Ngày Cùng HULA'}
                    </h3>
                    {socialLink && (
                        <p className="text-sm opacity-70">
                            Theo dõi trang Facebook{' '}
                            <a href={socialLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                                @hula
                            </a>{' '}
                            để cập nhật sản phẩm và khuyến mãi mới nhất
                        </p>
                    )}
                </div>

                {/* Image slider */}
                <div ref={scrollRef} className="overflow-hidden">
                    <div 
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentPage * 100}%)` }}
                    >
                        {Array.from({ length: totalPages }).map((_, pageIndex) => (
                            <div key={pageIndex} className="w-full flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                {items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((item: any, index: number) => (
                                    <div key={index} className="group">
                                        <div className="aspect-[3/4] rounded-[12px] overflow-hidden bg-gray-100 mb-3 relative">
                                            {item.image_url ? (
                                                <img
                                                    src={resolveImageUrl(item.image_url)}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                    <span className="text-4xl">{item.icon || '📸'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-center leading-snug" style={{ color: textColor || '#4a5568' }}>
                                            {item.title}
                                        </p>
                                        {item.description && (
                                            <p className="text-xs text-center mt-1 opacity-60" style={{ color: textColor || '#718096' }}>
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation dots */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-primary-500 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                                    }`}
                                aria-label={`Page ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
