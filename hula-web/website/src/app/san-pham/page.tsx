import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories, getSettings } from '@/lib/api';
import PageHeroBanner from '@/components/PageHeroBanner';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
    const resolvedParams = await searchParams;
    const categoryId = resolvedParams.category ? Number(resolvedParams.category) : undefined;
    const sort = resolvedParams.sort || 'newest';
    const page = Number(resolvedParams.page) || 1;

    // Fetch data in parallel with error handling
    let products: any[] = [];
    let categories: any[] = [];
    let meta: any = {};
    let settings: any = {};

    try {
        const [productsRes, categoriesRes, settingsRes] = await Promise.all([
            getProducts({ limit: 12, page, sort, category: categoryId?.toString() }).catch(() => ({ data: [], meta: {} })),
            getCategories().catch(() => []),
            getSettings().catch(() => ({}))
        ]);

        // Handle products response (expecting { data: [], meta: {} })
        products = productsRes?.data || [];
        meta = productsRes?.meta || {};
        categories = Array.isArray(categoriesRes) ? categoriesRes : [];
        settings = settingsRes || {};
    } catch (error) {
        console.error('Error fetching products:', error);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeroBanner
                title={settings.banner_shop_title || "Sản Phẩm Nệm Mầm Non"}
                description={settings.banner_shop_desc || "Khám phá bộ sưu tập nệm mầm non chất lượng cao, an toàn cho bé yêu"}
                backgroundImage={settings.banner_shop_image}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-4">Danh mục</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="/san-pham"
                                        className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${!categoryId ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Tất cả sản phẩm
                                    </Link>
                                </li>
                                {categories.map((cat: any) => (
                                    <li key={cat.id}>
                                        <Link
                                            href={`/san-pham?category=${cat.id}`}
                                            className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${categoryId === cat.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {cat.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            {/* Simple Price Filter (Placeholder for now as backend needs update to support range) */}
                            <div className="mt-6 pt-6 border-t border-gray-100 opacity-50 pointer-events-none">
                                <h3 className="font-semibold text-gray-900 mb-4">Khoảng giá</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="price" className="w-4 h-4 text-primary-600" defaultChecked />
                                        <span className="ml-2 text-gray-600">Tất cả</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600">
                                Hiển thị <span className="font-medium">{products.length}</span> sản phẩm {meta.total ? `trên tổng số ${meta.total}` : ''}
                            </p>
                            {/* Sort Dropdown - Needs Client Component or simple Link based sort */}
                            <div className="flex gap-2 text-sm">
                                <Link href={{ query: { ...resolvedParams, sort: 'newest' } }} className={`px-3 py-1 rounded border ${sort === 'newest' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200'}`}>Mới nhất</Link>
                                <Link href={{ query: { ...resolvedParams, sort: 'price_asc' } }} className={`px-3 py-1 rounded border ${sort === 'price_asc' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200'}`}>Giá tăng dần</Link>
                                <Link href={{ query: { ...resolvedParams, sort: 'price_desc' } }} className={`px-3 py-1 rounded border ${sort === 'price_desc' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200'}`}>Giá giảm dần</Link>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Empty state */}
                        {products.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📦</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Chưa có sản phẩm</h3>
                                <p className="text-gray-600 mt-2">Sản phẩm đang được cập nhật, vui lòng quay lại sau.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {meta.last_page > 1 && (
                            <div className="mt-8 flex justify-center gap-2">
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                    <Link
                                        key={p}
                                        href={{ query: { ...resolvedParams, page: p } }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${page === p ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                                    >
                                        {p}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
