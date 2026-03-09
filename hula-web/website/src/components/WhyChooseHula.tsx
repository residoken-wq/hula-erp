'use client';

import { getGoogleDriveImageUrl } from '@/lib/utils';

interface WhyChooseHulaProps {
    reasons?: Array<{
        title: string;
        description: string;
    }>;
    guarantees?: Array<{
        icon?: string;
        icon_url?: string;
        title: string;
        description?: string;
    }>;
    bgColor?: string;
    textColor?: string;
}

const defaultReasons = [
    {
        title: 'Kinh nghiệm 10 năm',
        description: 'Hơn một thập kỷ đồng hành cùng các hệ thống giáo dục, chúng tôi thấu hiểu sâu sắc nhu cầu và tiêu chuẩn khắt khe của môi trường học đường.',
    },
    {
        title: 'Không ngừng cải tiến',
        description: 'Đội ngũ chuyên gia tận tâm liên tục nghiên cứu và phát triển, mang đến những giải pháp tối ưu nhất về công năng lẫn trải nghiệm.',
    },
    {
        title: 'Đậm dấu ấn thương hiệu',
        description: 'Tư vấn và thiết kế sản phẩm "may đo" theo đúng màu sắc nhận diện, giúp chuẩn hóa không gian và nâng tầm hình ảnh chuyên nghiệp của nhà trường.',
    },
    {
        title: 'Chất lượng vượt trội',
        description: 'Làm chủ 100% quy trình sản xuất, kiểm soát nghiêm ngặt từ nguyên liệu đến thành phẩm, đảm bảo sự đồng đều và bền bỉ.',
    },
];

const defaultGuarantees = [
    { icon: '🏭', title: 'Từ nhà máy đến người tiêu dùng', description: '' },
    { icon: '🔄', title: 'Bảo hành 1 đổi 1', description: 'nếu lỗi sản xuất' },
    { icon: '🚚', title: 'Giao hàng toàn quốc', description: 'Freeship từ 1.000.000đ' },
];

export default function WhyChooseHula({ reasons, guarantees, bgColor, textColor }: WhyChooseHulaProps) {
    const reasonItems = (reasons && reasons.length > 0) ? reasons : defaultReasons;
    const guaranteeItems = (guarantees && guarantees.length > 0) ? guarantees : defaultGuarantees;

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Left — Tại sao chọn HULA */}
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase mb-8" style={{ color: textColor || '#1a365d' }}>
                            Tại Sao Chọn HULA?
                        </h2>
                        <div className="space-y-6">
                            {reasonItems.map((item: any, index: number) => (
                                <div key={index}>
                                    <h3 className="font-heading font-bold text-base mb-1" style={{ color: textColor || '#1a365d' }}>
                                        {item.title}:
                                    </h3>
                                    <p className="text-sm leading-relaxed" style={{ color: textColor || '#4a5568', opacity: 0.85 }}>
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Mua hàng đảm bảo */}
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase mb-8 text-center lg:text-left" style={{ color: textColor || '#1a365d' }}>
                            Mua Hàng Đảm Bảo Cùng HULA
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            {guaranteeItems.map((item: any, index: number) => (
                                <div key={index} className="text-center">
                                    <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-3 bg-accent/20 rounded-full flex items-center justify-center">
                                        {item.icon_url ? (
                                            <img
                                                src={getGoogleDriveImageUrl(item.icon_url)}
                                                alt={item.title}
                                                className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
                                            />
                                        ) : (
                                            <span className="text-2xl lg:text-3xl">{item.icon || '📦'}</span>
                                        )}
                                    </div>
                                    <p className="text-xs lg:text-sm font-medium leading-tight" style={{ color: textColor || '#4a5568' }}>
                                        {item.title}
                                    </p>
                                    {item.description && (
                                        <p className="text-xs mt-1 opacity-70" style={{ color: textColor || '#718096' }}>
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
