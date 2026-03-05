'use client';

import Link from 'next/link';
import { getGoogleDriveImageUrl } from '@/lib/utils';

interface ProjectGalleryProps {
    projects?: Array<{
        title: string;
        school_name: string;
        image_url?: string;
        slug?: string;
    }>;
}

const defaultProjects = [
    { title: 'Dự án 1', school_name: 'Trường Mầm Non ABC', image_url: '', slug: '#' },
    { title: 'Dự án 2', school_name: 'Trường Tiểu Học XYZ', image_url: '', slug: '#' },
    { title: 'Dự án 3', school_name: 'Trường Quốc Tế DEF', image_url: '', slug: '#' },
];

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
    const items = (projects && projects.length > 0) ? projects : defaultProjects;

    return (
        <section className="py-16 lg:py-24 bg-section-gray">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                        Dự Án Nổi Bật
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((project: any, index: number) => (
                        <Link
                            key={index}
                            href={project.slug ? `/du-an/${project.slug}` : '#'}
                            className="group relative overflow-hidden rounded-[12px] aspect-[4/3] bg-gray-200"
                        >
                            {project.image_url ? (
                                <img
                                    src={getGoogleDriveImageUrl(project.image_url)}
                                    alt={project.school_name || project.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                                    <span className="text-5xl">🏫</span>
                                </div>
                            )}
                            {/* Hover overlay - hiện tên trường */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                <div className="p-4 w-full">
                                    <h3 className="font-heading font-semibold text-white text-lg">
                                        {project.school_name || project.title}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <Link
                        href="/du-an"
                        className="btn-primary inline-flex items-center gap-2"
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
