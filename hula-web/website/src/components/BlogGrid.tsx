import Link from 'next/link';
import { getGoogleDriveImageUrl } from '@/lib/utils';

interface BlogGridProps {
    posts?: Array<{
        id: number;
        title: string;
        slug: string;
        excerpt?: string;
        thumbnail?: string;
        created_at?: string;
    }>;
    bgColor?: string;
}

export default function BlogGrid({ posts, bgColor }: BlogGridProps) {
    if (!posts || posts.length === 0) return null;

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                        Blog Tư Vấn
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.slice(0, 6).map((post: any) => (
                        <Link
                            key={post.id}
                            href={`/tin-tuc/${post.slug}`}
                            className="card-v2 group overflow-hidden"
                        >
                            <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                                {post.thumbnail ? (
                                    <img
                                        src={getGoogleDriveImageUrl(post.thumbnail)}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-section-blue to-primary-200 flex items-center justify-center">
                                        <span className="text-4xl">📝</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                {post.created_at && (
                                    <p className="text-xs text-gray-400 mb-2">
                                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                    </p>
                                )}
                                <h3 className="font-heading font-semibold text-gray-800 group-hover:text-primary-500 transition-colors line-clamp-2 text-sm lg:text-base">
                                    {post.title}
                                </h3>
                                {post.excerpt && (
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/tin-tuc"
                        className="btn-outline inline-flex items-center gap-2"
                    >
                        Xem thêm
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
