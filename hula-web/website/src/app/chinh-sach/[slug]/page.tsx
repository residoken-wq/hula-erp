import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Policy {
    slug: string;
    title: string;
    content: string;
    icon: string;
    updated_at: string;
}

async function getPolicy(slug: string): Promise<Policy | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/policies/${slug}`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.error) return null;
        return data;
    } catch (error) {
        console.error('Failed to fetch policy:', error);
        return null;
    }
}

async function getAllPolicies(): Promise<Policy[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/policies`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error('Failed to fetch policies:', error);
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const policy = await getPolicy(resolvedParams.slug);

    return {
        title: policy ? `${policy.title} | Nệm Mầm Non HULA` : 'Chính sách | Nệm Mầm Non HULA',
        description: policy ? `Chi tiết ${policy.title} của Nệm Mầm Non HULA` : 'Chính sách của Nệm Mầm Non HULA',
    };
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const [policy, allPolicies] = await Promise.all([
        getPolicy(resolvedParams.slug),
        getAllPolicies()
    ]);

    if (!policy) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-primary-600 transition-colors">
                            Trang chủ
                        </Link>
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <Link href="/chinh-sach" className="text-gray-500 hover:text-primary-600 transition-colors">
                            Chính sách
                        </Link>
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900 font-medium">{policy.title}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="p-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
                                    <h3 className="font-semibold">Chính sách</h3>
                                </div>
                                <nav className="p-2">
                                    {allPolicies.map((p) => (
                                        <Link
                                            key={p.slug}
                                            href={`/chinh-sach/${p.slug}`}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${p.slug === policy.slug
                                                    ? 'bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                                }`}
                                        >
                                            <span className="text-xl">{p.icon || '📋'}</span>
                                            <span className="text-sm">{p.title}</span>
                                            {p.slug === policy.slug && (
                                                <svg className="w-4 h-4 ml-auto text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            {/* Contact Card */}
                            <div className="mt-6 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl p-6 text-white">
                                <h4 className="font-semibold mb-2">Cần hỗ trợ?</h4>
                                <p className="text-sm text-white/80 mb-4">
                                    Liên hệ với chúng tôi để được tư vấn chi tiết
                                </p>
                                <a
                                    href="/lien-he"
                                    className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                                >
                                    Liên hệ ngay
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3">
                        <article className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="p-6 lg:p-8 border-b bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center text-3xl">
                                        {policy.icon || '📋'}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                            {policy.title}
                                        </h1>
                                        {policy.updated_at && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Cập nhật: {new Date(policy.updated_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 lg:p-8">
                                <div
                                    className="prose prose-lg max-w-none
                                        prose-headings:text-gray-900 prose-headings:font-bold
                                        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2
                                        prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                                        prose-p:text-gray-600 prose-p:leading-relaxed
                                        prose-li:text-gray-600
                                        prose-strong:text-gray-900
                                        prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
                                        prose-ul:list-disc prose-ul:pl-6
                                        prose-ol:list-decimal prose-ol:pl-6"
                                    dangerouslySetInnerHTML={{ __html: policy.content || '<p>Nội dung đang được cập nhật...</p>' }}
                                />
                            </div>
                        </article>

                        {/* Navigation between policies */}
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {(() => {
                                const currentIndex = allPolicies.findIndex(p => p.slug === policy.slug);
                                const prevPolicy = currentIndex > 0 ? allPolicies[currentIndex - 1] : null;
                                const nextPolicy = currentIndex < allPolicies.length - 1 ? allPolicies[currentIndex + 1] : null;

                                return (
                                    <>
                                        {prevPolicy ? (
                                            <Link
                                                href={`/chinh-sach/${prevPolicy.slug}`}
                                                className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-primary-300 hover:shadow-md transition-all group"
                                            >
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                <div>
                                                    <p className="text-xs text-gray-500">Trước đó</p>
                                                    <p className="font-medium text-gray-900 group-hover:text-primary-600">{prevPolicy.title}</p>
                                                </div>
                                            </Link>
                                        ) : <div />}
                                        {nextPolicy && (
                                            <Link
                                                href={`/chinh-sach/${nextPolicy.slug}`}
                                                className="flex items-center justify-end gap-3 p-4 bg-white rounded-xl border hover:border-primary-300 hover:shadow-md transition-all group text-right"
                                            >
                                                <div>
                                                    <p className="text-xs text-gray-500">Tiếp theo</p>
                                                    <p className="font-medium text-gray-900 group-hover:text-primary-600">{nextPolicy.title}</p>
                                                </div>
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
