import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getFeaturedProducts() {
    try {
        const res = await fetch(`${API_URL}/products`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        const products = await res.json();
        // Assuming /products returns all products, we slice 4. 
        // Ideally backend should support filtering ?featured=true
        return Array.isArray(products) ? products.slice(0, 4) : [];
    } catch (error) {
        return [];
    }
}

// --- FETCH HOME CONFIG ---
async function getHomeConfig() {
    try {
        const res = await fetch(`${API_URL}/system/home-config`, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        return null;
    }
}

// --- HELPER: Google Drive Image URL ---
const getImageUrl = (url: string) => {
    if (!url) return '';
    // Check if Google Drive
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
};

export default async function HomePage() {
    const featuredProducts = await getFeaturedProducts();
    const config = await getHomeConfig();

    // Default values if config is missing
    const heroTitle1 = config?.hero_title_1 || 'Giấc Ngủ Ngon';
    const heroTitle2 = config?.hero_title_2 || 'Cho Bé Yêu';
    const heroDesc = config?.hero_description || 'Nệm mầm non HULA - Được thiết kế đặc biệt cho trẻ em...';
    const heroBtn1 = config?.hero_button_1 || 'Xem Sản Phẩm';
    const heroBtn2 = config?.hero_button_2 || 'Liên Hệ Mua Sỉ';

    // Process Images
    let heroImages = config?.hero_images || [];
    if (heroImages.length === 0 && config?.hero_image) {
        heroImages = [config.hero_image];
    }
    // Convert all to displayable URLs
    heroImages = heroImages.map(getImageUrl);

    // If no images, use placeholder or empty
    // const displayImage = heroImages.length > 0 ? heroImages[0] : '';

    // Features from Config or Default
    const features = (config?.features && config.features.length > 0)
        ? config.features
        : [
            { icon: '🌿', title: 'Nguyên Liệu Tự Nhiên', description: 'Chất liệu 100% cotton organic...' },
            { icon: '🏆', title: 'Chất Lượng Cao Cấp', description: 'Sản phẩm đạt tiêu chuẩn chất lượng ISO...' },
            { icon: '💯', title: 'Bảo Hành 12 Tháng', description: 'Cam kết đổi mới nếu có lỗi...' },
            { icon: '🚚', title: 'Giao Hàng Toàn Quốc', description: 'Miễn phí vận chuyển cho đơn hàng...' },
        ];

    return (
        <>
            {/* Hero Section */}
            <HeroSection
                title1={heroTitle1} title2={heroTitle2} description={heroDesc}
                btn1={heroBtn1} btn2={heroBtn2} images={heroImages}
            />

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
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-14 h-14 bg-primary-50 rounded-lg flex items-center justify-center text-3xl mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Section */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                            Khám Phá HULA
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                            Xem video giới thiệu về sản phẩm nệm mầm non HULA
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-lg"
                                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                                title="HULA - Nệm Mầm Non"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                Sản Phẩm Nổi Bật
                            </h2>
                            <p className="mt-2 text-gray-600">
                                Những sản phẩm được yêu thích nhất
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
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-secondary-500 to-secondary-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Bạn là đại lý hoặc trường mầm non?
                    </h2>
                    <p className="text-secondary-100 mb-8 max-w-2xl mx-auto">
                        Liên hệ ngay để nhận báo giá sỉ ưu đãi và chính sách hỗ trợ đặc biệt dành cho đối tác
                    </p>
                    <Link
                        href="/lien-he"
                        className="inline-flex items-center px-8 py-4 bg-white text-secondary-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        Đăng Ký Mua Sỉ Ngay
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </>
    );
}
