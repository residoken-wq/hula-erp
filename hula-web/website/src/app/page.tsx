import Link from 'next/link';
import { getProducts, getBlogs, getHomeConfig } from '@/lib/api';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryCards from '@/components/CategoryCards';
import JourneySlider from '@/components/JourneySlider';
import ProjectGallery from '@/components/ProjectGallery';
import PartnerSlider from '@/components/PartnerSlider';
import Testimonials from '@/components/Testimonials';
import BlogGrid from '@/components/BlogGrid';

export const dynamic = 'force-dynamic';

async function getFeaturedProducts(limit = 4) {
    try {
        const res = await getProducts({ limit });
        return res.data || [];
    } catch {
        return [];
    }
}

async function getBlogPosts(limit = 6) {
    try {
        const res = await getBlogs(limit);
        return res.data || res || [];
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const config = await getHomeConfig() || {};
    const blogPosts = await getBlogPosts(6);

    const heroImages = (config.hero_images && config.hero_images.length > 0)
        ? config.hero_images
        : (config.hero_image ? [config.hero_image] : []);

    return (
        <>
            {/* ============================================
                SECTION 1 — HERO BANNER + USP BAR
               ============================================ */}
            <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-heading font-bold leading-tight">
                                {config.hero_title_1 || 'Giấc Ngủ Học Đường'}
                                <br />
                                <span className="text-secondary-300">{config.hero_title_2 || 'Hoàn Hảo'}</span>
                            </h1>
                            <p className="mt-6 text-lg text-primary-100 max-w-xl leading-relaxed">
                                {config.hero_description || 'Giải pháp nệm trường học toàn diện - Hơn 10 năm đồng hành cùng hàng trăm trường học trên toàn quốc.'}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link
                                    href="/san-pham"
                                    className="inline-flex items-center px-7 py-3.5 bg-white text-primary-600 font-semibold rounded-pill hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                >
                                    {config.hero_button_1 || 'Xem Sản Phẩm'}
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/lien-he"
                                    className="inline-flex items-center px-7 py-3.5 border-2 border-white text-white font-semibold rounded-pill hover:bg-white hover:text-primary-600 transition-all"
                                >
                                    {config.hero_button_2 || 'Tư Vấn Ngay'}
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <HeroCarousel images={heroImages} />
                        </div>
                    </div>
                </div>

                {/* USP Bar */}
                <div className="bg-white/10 backdrop-blur-md border-t border-white/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-3 divide-x divide-white/20">
                            <div className="py-4 text-center">
                                <span className="text-white font-medium text-sm lg:text-base">✨ Free tư vấn</span>
                            </div>
                            <div className="py-4 text-center">
                                <span className="text-white font-medium text-sm lg:text-base">🎨 Free thiết kế</span>
                            </div>
                            <div className="py-4 text-center">
                                <span className="text-white font-medium text-sm lg:text-base">🚚 Giao hàng toàn quốc</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                SECTION 2 — DANH MỤC SẢN PHẨM
               ============================================ */}
            <CategoryCards categories={config.categories} />

            {/* ============================================
                SECTION 3 — GIỚI THIỆU HULA (Text + Video)
               ============================================ */}
            <section className="py-16 lg:py-24 bg-section-blue">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-6">
                                {config.about_title || 'Hơn 10 Năm Đồng Hành Cùng Giấc Ngủ Học Đường'}
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {config.about_description || 'HULA tự hào là đơn vị tiên phong trong lĩnh vực cung cấp giải pháp nệm, gối, chăn cho trường học. Với quy trình sản xuất khép kín, kiểm soát chất lượng nghiêm ngặt, chúng tôi cam kết mang đến sản phẩm tốt nhất cho giấc ngủ của trẻ.'}
                            </p>
                            <Link
                                href="/ve-hula"
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                Xem thêm
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                        <div>
                            {config.video_youtube_url ? (
                                <div className="relative w-full rounded-[12px] overflow-hidden shadow-soft-lg" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={config.video_youtube_url}
                                        title="HULA - Giới thiệu"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="w-full aspect-video bg-gradient-to-br from-primary-200 to-primary-400 rounded-[12px] flex items-center justify-center shadow-soft-lg">
                                    <span className="text-6xl">🎬</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                SECTION 4 — HÀNH TRÌNH HULA
               ============================================ */}
            <JourneySlider milestones={config.milestones} />

            {/* ============================================
                SECTION 5 — DỰ ÁN NỔI BẬT
               ============================================ */}
            <ProjectGallery projects={config.featured_projects} />

            {/* ============================================
                SECTION 6 — ĐỐI TÁC
               ============================================ */}
            <PartnerSlider partners={config.partners} />

            {/* ============================================
                SECTION 7 — FEEDBACK KHÁCH HÀNG
               ============================================ */}
            <Testimonials testimonials={config.testimonials} />

            {/* ============================================
                SECTION 8 — BLOG TƯ VẤN
               ============================================ */}
            <BlogGrid posts={blogPosts} />
        </>
    );
}
