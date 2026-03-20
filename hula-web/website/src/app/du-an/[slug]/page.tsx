import Link from 'next/link';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import { notFound } from 'next/navigation';
import PageHeroBanner from '@/components/PageHeroBanner';

export const dynamic = 'force-dynamic';

async function getProject(slug: string) {
    try {
        const { data } = await api.get(`/projects/${slug}`);
        return data;
    } catch {
        return null;
    }
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
    const resolvedParams = await params;
    const project = await getProject(resolvedParams.slug);

    if (!project || project.error) {
        notFound();
    }

    const imgSrc = resolveImageUrl(project.image_url);

    return (
        <>
            {/* Hero */}
            <PageHeroBanner
                title={project.title}
                description={project.school_name || ''}
                backgroundImage={project.image_url}
            />

            {/* Content */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link href="/du-an" className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-700 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Tất cả dự án
                        </Link>
                    </div>

                    {/* Featured Image */}
                    {imgSrc && (
                        <div className="mb-12">
                            <div className="aspect-[16/9] rounded-[12px] overflow-hidden bg-gray-100">
                                <img
                                    src={imgSrc}
                                    alt={project.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {project.description && (
                        <div className="max-w-3xl mx-auto mb-8">
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {project.description}
                            </p>
                        </div>
                    )}

                    {/* Content (HTML from CKEditor) */}
                    {project.content && (
                        <div className="max-w-3xl mx-auto">
                            <div
                                className="prose prose-gray max-w-none"
                                dangerouslySetInnerHTML={{ __html: project.content }}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-section-blue">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-4">
                        Bạn muốn triển khai dự án tương tự?
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Liên hệ ngay để được tư vấn giải pháp phù hợp cho trường của bạn
                    </p>
                    <Link
                        href="/lien-he"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        Liên hệ tư vấn
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </>
    );
}

