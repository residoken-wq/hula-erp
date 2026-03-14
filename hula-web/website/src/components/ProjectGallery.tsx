'use client';

import Link from 'next/link';
import { resolveImageUrl } from '@/lib/utils';

interface ProjectGalleryProps {
    projects?: Array<{
        title: string;
        school_name: string;
        description?: string;
        image_url?: string;
        slug?: string;
    }>;
    bgColor?: string;
    textColor?: string;
}

const defaultProjects = [
    { title: 'Dự án 1', school_name: 'Trường Mầm Non ABC', description: 'Thiết kế nội thất phòng học, bếp ăn và khu vui chơi hiện đại.', image_url: '', slug: '#' },
    { title: 'Dự án 2', school_name: 'Trường Tiểu Học XYZ', description: 'Cung cấp giải pháp nệm gối cho toàn bộ hệ thống bán trú.', image_url: '', slug: '#' },
    { title: 'Dự án 3', school_name: 'Trường Quốc Tế DEF', description: 'Thiết kế và sản xuất bộ nệm theo tiêu chuẩn quốc tế.', image_url: '', slug: '#' },
    { title: 'Dự án 4', school_name: 'Trường MN GHI', description: 'Cải tạo không gian ngủ nghỉ cho học sinh mầm non.', image_url: '', slug: '#' },
    { title: 'Dự án 5', school_name: 'Trường TH JKL', description: 'Trang bị toàn bộ nệm gối bán trú cho 20 lớp học.', image_url: '', slug: '#' },
];

/* ──────────────────────────────────────────
   Masonry-style project card
   ────────────────────────────────────────── */
function ProjectCard({ project, className }: { project: any; className?: string }) {
    return (
        <Link
            href={project.slug ? `/du-an/${project.slug}` : '#'}
            className={`relative overflow-hidden rounded-[12px] bg-gray-200 block ${className || ''}`}
        >
            {project.image_url ? (
                <img
                    src={resolveImageUrl(project.image_url)}
                    alt={project.school_name || project.title}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                    <span className="text-5xl">🏫</span>
                </div>
            )}
        </Link>
    );
}

export default function ProjectGallery({ projects, bgColor, textColor }: ProjectGalleryProps) {
    const items = (projects && projects.length > 0) ? projects : defaultProjects;

    return (
        <section className="py-16 lg:py-24" style={{ backgroundColor: bgColor || '#E6E7E8', color: textColor || undefined }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold" style={{ color: textColor || undefined }}>
                        Dự Án Nổi Bật
                    </h2>
                </div>

                {/* Masonry-style grid layout:
                    Row 1:  1 large (left, spans 2 rows)  +  2 small (right, stacked)
                    Row 2:  3 equal columns
                */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Item 0 — large, spans 2 cols + 2 rows */}
                    {items[0] && (
                        <ProjectCard
                            project={items[0]}
                            className="col-span-2 row-span-2 aspect-square lg:aspect-auto lg:min-h-[420px]"
                        />
                    )}
                    {/* Item 1 — top right */}
                    {items[1] && (
                        <ProjectCard
                            project={items[1]}
                            className="col-span-1 aspect-[4/3]"
                        />
                    )}
                    {/* Item 2 — top right */}
                    {items[2] && (
                        <ProjectCard
                            project={items[2]}
                            className="col-span-1 aspect-[4/3]"
                        />
                    )}
                    {/* Item 3 — bottom right */}
                    {items[3] && (
                        <ProjectCard
                            project={items[3]}
                            className="col-span-1 aspect-[4/3]"
                        />
                    )}
                    {/* Item 4 — bottom right */}
                    {items[4] && (
                        <ProjectCard
                            project={items[4]}
                            className="col-span-1 aspect-[4/3]"
                        />
                    )}
                    {/* Additional items in regular grid */}
                    {items.slice(5).map((project: any, index: number) => (
                        <ProjectCard
                            key={index + 5}
                            project={project}
                            className="col-span-1 aspect-[4/3]"
                        />
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
