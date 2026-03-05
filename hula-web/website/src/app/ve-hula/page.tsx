import Link from 'next/link';
import { getHomeConfig } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    const config = await getHomeConfig() || {};

    return (
        <>
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20 lg:py-28 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-6">
                        Về HULA
                    </h1>
                    <p className="text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
                        {config.about_description || 'Hơn 10 năm đồng hành cùng giấc ngủ học đường - Giải pháp nệm, gối, chăn trường học toàn diện'}
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">Câu chuyện của chúng tôi</span>
                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mt-3 mb-6">
                                Từ Tâm Huyết Đến Thương Hiệu Uy Tín
                            </h2>
                            <div className="space-y-4 text-gray-600 leading-relaxed">
                                <p>
                                    HULA được thành lập với sứ mệnh mang đến giấc ngủ an lành, thoải mái cho trẻ em tại các trường học trên toàn quốc. Chúng tôi hiểu rằng giấc ngủ trưa chất lượng là nền tảng quan trọng cho sự phát triển toàn diện của trẻ.
                                </p>
                                <p>
                                    Với hơn 10 năm kinh nghiệm, HULA đã đồng hành cùng hàng trăm trường mầm non, tiểu học trên khắp 63 tỉnh thành, cung cấp giải pháp nệm, gối, chăn chất lượng cao, an toàn cho sức khỏe.
                                </p>
                                <p>
                                    Chúng tôi tự hào với quy trình sản xuất khép kín, kiểm soát chất lượng nghiêm ngặt từ khâu chọn nguyên liệu đến thành phẩm, đảm bảo mỗi sản phẩm đều đạt tiêu chuẩn cao nhất.
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="w-full aspect-[4/3] bg-gradient-to-br from-section-blue to-primary-200 rounded-[12px] flex items-center justify-center shadow-soft-lg">
                                <span className="text-7xl">🏭</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision / Mission */}
            <section className="py-16 lg:py-24 bg-section-blue">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[12px] p-8 shadow-soft">
                            <div className="w-14 h-14 bg-primary-100 rounded-[12px] flex items-center justify-center text-2xl mb-4">
                                🎯
                            </div>
                            <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">Tầm nhìn</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Trở thành thương hiệu hàng đầu Việt Nam trong lĩnh vực cung cấp sản phẩm chăm sóc giấc ngủ cho trẻ em tại trường học, góp phần nâng cao chất lượng giáo dục.
                            </p>
                        </div>
                        <div className="bg-white rounded-[12px] p-8 shadow-soft">
                            <div className="w-14 h-14 bg-primary-100 rounded-[12px] flex items-center justify-center text-2xl mb-4">
                                ❤️
                            </div>
                            <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">Sứ mệnh</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Mang đến giải pháp nghỉ ngơi toàn diện, an toàn và thẩm mỹ cho mọi trường học. Đồng hành cùng nhà trường xây dựng môi trường học tập và nghỉ ngơi tốt nhất cho trẻ.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { number: '10+', label: 'Năm kinh nghiệm' },
                            { number: '500+', label: 'Trường học' },
                            { number: '63', label: 'Tỉnh thành' },
                            { number: '100K+', label: 'Sản phẩm/năm' },
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl lg:text-5xl font-heading font-bold text-primary-500 mb-2">{stat.number}</div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gradient-to-r from-primary-500 to-primary-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
                        Bạn cần tư vấn?
                    </h2>
                    <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
                        Liên hệ ngay để nhận báo giá sỉ ưu đãi và chính sách hỗ trợ đặc biệt dành cho đối tác
                    </p>
                    <Link
                        href="/lien-he"
                        className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-bold rounded-pill hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Liên hệ ngay
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </>
    );
}
