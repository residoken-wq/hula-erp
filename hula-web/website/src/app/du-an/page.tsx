import Link from 'next/link';
import { getProjects } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import PageHeroBanner from '@/components/PageHeroBanner';

export const dynamic = 'force-dynamic';

const getApiUrl = () => {
    if (process.env.API_URL) return `${process.env.API_URL}/api`;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return 'https://erp.nemmamnon.com/api';
};

async function getSettings() {
    try {
        const res = await fetch(`${getApiUrl()}/public/settings`, { cache: 'no-store' });
        if (!res.ok) return {};
        return res.json();
    } catch {
        return {};
    }
}

export default async function ProjectsPage() {
    const [projects, settings] = await Promise.all([getProjects(), getSettings()]);

    return (
        <>
            <PageHeroBanner
                title={settings.banner_projects_title || "Dự Án Của HULA"}
                description={settings.banner_projects_desc || "Khám phá các dự án HULA đã triển khai tại trường học trên toàn quốc"}
                backgroundImage={settings.banner_projects_image}
            />

            {/* Projects Grid */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project: any) => {
                                const imgSrc = resolveImageUrl(project.image_url);
                                return (
                                    <Link
                                        key={project.id}
                                        href={`/du-an/${project.slug}`}
                                        className="card-v2 group overflow-hidden"
                                    >
                                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                                            {imgSrc ? (
                                                <img
                                                    src={imgSrc}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                                                    <span className="text-5xl">🏫</span>
                                                </div>
                                            )}
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                        <div className="p-5">
                                            <h5 className="font-heading font-semibold text-gray-800 group-hover:text-primary-500 transition-colors mb-1" style={{ fontSize: 'larger' }}>
                                                {project.title}
                                            </h5>
                                            {project.school_name && (
                                                <p className="text-sm text-gray-500 mb-2">{project.school_name}</p>
                                            )}
                                            {project.description && (
                                                <p className="text-xs text-gray-400 line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <span className="text-6xl block mb-4">🏗️</span>
                            <h3 className="font-heading font-semibold text-gray-600 mb-2">Đang cập nhật</h3>
                            <p className="text-gray-400">Các dự án sẽ được cập nhật sớm</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-section-blue">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-4">
                        Bạn muốn trở thành đối tác của HULA?
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
