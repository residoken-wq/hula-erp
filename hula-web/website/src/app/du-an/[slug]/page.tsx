import Link from 'next/link';
import api from '@/lib/api';
import { notFound } from 'next/navigation';

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
    const project = await getProject(params.slug);

    if (!project) {
        notFound();
    }

    return (
        <>
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white py-16 lg:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <Link href="/du-an" className="inline-flex items-center gap-2 text-primary-200 hover:text-white transition-colors mb-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Tất cả dự án
                    </Link>
                    <h1 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
                        {project.title}
                    </h1>
                    {project.school_name && (
                        <p className="text-lg text-primary-100">{project.school_name}</p>
                    )}
                    {project.location && (
                        <p className="text-primary-200 flex items-center gap-2 mt-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {project.location}
                        </p>
                    )}
                </div>
            </section>

            {/* Content */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Image Gallery */}
                    {project.images && project.images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                            {project.images.map((img: string, index: number) => (
                                <div key={index} className="aspect-[4/3] rounded-[12px] overflow-hidden bg-gray-100">
                                    <img
                                        src={img}
                                        alt={`${project.title} - ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    {project.description && (
                        <div className="max-w-3xl mx-auto">
                            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">Chi tiết dự án</h2>
                            <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                                {project.description}
                            </div>
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
