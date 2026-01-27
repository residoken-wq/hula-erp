import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { convertGoogleDriveLink } from '@/utils/image';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Default configuration fallback
const DEFAULT_CONFIG = {
    hero_title_1: 'Giấc Ngủ Ngon',
    hero_title_2: 'Cho Bé Yêu',
    hero_description: 'Nệm mầm non HULA - Được thiết kế đặc biệt cho trẻ em với chất liệu cao cấp, đảm bảo sức khỏe và giấc ngủ an lành cho bé yêu của bạn.',
    hero_button_1: 'Xem Sản Phẩm',
    hero_button_2: 'Liên Hệ Mua Sỉ',
    hero_image: '',
    features: [
        { id: '1', icon: '🌿', title: 'Nguyên Liệu Tự Nhiên', description: 'Chất liệu 100% cotton organic, an toàn cho làn da nhạy cảm của bé' },
        { id: '2', icon: '🏆', title: 'Chất Lượng Cao Cấp', description: 'Sản phẩm đạt tiêu chuẩn chất lượng ISO và chứng nhận an toàn' },
        { id: '3', icon: '💯', title: 'Bảo Hành 12 Tháng', description: 'Cam kết đổi mới nếu có lỗi từ nhà sản xuất trong 12 tháng' },
        { id: '4', icon: '🚚', title: 'Giao Hàng Toàn Quốc', description: 'Miễn phí vận chuyển cho đơn hàng từ 2 triệu đồng' },
    ],
    video_enabled: true,
    video_title: 'Khám Phá HULA',
    video_subtitle: 'Xem video giới thiệu về sản phẩm nệm mầm non HULA',
    video_youtube_url: '',
    products_title: 'Sản Phẩm Nổi Bật',
    products_subtitle: 'Những sản phẩm được yêu thích nhất',
    products_limit: 4,
    cta_enabled: true,
    cta_title: 'Bạn là đại lý hoặc trường mầm non?',
    cta_description: 'Liên hệ ngay để nhận báo giá sỉ ưu đãi và chính sách hỗ trợ đặc biệt dành cho đối tác',
    cta_button: 'Đăng Ký Mua Sỉ Ngay'
};

async function getFeaturedProducts(limit: number = 4) {
    try {
        const res = await fetch(`${API_URL}/products?limit=${limit}`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        const products = await res.json();
        return Array.isArray(products) ? products.slice(0, limit) : [];
    } catch (error) {
        return [];
    }
}

async function getHomeConfig() {
    try {
        const res = await fetch(`${API_URL}/system/config/home_config`, { next: { revalidate: 60 } });
        if (!res.ok) return DEFAULT_CONFIG;
        const data = await res.json();
        if (data && data.value) {
            const config = JSON.parse(data.value);
            return {
                ...DEFAULT_CONFIG,
                ...config,
                // Ensure features is an array if present
                features: Array.isArray(config.features) ? config.features : DEFAULT_CONFIG.features
            };
        }
        return DEFAULT_CONFIG;
    } catch (error) {
        console.error('Failed to fetch home config:', error);
        return DEFAULT_CONFIG;
    }
}

function getYoutubeEmbedUrl(url: string) {
    if (!url) return '';
    try {
        // Handle standard youtube.com/watch?v=ID
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;

        // Handle youtu.be/ID
        if (urlObj.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed${urlObj.pathname}`;
        }

        // Handle embed URL already
        if (url.includes('/embed/')) return url;

        return url;
    } catch (e) {
        return url;
    }
}

export default async function HomePage() {
    const config = await getHomeConfig();
    const featuredProducts = await getFeaturedProducts(config.products_limit || 4);
    const heroImage = convertGoogleDriveLink(config.hero_image);

    return (
        <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                                {config.hero_title_1}
                                <br />
                                <span className="text-secondary-400">{config.hero_title_2}</span>
                            </h1>
                            <p className="mt-6 text-lg text-primary-100 max-w-xl">
                                {config.hero_description}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    href="/san-pham"
                                    className="inline-flex items-center px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                                >
                                    {config.hero_button_1}
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/lien-he"
                                    className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-700 transition-colors"
                                >
                                    {config.hero_button_2}
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="w-full h-80 lg:h-96 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center overflow-hidden">
                                {heroImage ? (
                                    <img
                                        src={heroImage}
                                        alt="Hero"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                                            <span className="text-6xl">🛏️</span>
                                        </div>
                                        <p className="mt-4 text-primary-100">Hero Image</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FAFBFC" />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 lg:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            Tại Sao Chọn HULA?
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                            Chúng tôi cam kết mang đến sản phẩm chất lượng cao nhất cho bé yêu của bạn
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {config.features?.map((feature: any, index: number) => (
                            <div
                                key={feature.id || index}
                                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-14 h-14 bg-primary-50 rounded-lg flex items-center justify-center text-3xl mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {feature.description || feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Section */}
            {config.video_enabled && config.video_youtube_url && (
                <section className="py-16 lg:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                {config.video_title}
                            </h2>
                            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                                {config.video_subtitle}
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-lg"
                                    src={getYoutubeEmbedUrl(config.video_youtube_url)}
                                    title="Video giới thiệu"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Products */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                {config.products_title}
                            </h2>
                            <p className="mt-2 text-gray-600">
                                {config.products_subtitle}
                            </p>
                        </div>
                        <Link
                            href="/san-pham"
                            className="hidden sm:inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Xem tất cả
                            <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {config.cta_enabled && (
                <section className="py-16 bg-gradient-to-r from-secondary-500 to-secondary-600">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                            {config.cta_title}
                        </h2>
                        <p className="text-secondary-100 mb-8 max-w-2xl mx-auto">
                            {config.cta_description}
                        </p>
                        <Link
                            href="/lien-he"
                            className="inline-flex items-center px-8 py-4 bg-white text-secondary-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            {config.cta_button}
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </section>
            )}
        </>
    );
}
