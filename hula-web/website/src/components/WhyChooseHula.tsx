'use client';

import { resolveImageUrl } from '@/lib/utils';

interface WhyChooseHulaProps {
    reasons?: Array<{
        icon?: string;
        icon_url?: string;
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
    { icon: '🛡️', title: 'Bảo hành 1 đổi 1', description: 'nếu lỗi sản xuất' },
    { icon: '🚚', title: 'Giao hàng toàn quốc', description: 'Freeship từ : 1.000.000đ' },
    { icon: '📦', title: 'Giao hàng toàn quốc', description: 'Freeship từ : 1.000.000đ' },
];

export default function WhyChooseHula({ reasons, guarantees, bgColor, textColor }: WhyChooseHulaProps) {
    const reasonItems = (reasons && reasons.length > 0) ? reasons : defaultReasons;
    const guaranteeItems = (guarantees && guarantees.length > 0) ? guarantees : defaultGuarantees;

    return (
        <>
            {/* ===== Phần 1: Tại sao chọn HULA ===== */}
            <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase mb-10 text-center" style={{ color: textColor || '#1a365d' }}>
                        Tại Sao Chọn HULA?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {reasonItems.map((item: any, index: number) => (
                            <div key={index} className="text-center">
                                {(item.icon_url || item.icon) && (
                                    <div className="mb-4 flex justify-center">
                                        {item.icon_url ? (
                                            <img src={resolveImageUrl(item.icon_url)} alt={item.title} className="w-10 h-10 object-contain" />
                                        ) : (
                                            <span className="text-3xl">{item.icon}</span>
                                        )}
                                    </div>
                                )}
                                <h3 className="font-heading font-bold text-base lg:text-lg mb-2" style={{ color: textColor || '#1a365d' }}>
                                    {item.title}
                                </h3>
                                <div
                                    className="text-sm leading-relaxed opacity-85"
                                    style={{ color: textColor || '#4a5568' }}
                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Phần 2: Mua hàng đảm bảo (theo reference image) ===== */}
            <section className="py-12 lg:py-16" style={{ backgroundColor: '#f0f0f0' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl lg:text-2xl font-heading font-bold uppercase mb-10 text-center tracking-wide" style={{ color: '#1a365d' }}>
                        Mua Hàng Đảm Bảo Cùng HULA
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {guaranteeItems.map((item: any, index: number) => (
                            <div key={index} className="text-center flex flex-col items-center">
                                {/* Icon/Illustration — lớn, không có circle background */}
                                <div className="w-24 h-24 lg:w-28 lg:h-28 mb-4 flex items-center justify-center">
                                    {item.icon_url ? (
                                        <img
                                            src={resolveImageUrl(item.icon_url)}
                                            alt={item.title}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-5xl lg:text-6xl opacity-70">{item.icon || '📦'}</span>
                                    )}
                                </div>
                                {/* Title */}
                                <p className="text-sm lg:text-base font-semibold leading-snug mb-1" style={{ color: '#1a365d' }}>
                                    {item.title}
                                </p>
                                {/* Description */}
                                {item.description && (
                                    <p className="text-xs lg:text-sm leading-tight opacity-70" style={{ color: '#4a5568' }}>
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
