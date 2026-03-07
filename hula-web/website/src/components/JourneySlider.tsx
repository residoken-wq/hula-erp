'use client';

interface JourneySliderProps {
    milestones?: Array<{
        title: string;
        description: string;
        icon?: string;
    }>;
    bgColor?: string;
    textColor?: string;
}

const defaultMilestones = [
    { icon: '🏆', title: '10 năm kinh nghiệm', description: 'Đồng hành cùng hàng trăm trường học trên toàn quốc' },
    { icon: '🎨', title: 'Thiết kế nhận diện', description: 'In thêu logo, màu sắc theo thương hiệu riêng của trường' },
    { icon: '🏭', title: 'Sản xuất khép kín', description: 'Quy trình sản xuất hiện đại, kiểm soát chất lượng chặt chẽ' },
    { icon: '🚚', title: 'Giao hàng toàn quốc', description: 'Vận chuyển miễn phí, lắp đặt tận nơi trên 63 tỉnh thành' },
];

export default function JourneySlider({ milestones, bgColor, textColor }: JourneySliderProps) {
    const items = (milestones && milestones.length > 0) ? milestones : defaultMilestones;

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold" style={{ color: textColor || undefined }}>
                        Hành Trình HULA Đồng Hành Cùng Trường Học
                    </h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="text-center group"
                        >
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-50 to-section-blue rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">{item.icon || '⭐'}</span>
                            </div>
                            <h3 className="font-heading font-semibold text-gray-800 mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
