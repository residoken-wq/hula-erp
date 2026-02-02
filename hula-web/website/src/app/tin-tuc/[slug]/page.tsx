import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Blog {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category: string;
    published_at: string;
    view_count: number;
}

// Server-side: use internal API_URL + /api, fallback to NEXT_PUBLIC_API_URL
const getApiUrl = () => {
    if (process.env.API_URL) {
        return `${process.env.API_URL}/api`;  // Internal: http://hula_app:3000/api
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';
};

async function getBlog(slug: string): Promise<Blog | null> {
    const apiUrl = getApiUrl();
    try {
        const res = await fetch(`${apiUrl}/public/blogs/${slug}`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.error) return null;
        return data;
    } catch (error) {
        console.error('Failed to fetch blog:', error);
        return null;
    }
}

async function getRelatedBlogs(category: string, currentSlug: string): Promise<Blog[]> {
    const apiUrl = getApiUrl();
    try {
        const res = await fetch(`${apiUrl}/public/blogs`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const blogs = await res.json();
        return Array.isArray(blogs)
            ? blogs.filter((b: Blog) => b.category === category && b.slug !== currentSlug).slice(0, 3)
            : [];
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const blog = await getBlog(resolvedParams.slug);

    return {
        title: blog ? `${blog.title} | Tin Tức HULA` : 'Tin Tức | HULA',
        description: blog?.excerpt || 'Tin tức và kiến thức về nệm mầm non HULA',
    };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const blog = await getBlog(resolvedParams.slug);

    if (!blog) {
        notFound();
    }

    const relatedBlogs = await getRelatedBlogs(blog.category, blog.slug);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-primary-600 transition-colors">
                            Trang chủ
                        </Link>
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/tin-tuc" className="text-gray-500 hover:text-primary-600 transition-colors">
                            Tin tức
                        </Link>
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900 font-medium truncate max-w-xs">{blog.title}</span>
                    </nav>
                </div>
            </div>

            {/* Article */}
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="p-6 lg:p-10 border-b bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                {blog.category}
                            </span>
                            <span className="text-gray-500 text-sm">
                                {formatDate(blog.published_at)}
                            </span>
                            <span className="text-gray-400 text-sm">
                                • {blog.view_count} lượt xem
                            </span>
                        </div>

                        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 leading-tight">
                            {blog.title}
                        </h1>

                        {blog.excerpt && (
                            <p className="mt-4 text-lg text-gray-600">
                                {blog.excerpt}
                            </p>
                        )}
                    </div>

                    {/* Featured Image */}
                    {blog.featured_image && (
                        <div className="aspect-video bg-gray-100">
                            <img
                                src={blog.featured_image}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 lg:p-10">
                        <div
                            className="prose prose-lg max-w-none
                                prose-headings:text-gray-900 prose-headings:font-bold
                                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                                prose-p:text-gray-600 prose-p:leading-relaxed
                                prose-li:text-gray-600
                                prose-strong:text-gray-900
                                prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                                prose-img:rounded-xl prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: blog.content || '<p>Nội dung đang được cập nhật...</p>' }}
                        />
                    </div>

                    {/* Share & Actions */}
                    <div className="p-6 lg:px-10 border-t bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-600 text-sm">Chia sẻ:</span>
                                <div className="flex gap-2">
                                    <button className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <Link
                                href="/tin-tuc"
                                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Quay lại danh sách
                            </Link>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Articles */}
            {relatedBlogs.length > 0 && (
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Bài viết liên quan</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {relatedBlogs.map((related) => (
                            <Link
                                key={related.id}
                                href={`/tin-tuc/${related.slug}`}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                            >
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    {related.featured_image ? (
                                        <img
                                            src={related.featured_image}
                                            alt={related.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <span className="text-4xl">📰</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
                                        {related.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{formatDate(related.published_at)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
