import Link from 'next/link';
import { getAboutConfig } from '@/lib/api';
import PageHeroBanner from '@/components/PageHeroBanner';

export const dynamic = 'force-dynamic';

// Default stats for fallback
const defaultStats = [
    { id: '1', number: '10+', label: 'Năm kinh nghiệm', icon: '🏆' },
    { id: '2', number: '500+', label: 'Trường học', icon: '🏫' },
    { id: '3', number: '63', label: 'Tỉnh thành', icon: '📍' },
    { id: '4', number: '100K+', label: 'Sản phẩm/năm', icon: '📦' },
];

const defaultValues = [
    { id: '1', title: 'Chất lượng hàng đầu', description: 'Nguyên liệu an toàn, quy trình sản xuất khép kín đạt tiêu chuẩn cao nhất.', icon: '⭐' },
    { id: '2', title: 'Đồng hành tận tâm', description: 'Hỗ trợ tư vấn chuyên nghiệp, đáp ứng mọi nhu cầu của đối tác.', icon: '🤝' },
    { id: '3', title: 'Sáng tạo không ngừng', description: 'Liên tục cải tiến sản phẩm, cập nhật xu hướng mới nhất.', icon: '💡' },
];

export default async function AboutPage() {
    const config = await getAboutConfig() || {};

    const heroTitle = config.hero_title || 'Về HULA';
    const heroDescription = config.hero_description || 'Hơn 10 năm đồng hành cùng giấc ngủ học đường - Giải pháp nệm, gối, chăn trường học toàn diện';
    const storyTitle = config.story_title || 'Từ Tâm Huyết Đến Thương Hiệu Uy Tín';
    const storyContent = config.story_content || '';
    const visionTitle = config.vision_title || 'Tầm nhìn';
    const visionDescription = config.vision_description || 'Trở thành thương hiệu hàng đầu Việt Nam trong lĩnh vực cung cấp sản phẩm chăm sóc giấc ngủ cho trẻ em tại trường học, góp phần nâng cao chất lượng giáo dục.';
    const missionTitle = config.mission_title || 'Sứ mệnh';
    const missionDescription = config.mission_description || 'Mang đến giải pháp nghỉ ngơi toàn diện, an toàn và thẩm mỹ cho mọi trường học. Đồng hành cùng nhà trường xây dựng môi trường học tập và nghỉ ngơi tốt nhất cho trẻ.';
    const stats = (Array.isArray(config.stats) && config.stats.length > 0) ? config.stats : defaultStats;
    const values = (Array.isArray(config.values) && config.values.length > 0) ? config.values : defaultValues;
    const ctaTitle = config.cta_title || 'Bạn cần tư vấn?';
    const ctaDescription = config.cta_description || 'Liên hệ ngay để nhận báo giá sỉ ưu đãi và chính sách hỗ trợ đặc biệt dành cho đối tác';
    const ctaButtonText = config.cta_button_text || 'Liên hệ ngay';
    const ctaButtonUrl = config.cta_button_url || '/lien-he';
    const heroImage = config.hero_image || '';
    const storyVideoUrl = config.story_video_url || '';
    const storyImage = config.story_image || '';

    // Helper function to extract YouTube embed URL
    const getYoutubeEmbedUrl = (url: string) => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            let videoId = '';
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v') || '';
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
        } catch (e) {
            return '';
        }
    };
    const embedUrl = getYoutubeEmbedUrl(storyVideoUrl);

    return (
        <>
            <PageHeroBanner
                title={heroTitle}
                description={heroDescription}
                backgroundImage={heroImage}
            />

            {/* Story */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">Câu chuyện của chúng tôi</span>
                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mt-3 mb-6">
                                {storyTitle}
                            </h2>
                            {storyContent ? (
                                <div
                                    className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: storyContent }}
                                />
                            ) : (
                                <div className="space-y-4 text-gray-600 leading-relaxed">
                                    <p>
                                        HULA được thành lập với sứ mệnh mang đến giấc ngủ an lành, thoải mái cho trẻ em tại các trường học trên toàn quốc. Chúng tôi hiểu rằng giấc ngủ trưa chất lượng là nền tảng quan trọng cho sự phát triển toàn diện của trẻ.
                                    </p>
                                    <p>
                                        Với hơn 10 năm kinh nghiệm, HULA đã đồng hành cùng hàng trăm trường mầm non, tiểu học trên khắp 63 tỉnh thành, cung cấp giải pháp nệm, gối, chăn chất lượng cao, an toàn cho sức khỏe.
                                    </p>
                                    <p>
                                        Chúng tôi tự hào với quy trình sản xuất khép kín, kiểm soát chất lượng nghiêm ngặt từ khâu chọn nguyên liệu đến thành phẩm, đảm bảo mỗi sản phẩm đều đạt tiêu chuẩn cao nhất.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="relative h-full min-h-[300px]">
                            {embedUrl ? (
                                <div className="w-full aspect-[4/3] rounded-[12px] flex items-center justify-center shadow-soft-lg overflow-hidden bg-black">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                </div>
                            ) : storyImage ? (
                                <div className="w-full aspect-[4/3] rounded-[12px] shadow-soft-lg overflow-hidden">
                                    <img src={storyImage} alt={storyTitle} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-full aspect-[4/3] bg-gradient-to-br from-section-blue to-primary-200 rounded-[12px] flex items-center justify-center shadow-soft-lg">
                                    <span className="text-7xl">🏭</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision / Mission */}
            <section className="py-16 lg:py-24 bg-section-blue">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[12px] p-8 shadow-soft">
                            <div className="w-14 h-14 bg-primary-100 rounded-[12px] flex items-center justify-center text-2xl mb-4">
                                🎯
                            </div>
                            <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">{visionTitle}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {visionDescription}
                            </p>
                        </div>
                        <div className="bg-white rounded-[12px] p-8 shadow-soft">
                            <div className="w-14 h-14 bg-primary-100 rounded-[12px] flex items-center justify-center text-2xl mb-4">
                                ❤️
                            </div>
                            <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">{missionTitle}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {missionDescription}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat: any, index: number) => (
                            <div key={stat.id || index} className="text-center">
                                {stat.icon && <div className="text-3xl mb-2">{stat.icon}</div>}
                                <div className="text-4xl lg:text-5xl font-heading font-bold text-primary-500 mb-2">{stat.number}</div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            {values.length > 0 && (
                <section className="py-16 lg:py-24 bg-section-blue">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900">Giá trị cốt lõi</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {values.map((val: any, index: number) => (
                                <div key={val.id || index} className="bg-white rounded-[12px] p-8 shadow-soft text-center">
                                    {val.icon && <div className="text-4xl mb-4">{val.icon}</div>}
                                    <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">{val.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{val.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="py-16 bg-gradient-to-r from-primary-500 to-primary-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
                        {ctaTitle}
                    </h2>
                    <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
                        {ctaDescription}
                    </p>
                    <Link
                        href={ctaButtonUrl}
                        className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-bold rounded-pill hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {ctaButtonText}
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </>
    );
}
