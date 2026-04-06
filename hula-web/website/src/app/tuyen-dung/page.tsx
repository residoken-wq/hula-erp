import Link from 'next/link';
import { getRecruitmentJobs, getSettings } from '@/lib/api';
import PageHeroBanner from '@/components/PageHeroBanner';

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage() {
    const [jobs, settings] = await Promise.all([
        getRecruitmentJobs(),
        getSettings()
    ]);

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeroBanner
                title={settings?.banner_recruitment_title || "Tuyển Dụng"}
                description={settings?.banner_recruitment_desc || "Gia nhập gia đình Hula - Môi trường làm việc năng động, sáng tạo"}
                backgroundImage={settings?.banner_recruitment_image}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-8 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Vị trí đang tuyển</h2>
                    <p className="text-gray-600 mt-2">Khám phá các cơ hội nghề nghiệp tại Hula và bắt đầu hành trình của bạn.</p>
                </div>

                {jobs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-5xl mb-4">🥲</div>
                        <h3 className="text-lg font-medium text-gray-900">Hiện tại chưa có vị trí ứng tuyển nào</h3>
                        <p className="text-gray-500 mt-2">Vui lòng quay lại sau. Chúng tôi luôn tìm kiếm những nhân tài mới!</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {jobs.map((job: any) => (
                            <Link href={`/tuyen-dung/${job.slug}`} key={job.id} className="block group">
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-300 h-full flex flex-col">
                                    <div className="mb-4">
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                                            {job.department || 'Phòng ban khác'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                                        {job.title}
                                    </h3>
                                    
                                    <div className="mt-4 space-y-2 text-sm text-gray-600 flex-grow">
                                        <div className="flex items-center">
                                            <span className="w-5 flex justify-center text-gray-400 mr-2">📍</span>
                                            {job.location || 'Hồ Chí Minh'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-5 flex justify-center text-gray-400 mr-2">💼</span>
                                            {job.job_type === 'FULL_TIME' ? 'Toàn thời gian' : (job.job_type === 'PART_TIME' ? 'Bán thời gian' : 'Thực tập sinh')}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-5 flex justify-center text-gray-400 mr-2">💰</span>
                                            <span className="font-medium text-green-600">{job.salary_range || 'Thỏa thuận'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-primary-600 font-medium text-sm group-hover:text-primary-700">
                                        Xem chi tiết
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
