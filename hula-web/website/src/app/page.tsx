import Link from 'next/link';
import { getProducts, getBlogs, getHomeConfig, getSettings } from '@/lib/api';
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
    const settings = await getSettings() || {};
    const blogPosts = await getBlogPosts(6);

    const heroImages = (config.hero_images && config.hero_images.length > 0)
        ? config.hero_images
        : (config.hero_image ? [config.hero_image] : []);

    return (
        <>
            {/* ============================================
                SECTION 1 — HERO BANNER + USP BAR
               ============================================ */}
            <section className="relative overflow-hidden">
                <HeroCarousel
                    images={heroImages}
                    heroTitle1={config.hero_title_1}
                    heroTitle2={config.hero_title_2}
                    heroDescription={config.hero_description}
                    heroButton1={config.hero_button_1}
                    heroButton2={config.hero_button_2}
                />

                {/* USP Bar */}
                <div
                    className="backdrop-blur-md border-t border-white/20"
                    style={{ backgroundColor: settings.section_hero_usp_bg || 'rgba(35,167,211,0.85)', color: settings.section_hero_usp_text || undefined }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-3 divide-x divide-white/20">
                            <div className="py-4 text-center">
                                <span className="font-medium text-sm lg:text-base" style={{ color: settings.section_hero_usp_text || 'white' }}>✨ Free tư vấn</span>
                            </div>
                            <div className="py-4 text-center">
                                <span className="font-medium text-sm lg:text-base" style={{ color: settings.section_hero_usp_text || 'white' }}>🎨 Free thiết kế</span>
                            </div>
                            <div className="py-4 text-center">
                                <span className="font-medium text-sm lg:text-base" style={{ color: settings.section_hero_usp_text || 'white' }}>🚚 Giao hàng toàn quốc</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                SECTION 2 — DANH MỤC SẢN PHẨM
               ============================================ */}
            <CategoryCards categories={config.categories} bgColor={settings.section_categories_bg} textColor={settings.section_categories_text} />

            {/* ============================================
                SECTION 3 — GIỚI THIỆU HULA (Text + Video)
               ============================================ */}
            <section
                className="py-16 lg:py-24"
                style={{ backgroundColor: settings.section_about_bg || '#B9E5FB', color: settings.section_about_text || undefined }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6" style={{ color: settings.section_about_text || undefined }}>
                                {config.about_title || 'Hơn 10 Năm Đồng Hành Cùng Giấc Ngủ Học Đường'}
                            </h2>
                            <p className="leading-relaxed mb-6" style={{ color: settings.section_about_text || undefined, opacity: 0.8 }}>
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
            <JourneySlider milestones={config.milestones} bgColor={settings.section_journey_bg} textColor={settings.section_journey_text} />

            {/* ============================================
                SECTION 5 — DỰ ÁN NỔI BẬT
               ============================================ */}
            <ProjectGallery projects={config.featured_projects} bgColor={settings.section_projects_bg} textColor={settings.section_projects_text} />

            {/* ============================================
                SECTION 6 — ĐỐI TÁC
               ============================================ */}
            <PartnerSlider partners={config.partners} bgColor={settings.section_partners_bg} textColor={settings.section_partners_text} />

            {/* ============================================
                SECTION 7 — FEEDBACK KHÁCH HÀNG
               ============================================ */}
            <Testimonials testimonials={config.testimonials} bgColor={settings.section_testimonials_bg} textColor={settings.section_testimonials_text} />

            {/* ============================================
                SECTION 8 — BLOG TƯ VẤN
               ============================================ */}
            <BlogGrid posts={blogPosts} bgColor={settings.section_blog_bg} textColor={settings.section_blog_text} />
        </>
    );
}
