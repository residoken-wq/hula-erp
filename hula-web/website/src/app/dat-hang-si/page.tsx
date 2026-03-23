'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PageHeroBanner from '@/components/PageHeroBanner';

interface WizardProduct {
    product_id: number;
    sku: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    icon?: string;
}

interface WizardService {
    id: string;
    name: string;
    price: number;
    note?: string;
    icon?: string;
}

interface WizardConfig {
    main: WizardProduct[];
    accessory: WizardProduct[];
    service: WizardService[];
}

interface SelectedItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    type: 'main' | 'accessory' | 'service';
}

const STEPS = [
    { id: 1, title: 'Sản phẩm chính', icon: '🛏️', description: 'Nệm, gối, chăn' },
    { id: 2, title: 'Phụ kiện', icon: '👜', description: 'Túi, balo, tạp dề' },
    { id: 3, title: 'Thiết kế thương hiệu', icon: '🎨', description: 'Thêu, in logo' },
    { id: 4, title: 'Thông tin liên hệ', icon: '📋', description: 'Gửi yêu cầu báo giá' },
];

export default function WizardPage() {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState<WizardConfig>({ main: [], accessory: [], service: [] });
    const [selected, setSelected] = useState<SelectedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: '',
        company_name: '',
        phone: '',
        email: '',
        notes: ''
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        loadConfig();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/settings`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/wizard/config`);
            const data = await res.json();
            setConfig(data);
        } catch (error) {
            console.error('Failed to load wizard config:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (product: WizardProduct, type: 'main' | 'accessory') => {
        const existingIndex = selected.findIndex(s => s.id === product.product_id && s.type === type);
        if (existingIndex >= 0) {
            setSelected(selected.filter((_, i) => i !== existingIndex));
        } else {
            setSelected([...selected, {
                id: product.product_id,
                name: product.name,
                price: product.price,
                quantity: 100,
                type
            }]);
        }
    };

    const toggleService = (service: WizardService) => {
        const existingIndex = selected.findIndex(s => s.id === service.id && s.type === 'service');
        if (existingIndex >= 0) {
            setSelected(selected.filter((_, i) => i !== existingIndex));
        } else {
            setSelected([...selected, {
                id: service.id,
                name: service.name,
                price: service.price,
                quantity: 1,
                type: 'service'
            }]);
        }
    };

    const updateQuantity = (id: string | number, quantity: number) => {
        setSelected(selected.map(s =>
            s.id === id ? { ...s, quantity: Math.max(1, quantity) } : s
        ));
    };

    const totalPrice = selected.reduce((sum, item) => {
        if (item.type === 'service') {
            // Service giá cố định
            return sum + item.price;
        }
        return sum + (item.price * item.quantity);
    }, 0);

    const handleSubmit = async () => {
        if (!formData.customer_name || !formData.phone) {
            alert('Vui lòng điền đầy đủ họ tên và số điện thoại');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/wizard/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    selected_products: selected.map(s => ({
                        product_id: typeof s.id === 'number' ? s.id : undefined,
                        name: s.name,
                        quantity: s.quantity,
                        price: s.type === 'service' ? s.price : s.price * s.quantity,
                        type: s.type
                    })),
                    total_price: totalPrice
                })
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert('Có lỗi xảy ra, vui lòng thử lại');
            }
        } catch (error) {
            alert('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Đã gửi yêu cầu thành công!</h1>
                    <p className="text-gray-600 mb-6">
                        Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ trong vòng 24h để tư vấn chi tiết.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    const renderProductCard = (product: WizardProduct, type: 'main' | 'accessory') => {
        const isSelected = selected.some(s => s.id === product.product_id && s.type === type);
        const item = selected.find(s => s.id === product.product_id && s.type === type);

        return (
            <div
                key={product.product_id}
                onClick={() => toggleProduct(product, type)}
                className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 overflow-hidden ${isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                    }`}
            >
                {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                    </div>
                )}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-4xl">{type === 'main' ? '🛏️' : '👜'}</span>
                    )}
                </div>
                <div className="p-3">
                    <h3 className="font-medium text-gray-800 line-clamp-2 text-sm">{product.name}</h3>
                    {product.description && (
                        <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                    )}
                    <p className="text-amber-600 font-bold mt-2">
                        {product.price.toLocaleString('vi-VN')}đ
                    </p>
                </div>
                {isSelected && item && (
                    <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">SL:</span>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(product.product_id, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                min="1"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderServiceCard = (service: WizardService) => {
        const isSelected = selected.some(s => s.id === service.id && s.type === 'service');

        return (
            <div
                key={service.id}
                onClick={() => toggleService(service)}
                className={`cursor-pointer rounded-xl border-2 transition-all duration-200 p-4 ${isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                    }`}
            >
                <div className="flex items-start gap-3">
                    <div className="text-2xl">{service.icon || '🎨'}</div>
                    <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{service.name}</h3>
                        {service.note && (
                            <p className="text-xs text-gray-500 mt-1">{service.note}</p>
                        )}
                        <p className="text-amber-600 font-bold mt-2">
                            {service.price.toLocaleString('vi-VN')}đ
                        </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                        }`}>
                        {isSelected && <span className="text-white text-sm">✓</span>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
            <PageHeroBanner
                title={settings.banner_b2b_title || "Đặt Hàng Sỉ"}
                description={settings.banner_b2b_desc || "Customize sản phẩm nệm, gối, chăn theo yêu cầu của trường bạn"}
                backgroundImage={settings.banner_b2b_image}
            />

            {/* Stepper */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center">
                                <div
                                    onClick={() => s.id < step && setStep(s.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition ${step === s.id
                                            ? 'bg-amber-500 text-white'
                                            : step > s.id
                                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    <span className="text-lg">{s.icon}</span>
                                    <span className="hidden md:inline font-medium">{s.title}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${step > s.id ? 'bg-amber-400' : 'bg-gray-200'
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Step Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            {/* Step 1: Main Products */}
                            {step === 1 && (
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Bước 1: Chọn Sản Phẩm Chính</h2>
                                    <p className="text-gray-500 mb-6">Chọn các sản phẩm nệm, gối, chăn bạn muốn đặt</p>
                                    {config.main.length === 0 ? (
                                        <p className="text-gray-400 text-center py-8">Chưa có sản phẩm nào được cấu hình</p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {config.main.map(p => renderProductCard(p, 'main'))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Accessories */}
                            {step === 2 && (
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Bước 2: Chọn Phụ Kiện</h2>
                                    <p className="text-gray-500 mb-6">Túi, balo, tạp dề, áo bib và các sản phẩm bổ sung</p>
                                    {config.accessory.length === 0 ? (
                                        <p className="text-gray-400 text-center py-8">Chưa có phụ kiện nào được cấu hình</p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {config.accessory.map(p => renderProductCard(p, 'accessory'))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Services */}
                            {step === 3 && (
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Bước 3: Dịch Vụ Thương Hiệu</h2>
                                    <p className="text-gray-500 mb-6">Thêu logo, in tên, cá nhân hóa sản phẩm</p>
                                    {config.service.length === 0 ? (
                                        <p className="text-gray-400 text-center py-8">Chưa có dịch vụ nào được cấu hình</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {config.service.map(s => renderServiceCard(s))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Contact Form */}
                            {step === 4 && (
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Bước 4: Thông Tin Liên Hệ</h2>
                                    <p className="text-gray-500 mb-6">Điền thông tin để chúng tôi liên hệ báo giá chi tiết</p>
                                    <div className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Họ tên <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.customer_name}
                                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                placeholder="Nguyễn Văn A"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên công ty/trường
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                placeholder="Mầm Non ABC"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số điện thoại <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                placeholder="0912 345 678"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ghi chú thêm
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                placeholder="Yêu cầu đặc biệt, màu sắc, số lượng chi tiết..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-6">
                            <button
                                onClick={() => setStep(Math.max(1, step - 1))}
                                disabled={step === 1}
                                className={`px-6 py-3 rounded-lg font-medium transition ${step === 1
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ← Quay lại
                            </button>
                            {step < 4 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
                                >
                                    Tiếp tục →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50"
                                >
                                    {submitting ? 'Đang gửi...' : '📤 Gửi yêu cầu báo giá'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">📦 Tóm tắt đơn hàng</h3>

                            {selected.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Chưa chọn sản phẩm nào</p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {selected.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {item.type === 'service'
                                                        ? 'Dịch vụ'
                                                        : `${item.quantity} x ${item.price.toLocaleString('vi-VN')}đ`}
                                                </p>
                                            </div>
                                            <p className="font-medium text-amber-600">
                                                {(item.type === 'service' ? item.price : item.price * item.quantity).toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t mt-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">Tổng tạm tính:</span>
                                    <span className="font-bold text-2xl text-amber-600">
                                        {totalPrice.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    * Giá chính xác sẽ được báo sau khi tư vấn chi tiết
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
