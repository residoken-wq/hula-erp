import Link from 'next/link';
import { getProducts, getBlogs, getHomeConfig, getSettings } from '@/lib/api';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryCards from '@/components/CategoryCards';
import WhyChooseHula from '@/components/WhyChooseHula';
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

async function getBlogPosts(limit = 6, config?: any) {
    try {
        const res = await getBlogs(100);
        const allBlogs = res.data || res || [];

        if (config?.blog_selection_type === 'manual' && Array.isArray(config?.selected_blog_ids) && config.selected_blog_ids.length > 0) {
            return config.selected_blog_ids
                .map((id: string) => allBlogs.find((b: any) => String(b.id) === String(id) || String(b._id) === String(id) || b.slug === id))
                .filter(Boolean);
        }

        return allBlogs.slice(0, limit);
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const config = await getHomeConfig() || {};
    const settings = await getSettings() || {};
    const blogPosts = await getBlogPosts(6, config);

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
                    heroButton1={config.hero_button_1}
                    heroButton2={config.hero_button_2}
                    heroMaskOpacity={config.hero_mask_opacity}
                />

                {/* USP Bar */}
                <div
                    className="backdrop-blur-md border-t border-white/20"
                    style={{ backgroundColor: settings.section_hero_usp_bg || 'rgba(35,167,211,0.85)', color: settings.section_hero_usp_text || undefined }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid divide-x divide-white/20" style={{ gridTemplateColumns: `repeat(${config.usp_items?.length || 3}, 1fr)` }}>
                            {(config.usp_items && config.usp_items.length > 0 ? config.usp_items : [
                                { icon: '✨', text: 'Free tư vấn' },
                                { icon: '🎨', text: 'Free thiết kế' },
                                { icon: '🚚', text: 'Giao hàng toàn quốc' },
                            ]).map((item: any, index: number) => (
                                <div key={index} className="py-2 lg:py-4 text-center">
                                    <span className="font-medium text-xs sm:text-sm lg:text-base leading-tight" style={{ color: settings.section_hero_usp_text || 'white' }}>
                                        {item.icon} {item.text}
                                    </span>
                                </div>
                            ))}
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
                                <div className="relative w-full rounded-[12px] overflow-hidden" style={{ paddingBottom: '56.25%' }}>
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
                                <div className="w-full aspect-video bg-gradient-to-br from-primary-200 to-primary-400 rounded-[12px] flex items-center justify-center">
                                    <span className="text-6xl">🎬</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                SECTION 4a — TẠI SAO CHỌN HULA
               ============================================ */}
            <WhyChooseHula
                reasons={config.why_choose_reasons}
                guarantees={config.why_choose_guarantees}
                bgColor={settings.section_journey_bg}
                textColor={settings.section_journey_text}
            />

            {/* ============================================
                SECTION 4b — HÀNH TRÌNH HULA
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
                SECTION 7 — ĐÁNH GIÁ KHÁCH HÀNG
               ============================================ */}
            <Testimonials testimonials={config.testimonials} bgColor={settings.section_testimonials_bg} textColor={settings.section_testimonials_text} />

            {/* ============================================
                SECTION 8 — THÔNG TIN HỮU ÍCH
               ============================================ */}
            <BlogGrid
                posts={blogPosts.map((post: any) => ({
                    id: post.id || post._id,
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    thumbnail: post.featured_image,
                    thumbnail_alt: post.featured_image_alt,
                    thumbnail_title: post.featured_image_title,
                    created_at: post.created_at,
                }))}
                bgColor={settings.section_blog_bg}
                textColor={settings.section_blog_text}
            />
        </>
    );
}
