import { notFound } from 'next/navigation';
import { getRecruitmentJobBySlug, getSettings } from '@/lib/api';
import PageHeroBanner from '@/components/PageHeroBanner';
import ApplicationForm from './ApplicationForm';

export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
    const [job, settings] = await Promise.all([
        getRecruitmentJobBySlug(params.slug),
        getSettings()
    ]);

    if (!job) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeroBanner
                title={job.title}
                description={`${job.department || 'Phòng ban khác'} • ${job.location || 'Hồ Chí Minh'} • ${job.job_type === 'FULL_TIME' ? 'Toàn thời gian' : (job.job_type === 'PART_TIME' ? 'Bán thời gian' : 'Thực tập sinh')}`}
                backgroundImage={settings?.banner_recruitment_image}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Chi tiết công việc</h2>
                            <div 
                                className="prose max-w-none prose-primary"
                                dangerouslySetInnerHTML={{ __html: job.description || 'Chưa có mô tả chi tiết.' }}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-24">
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin chung</h3>
                                <ul className="space-y-4 text-sm text-gray-600">
                                    <li className="flex items-start">
                                        <span className="text-gray-400 mr-3 mt-0.5">💰</span>
                                        <div>
                                            <span className="block font-medium text-gray-900">Mức lương</span>
                                            {job.salary_range || 'Thỏa thuận'}
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-gray-400 mr-3 mt-0.5">🤝</span>
                                        <div>
                                            <span className="block font-medium text-gray-900">Hình thức làm việc</span>
                                            {job.job_type === 'FULL_TIME' ? 'Toàn thời gian' : (job.job_type === 'PART_TIME' ? 'Bán thời gian' : 'Thực tập sinh')}
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-gray-400 mr-3 mt-0.5">📍</span>
                                        <div>
                                            <span className="block font-medium text-gray-900">Địa điểm</span>
                                            {job.location || 'Hồ Chí Minh'}
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <ApplicationForm job={job} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
