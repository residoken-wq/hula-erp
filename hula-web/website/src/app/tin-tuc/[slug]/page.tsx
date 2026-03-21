import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { resolveImageUrl } from '@/lib/utils';
import { BlockRenderer } from '@/components/BlockRenderer';

interface Blog {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    content_blocks?: any[];
    featured_image: string;
    featured_image_alt?: string;
    featured_image_title?: string;
    category: string;
    published_at: string;
    view_count: number;
    // SEO Fields
    seo_meta?: {
        title?: string;
        description?: string;
        canonicalUrl?: string;
        robots?: string[];
        ogImage?: string;
        schemaType?: string;
    };
    meta_title?: string;
    meta_description?: string;
}

// Server-side: use internal API_URL + /api, fallback to NEXT_PUBLIC_API_URL
const getApiUrl = () => {
    if (process.env.API_URL) {
        return `${process.env.API_URL}/api`;  // Internal: http://hula_app:3000/api
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';
};

const MOCK_BLOGS = [
    {
        id: 1,
        slug: 'cach-chon-nem-mam-non-phu-hop',
        title: 'Cách Chọn Nệm Mầm Non Phù Hợp Cho Bé',
        excerpt: 'Hướng dẫn chi tiết giúp phụ huynh chọn được loại nệm phù hợp nhất cho con em mình...',
        content: '<p>Giấc ngủ đóng vai trò vô cùng quan trọng đối với sự phát triển toàn diện của trẻ mầm non. Một chiếc nệm chất lượng không chỉ mang đến giấc ngủ ngon mà còn hỗ trợ bảo vệ cột sống non nớt của bé.</p><h2>1. Chất liệu an toàn, thoáng khí</h2><p>Làn da của trẻ nhỏ rất nhạy cảm, dễ bị kích ứng. Do đó, tiêu chí đầu tiên khi chọn nệm mầm non là chất liệu phải an toàn, không chứa hóa chất độc hại. Nệm làm từ cao su thiên nhiên, foam cao cấp hay bông ép có khả năng kháng khuẩn, chống nấm mốc là những lựa chọn hàng đầu.</p><h2>2. Độ đàn hồi và độ phẳng nâng đỡ</h2><p>Giường nệm quá mềm sẽ khiến cột sống bị cong võng, ngược lại quá cứng sẽ gây đau nhức mình mẩy khiến bé trằn trọc. Độ đàn hồi vừa phải giúp nâng đỡ cơ thể bé trọn vẹn ở mọi tư thế.</p><h2>3. Kích thước và độ dày tiêu chuẩn</h2><p>Kích thước nệm mầm non phổ biến thường là 60x120cm hoặc 70x120cm, phù hợp với hầu hết các giường gấp và không gian trường mầm non. Độ dày lý tưởng từ 2-5cm, vừa đủ êm ái vừa an toàn khi bé lăn lộn.</p><h2>4. Vỏ nệm dễ tháo rời, vệ sinh</h2><p>Trẻ nhỏ thường xuyên tè dầm hay nôn trớ, việc vệ sinh nệm diễn ra thường xuyên. Lớp vỏ bọc kháng nước nhẹ, dễ dàng tháo rời bằng khóa kéo sẽ giúp các cô giáo và phụ huynh tiết kiệm tối đa thời gian giặt giũ.</p>',
        featured_image: '',
        category: 'Hướng dẫn',
        published_at: '2026-01-05T10:00:00Z',
        view_count: 1250,
    },
    {
        id: 2,
        slug: 'bao-quan-nem-dung-cach',
        title: 'Bảo Quản Nệm Đúng Cách Để Bền Lâu',
        excerpt: 'Những mẹo đơn giản giúp nệm mầm non của bạn luôn sạch sẽ và bền đẹp theo thời gian...',
        content: '<p>Bảo quản nệm mầm non sạch sẽ không chỉ kéo dài tuổi thọ sản phẩm mà còn bảo vệ sức khỏe hệ hô hấp của trẻ. Cùng tham khảo các bước vệ sinh chuẩn nhất.</p><h2>Giặt vỏ bọc thường xuyên</h2><p>Nên giặt vỏ nệm ít nhất 2 tuần 1 lần. Khuyến khích sử dụng xà phòng sinh học dịu nhẹ, hạn chế dùng chất tẩy rửa mạnh làm mục vải và ảnh hưởng đến da em bé.</p><h2>Xử lý các vết bẩn cứng đầu</h2><p>Khi trẻ ị đùn hay nôn mửa, cần xử lý ngay bằng khăn ướt tinh khiết, sau đó dùng cồn y tế hoặc nước giấm pha loãng lau sạch vết bẩn để khử mùi hiệu quả. Tuyệt đối không đem nệm ra phơi dưới nắng gắt trực tiếp làm hỏng ruột nệm.</p>',
        featured_image: '',
        category: 'Mẹo vặt',
        published_at: '2026-01-03T10:00:00Z',
        view_count: 980,
    },
    {
        id: 3,
        slug: 'loi-ich-giac-ngu-trua-tre-mam-non',
        title: 'Lợi Ích Của Giấc Ngủ Trưa Đối Với Trẻ Mầm Non',
        excerpt: 'Nghiên cứu khoa học về tầm quan trọng của giấc ngủ trưa trong sự phát triển của trẻ...',
        content: '<p>Trẻ nhỏ có nhu cầu ngủ cao hơn người lớn do thiết lập chu trình trao đổi chất diễn ra mạnh mẽ. Giấc ngủ trưa đóng vai trò như nhịp cầu chuyển tiếp, hồi phục năng lượng.</p><h2>Phát triển trí não và chiều cao</h2><p>Nghiên cứu khoa học chỉ ra rằng, trẻ được ngủ trưa từ 60-90 phút/ngày có khả năng ghi nhớ tốt hơn 20% so với trẻ không ngủ trưa. Hormone tăng trưởng chiều cao cũng được tiết ra nhiều nhất trong lúc trẻ ngủ sâu giấc.</p><h2>Giảm căng thẳng, ổn định cảm xúc</h2><p>Trẻ thiếu ngủ thường hay quấy khóc, bứt rứt, tăng động giảm chú ý. Một giấc ngủ trưa ngon lành giúp trẻ cân bằng lại hệ thần kinh, thức dậy vui vẻ và sẵn sàng tham gia các hoạt động buổi chiều tại lớp học hiệu quả hơn.</p>',
        featured_image: '',
        category: 'Kiến thức',
        published_at: '2026-01-01T10:00:00Z',
        view_count: 2100,
    },
];

async function getBlog(slug: string): Promise<Blog | null> {
    const apiUrl = getApiUrl();
    try {
        const res = await fetch(`${apiUrl}/public/blogs/${slug}`, {
            cache: 'no-store'
        });
        if (!res.ok) {
            // Fallback to mock data
            return MOCK_BLOGS.find(b => b.slug === slug) as any || null;
        }
        const data = await res.json();
        if (data.error) {
            return MOCK_BLOGS.find(b => b.slug === slug) as any || null;
        }
        return data;
    } catch (error) {
        console.error('Failed to fetch blog:', error);
        return MOCK_BLOGS.find(b => b.slug === slug) as any || null;
    }
}

async function getRelatedBlogs(category: string, currentSlug: string): Promise<Blog[]> {
    const apiUrl = getApiUrl();
    try {
        const res = await fetch(`${apiUrl}/public/blogs`, {
            cache: 'no-store'
        });
        if (!res.ok) {
            return MOCK_BLOGS.filter(b => b.category === category && b.slug !== currentSlug).slice(0, 3) as any[];
        }
        const blogs = await res.json();
        return Array.isArray(blogs)
            ? blogs.filter((b: Blog) => b.category === category && b.slug !== currentSlug).slice(0, 3)
            : MOCK_BLOGS.filter(b => b.category === category && b.slug !== currentSlug).slice(0, 3) as any[];
    } catch {
        return MOCK_BLOGS.filter(b => b.category === category && b.slug !== currentSlug).slice(0, 3) as any[];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const blog = await getBlog(resolvedParams.slug);

    const seo = blog?.seo_meta;
    const title = seo?.title || blog?.meta_title || (blog ? `${blog.title} | Tin Tức HULA` : 'Tin Tức | HULA');
    const description = seo?.description || blog?.meta_description || blog?.excerpt || 'Tin tức và kiến thức về nệm mầm non HULA';
    const robots = seo?.robots?.length ? seo.robots.join(', ') : 'index, follow';
    
    const imageUrl = seo?.ogImage ? resolveImageUrl(seo.ogImage) : (blog?.featured_image ? resolveImageUrl(blog.featured_image) : undefined);

    return {
        title,
        description,
        alternates: {
            canonical: seo?.canonicalUrl || (blog ? `https://nemmamnon.com/tin-tuc/${blog.slug}` : undefined),
        },
        openGraph: {
            title,
            description,
            type: 'article',
            images: imageUrl ? [imageUrl] : undefined,
        },
        robots: {
            index: robots.includes('index'),
            follow: robots.includes('follow'),
            nocache: robots.includes('noindex'),
            googleBot: {
                index: robots.includes('index'),
                follow: robots.includes('follow'),
            }
        }
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
            {/* SEO Schema */}
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': blog.seo_meta?.schemaType || 'Article',
                headline: blog.seo_meta?.title || blog.title,
                image: blog.featured_image ? [resolveImageUrl(blog.featured_image)] : undefined,
                datePublished: blog.published_at,
                dateModified: blog.published_at, // or updated_at if available
                author: [{
                    '@type': 'Organization',
                    name: 'Nệm Mầm Non Hula',
                    url: 'https://nemmamnon.com'
                }]
            }} />

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

                    {blog.featured_image && (
                        <div className="aspect-video bg-gray-100">
                            <img
                                src={resolveImageUrl(blog.featured_image)}
                                alt={blog.featured_image_alt || blog.title}
                                title={blog.featured_image_title || blog.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 lg:p-10">
                        <BlockRenderer 
                            blocks={blog.content_blocks} 
                            fallbackContent={blog.content || '<p>Nội dung đang được cập nhật...</p>'}
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
                                            src={resolveImageUrl(related.featured_image)}
                                            alt={related.featured_image_alt || related.title}
                                            title={related.featured_image_title || related.title}
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
