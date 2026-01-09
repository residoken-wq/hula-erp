import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

// This would be fetched from API in production
async function getProducts() {
    try {
        const res = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/public/products`, {
            cache: 'no-store',
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        // Return mock data for development
        return [
            { id: 1, sku: 'NEM-001', name: 'Nệm Mầm Non Cơ Bản', base_price: 450000, category: 'Nệm Đơn' },
            { id: 2, sku: 'NEM-002', name: 'Nệm Mầm Non Cao Cấp', base_price: 650000, category: 'Nệm Đơn' },
            { id: 3, sku: 'NEM-003', name: 'Combo Nệm + Gối', base_price: 850000, category: 'Combo' },
            { id: 4, sku: 'NEM-004', name: 'Nệm Mầm Non Premium', base_price: 950000, category: 'Nệm Cao Cấp' },
            { id: 5, sku: 'NEM-005', name: 'Nệm Nhập Khẩu Hàn Quốc', base_price: 1200000, category: 'Nệm Cao Cấp' },
            { id: 6, sku: 'NEM-006', name: 'Nệm Organic Cotton', base_price: 780000, category: 'Nệm Đơn' },
        ];
    }
}

async function getCategories() {
    try {
        const res = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/public/categories`, {
            cache: 'no-store',
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [
            { id: 1, name: 'Tất cả', code: 'all' },
            { id: 2, name: 'Nệm Đơn', code: 'nem-don' },
            { id: 3, name: 'Nệm Cao Cấp', code: 'nem-cao-cap' },
            { id: 4, name: 'Combo', code: 'combo' },
        ];
    }
}

export default async function ProductsPage() {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl lg:text-4xl font-bold">Sản Phẩm Nệm Mầm Non</h1>
                    <p className="mt-4 text-primary-100 max-w-2xl mx-auto">
                        Khám phá bộ sưu tập nệm mầm non chất lượng cao, an toàn cho bé yêu
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-4">Danh mục</h3>
                            <ul className="space-y-2">
                                <li>
                                    <button className="w-full text-left px-3 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium">
                                        Tất cả sản phẩm
                                    </button>
                                </li>
                                {categories.map((cat: any) => (
                                    <li key={cat.id}>
                                        <button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4">Khoảng giá</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="price" className="w-4 h-4 text-primary-600" defaultChecked />
                                        <span className="ml-2 text-gray-600">Tất cả</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="price" className="w-4 h-4 text-primary-600" />
                                        <span className="ml-2 text-gray-600">Dưới 500,000đ</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="price" className="w-4 h-4 text-primary-600" />
                                        <span className="ml-2 text-gray-600">500,000đ - 800,000đ</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="price" className="w-4 h-4 text-primary-600" />
                                        <span className="ml-2 text-gray-600">Trên 800,000đ</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600">
                                Hiển thị <span className="font-medium">{products.length}</span> sản phẩm
                            </p>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                <option>Mới nhất</option>
                                <option>Giá: Thấp đến Cao</option>
                                <option>Giá: Cao đến Thấp</option>
                                <option>Phổ biến nhất</option>
                            </select>
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
                    </main>
                </div>
            </div>
        </div>
    );
}
