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
    bgColor?: string;
    textColor?: string;
}

const defaultProjects = [
    { title: 'Dự án 1', school_name: 'Trường Mầm Non ABC', image_url: '', slug: '#' },
    { title: 'Dự án 2', school_name: 'Trường Tiểu Học XYZ', image_url: '', slug: '#' },
    { title: 'Dự án 3', school_name: 'Trường Quốc Tế DEF', image_url: '', slug: '#' },
    { title: 'Dự án 4', school_name: 'Trường MN Hoa Sen', image_url: '', slug: '#' },
    { title: 'Dự án 5', school_name: 'Trường TH Ngôi Sao', image_url: '', slug: '#' },
    { title: 'Dự án 6', school_name: 'Trường MN Ánh Dương', image_url: '', slug: '#' },
];

function ProjectCard({ project, className }: { project: any; className?: string }) {
    const href = project.slug ? `/du-an/${project.slug}` : '#';
    return (
        <Link href={href} className={`group relative overflow-hidden rounded-[12px] bg-gray-200 block ${className || ''}`}>
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
            {/* Overlay with name */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 w-full">
                    <h3 className="font-heading font-semibold text-white text-sm lg:text-base">
                        {project.school_name || project.title}
                    </h3>
                </div>
            </div>
        </Link>
    );
}

export default function ProjectGallery({ projects, bgColor, textColor }: ProjectGalleryProps) {
    const items = (projects && projects.length > 0) ? projects : defaultProjects;

    // Bento grid: first item large, next 2 stacked right, bottom row 3 equal
    const mainItem = items[0];
    const sideItems = items.slice(1, 3);
    const bottomItems = items.slice(3, 6);

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#FFFFFF', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl lg:text-3xl font-heading font-bold uppercase" style={{ color: textColor || '#1a365d' }}>
                        Dự Án Nổi Bật
                    </h2>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    {/* Main large image — spans 3 columns */}
                    {mainItem && (
                        <ProjectCard
                            project={mainItem}
                            className="lg:col-span-3 aspect-[4/3] lg:aspect-auto lg:row-span-2 min-h-[300px] lg:min-h-[400px]"
                        />
                    )}
                    {/* 2 stacked images on the right — span 2 columns */}
                    {sideItems.map((project: any, index: number) => (
                        <ProjectCard
                            key={index}
                            project={project}
                            className="lg:col-span-2 aspect-[16/10]"
                        />
                    ))}
                </div>

                {/* Bottom row — 3 equal images */}
                {bottomItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {bottomItems.map((project: any, index: number) => (
                            <ProjectCard
                                key={index}
                                project={project}
                                className="aspect-[4/3]"
                            />
                        ))}
                    </div>
                )}

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
