import Link from 'next/link';
import { getBlogs } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import PageHeroBanner from '@/components/PageHeroBanner';

export const dynamic = 'force-dynamic';

async function fetchBlogs() {
    try {
        const res = await getBlogs();
        // getBlogs() -> axios.get('/blogs') -> returns { data } which is the raw array
        const blogs = res.data || res || [];
        return Array.isArray(blogs) ? blogs : [];
    } catch (error) {
        console.error('[tin-tuc] Failed to fetch blogs:', error);
        return [];
    }
}

export default async function BlogsPage() {
    const blogs = await fetchBlogs();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeroBanner
                title="Tin Tức & Kiến Thức"
                description="Cập nhật những thông tin hữu ích về chăm sóc giấc ngủ cho bé"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Blog Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map((blog: any) => (
                        <article key={blog.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
                            <Link href={`/tin-tuc/${blog.slug}`}>
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    {blog.featured_image ? (
                                        <img
                                            src={resolveImageUrl(blog.featured_image)}
                                            alt={blog.featured_image_alt || blog.title}
                                            title={blog.featured_image_title || blog.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <span className="text-6xl">📰</span>
                                    )}
                                </div>
                            </Link>

                            <div className="p-6">
                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                                    <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                                        {blog.category}
                                    </span>
                                    <span>{formatDate(blog.published_at)}</span>
                                </div>

                                <Link href={`/tin-tuc/${blog.slug}`}>
                                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                                        {blog.title}
                                    </h2>
                                </Link>

                                <p className="mt-2 text-gray-600 text-sm line-clamp-3">
                                    {blog.excerpt}
                                </p>

                                <div className="mt-4 flex items-center justify-between">
                                    <Link
                                        href={`/tin-tuc/${blog.slug}`}
                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center"
                                    >
                                        Đọc tiếp
                                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                    <span className="text-xs text-gray-400">{blog.view_count} lượt xem</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Empty state */}
                {blogs.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Chưa có bài viết</h3>
                        <p className="text-gray-600 mt-2">Tin tức đang được cập nhật, vui lòng quay lại sau.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
