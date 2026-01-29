import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chính Sách | Nệm Mầm Non HULA',
    description: 'Các chính sách bảo hành, đổi trả, bảo mật, vận chuyển và thanh toán của Nệm Mầm Non HULA',
};

interface Policy {
    slug: string;
    title: string;
    content: string;
    icon: string;
}

async function getPolicies(): Promise<Policy[]> {
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

export default async function PoliciesPage() {
    const policies = await getPolicies();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 opacity-5" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-6">
                            Chính Sách Của Chúng Tôi
                        </h1>
                        <p className="text-lg text-gray-600">
                            Cam kết mang đến trải nghiệm mua sắm an tâm và minh bạch cho quý khách hàng
                        </p>
                    </div>
                </div>
            </section>

            {/* Policies Grid */}
            <section className="py-12 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {policies.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {policies.map((policy, index) => (
                                <Link
                                    key={policy.slug}
                                    href={`/chinh-sach/${policy.slug}`}
                                    className="group"
                                >
                                    <div className="relative h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 transform hover:-translate-y-1">
                                        {/* Gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Card content */}
                                        <div className="relative p-6 lg:p-8">
                                            {/* Icon */}
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                                {policy.icon || '📋'}
                                            </div>

                                            {/* Title */}
                                            <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                                                {policy.title}
                                            </h2>

                                            {/* Description preview */}
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                                Xem chi tiết nội dung {policy.title.toLowerCase()}
                                            </p>

                                            {/* Read more link */}
                                            <div className="flex items-center text-primary-600 font-medium text-sm">
                                                <span>Xem chi tiết</span>
                                                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Bottom gradient line */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Đang cập nhật nội dung chính sách...</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Trust badges */}
            <section className="py-12 bg-gradient-to-r from-primary-600 to-primary-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
                        <div>
                            <div className="text-4xl mb-2">🛡️</div>
                            <p className="font-medium">Bảo hành chính hãng</p>
                        </div>
                        <div>
                            <div className="text-4xl mb-2">🚚</div>
                            <p className="font-medium">Giao hàng toàn quốc</p>
                        </div>
                        <div>
                            <div className="text-4xl mb-2">💯</div>
                            <p className="font-medium">Cam kết chất lượng</p>
                        </div>
                        <div>
                            <div className="text-4xl mb-2">📞</div>
                            <p className="font-medium">Hỗ trợ 24/7</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
