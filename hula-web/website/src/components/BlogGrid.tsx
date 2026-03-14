import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils';

interface BlogGridProps {
    posts?: Array<{
        id: number;
        title: string;
        slug: string;
        excerpt?: string;
        thumbnail?: string;
        thumbnail_alt?: string;
        thumbnail_title?: string;
        created_at?: string;
    }>;
    bgColor?: string;
    textColor?: string;
}

export default function BlogGrid({ posts, bgColor, textColor }: BlogGridProps) {
    if (!posts || posts.length === 0) return null;

    const featuredPost = posts[0];
    const sidebarPosts = posts.slice(1, 6);

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Title + subtitle */}
                <div className="text-center mb-12">
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase" style={{ color: textColor || '#1a365d' }}>
                        Thông Tin Hữu Ích
                    </h2>
                    <p className="text-sm mt-2 opacity-70" style={{ color: textColor || '#718096' }}>
                        Kiến thức hữu ích về chăn ga gối nệm và chăm sóc sức khỏe giấc ngủ của bạn
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left — Featured post (large) */}
                    <div className="lg:col-span-3">
                        <Link href={`/tin-tuc/${featuredPost.slug}`} className="group block">
                            <div className="aspect-[16/9] bg-gray-100 rounded-[12px] overflow-hidden mb-4">
                                {featuredPost.thumbnail ? (
                                    <img
                                        src={resolveImageUrl(featuredPost.thumbnail)}
                                        alt={featuredPost.thumbnail_alt || featuredPost.title}
                                        title={featuredPost.thumbnail_title || featuredPost.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-section-blue to-primary-200 flex items-center justify-center">
                                        <span className="text-5xl">📝</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-heading font-bold text-lg lg:text-xl group-hover:text-accent transition-colors line-clamp-2 mb-2" style={{ color: textColor || '#1a365d' }}>
                                {featuredPost.title}
                            </h3>
                            {featuredPost.excerpt && (
                                <p className="text-sm leading-relaxed line-clamp-3 opacity-70" style={{ color: textColor || '#4a5568' }}>
                                    {featuredPost.excerpt}
                                </p>
                            )}
                        </Link>
                    </div>

                    {/* Right — List of posts */}
                    <div className="lg:col-span-2 space-y-4">
                        {sidebarPosts.map((post: any) => (
                            <Link
                                key={post.id}
                                href={`/tin-tuc/${post.slug}`}
                                className="group flex gap-4 items-start"
                            >
                                {/* Small thumbnail */}
                                <div className="w-20 h-20 lg:w-24 lg:h-20 rounded-[8px] overflow-hidden bg-gray-100 flex-shrink-0">
                                    {post.thumbnail ? (
                                        <img
                                            src={resolveImageUrl(post.thumbnail)}
                                            alt={post.thumbnail_alt || post.title}
                                            title={post.thumbnail_title || post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-section-blue to-primary-100 flex items-center justify-center">
                                            <span className="text-xl">📝</span>
                                        </div>
                                    )}
                                </div>
                                {/* Title + date */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-heading font-semibold text-sm group-hover:text-accent transition-colors line-clamp-2 mb-1" style={{ color: textColor || '#1a365d' }}>
                                        {post.title}
                                    </h4>
                                    {post.created_at && (
                                        <p className="text-xs opacity-50" style={{ color: textColor || '#718096' }}>
                                            {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-10">
                    <Link
                        href="/tin-tuc"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        Xem Tất Cả
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
