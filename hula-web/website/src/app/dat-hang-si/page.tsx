'use client';

import { useState, useEffect } from 'react';
import PageHeroBanner from '@/components/PageHeroBanner';
import { WizardConfigData, WizardCategoryL1, WizardCategoryL2 } from './types';
import CategoryFunnel from './CategoryFunnel';
import ConfiguratorAccordion from './ConfiguratorAccordion';
import ProductVisualizer from './ProductVisualizer';
import DynamicPriceBar from './DynamicPriceBar';
import B2BLeadModal from './B2BLeadModal';
import SelectionSummary from './SelectionSummary';

export default function B2BConfiguratorPage() {
    const [config, setConfig] = useState<WizardConfigData | null>(null);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Selections state
    const [selectedL1, setSelectedL1] = useState<string>('');
    const [selectedL2, setSelectedL2] = useState<string>('');
    const [stepSelections, setStepSelections] = useState<Record<string, string>>({}); // stepId -> optionId
    const [skippedSteps, setSkippedSteps] = useState<Record<string, boolean>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageSelections, setImageSelections] = useState<Record<string, number>>({}); // optionId -> image index

    useEffect(() => {
        const loadData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';
                const [settingsRes, configRes] = await Promise.all([
                    fetch(`${apiUrl}/public/settings`),
                    fetch(`${apiUrl}/public/wizard/config`)
                ]);

                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(settingsData);
                }

                if (configRes.ok) {
                    const configData = await configRes.json();
                    setConfig(configData);

                    // Khởi tạo state mặc định nếu có categories
                    if (configData.categories && configData.categories.length > 0) {
                        const firstL1 = configData.categories[0];
                        setSelectedL1(firstL1.id);
                        if (firstL1.subcategories && firstL1.subcategories.length > 0) {
                            setSelectedL2(firstL1.subcategories[0].id);
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu trang:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Helper: get current L1 and L2
    const currentL1: WizardCategoryL1 | undefined = config?.categories?.find(c => c.id === selectedL1);
    const currentL2: WizardCategoryL2 | undefined = currentL1?.subcategories?.find(c => c.id === selectedL2);

    // Initialize default selections when switching L2
    useEffect(() => {
        if (currentL2 && currentL2.customization_steps) {
            const initialSelections: Record<string, string> = {};
            currentL2.customization_steps.forEach(step => {
                if (step.default_option_id) {
                    initialSelections[step.id] = step.default_option_id;
                } else if (step.options && step.options.length > 0) {
                    initialSelections[step.id] = step.options[0].id;
                }
            });
            setStepSelections(initialSelections);
        }
    }, [selectedL2, currentL2]);

    const handleSelectL1 = (id: string) => {
        setSelectedL1(id);
        const l1 = config?.categories?.find(c => c.id === id);
        if (l1 && l1.subcategories && l1.subcategories.length > 0) {
            setSelectedL2(l1.subcategories[0].id);
        } else {
            setSelectedL2('');
        }
    };

    const handleSelectL2 = (id: string) => {
        setSelectedL2(id);
    };

    const handleStepChange = (stepId: string, optionId: string) => {
        setStepSelections(prev => ({
            ...prev,
            [stepId]: optionId
        }));
        // Un-skip if was skipped
        setSkippedSteps(prev => ({ ...prev, [stepId]: false }));
    };

    const handleSkipStep = (stepId: string) => {
        setSkippedSteps(prev => ({
            ...prev,
            [stepId]: !prev[stepId]
        }));
    };

    const handleImageSelect = (optionId: string, imageIndex: number) => {
        setImageSelections(prev => ({
            ...prev,
            [optionId]: imageIndex
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!config || !config.categories || config.categories.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Trang đang được cập nhật</h2>
                <p className="text-gray-500">Vui lòng quay lại sau</p>
            </div>
        );
    }

    const selectedOptionsList = currentL2?.customization_steps?.map(step => {
        const optionId = stepSelections[step.id];
        return step.options?.find(o => o.id === optionId);
    }).filter(Boolean) as any[] || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Banner thay vì dùng PageHeroBanner, mình sẽ có thể custom hoặc dùng luôn Component hiện tại */}
            <PageHeroBanner
                title={config.hero_title || settings.banner_b2b_title || "Đặt Hàng Sỉ B2B"}
                description={config.hero_subtitle || settings.banner_b2b_desc || "Tự thiết kế sản phẩm mang đậm dấu ấn ngôi trường của bạn"}
                backgroundImage={settings.banner_b2b_image}
            />

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <CategoryFunnel 
                    categories={config.categories}
                    selectedL1={selectedL1}
                    selectedL2={selectedL2}
                    onSelectL1={handleSelectL1}
                    onSelectL2={handleSelectL2}
                />

                {currentL2 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                        {/* Cột trái: Visualization */}
                        <div className="lg:sticky lg:top-24 h-max">
                            <ProductVisualizer 
                                subcategory={currentL2}
                                selectedOptions={selectedOptionsList}
                                stepSelections={stepSelections}
                                imageSelections={imageSelections}
                                skippedSteps={skippedSteps}
                            />
                            <SelectionSummary
                                subcategory={currentL2}
                                steps={currentL2.customization_steps || []}
                                selections={stepSelections}
                                skippedSteps={skippedSteps}
                            />
                        </div>

                        {/* Cột phải: Accordion Configurator & Dynamic Pricing */}
                        <div className="flex flex-col gap-6">
                            {currentL2.customization_steps && currentL2.customization_steps.length > 0 ? (
                                <ConfiguratorAccordion 
                                    steps={currentL2.customization_steps}
                                    selections={stepSelections}
                                    onChange={handleStepChange}
                                    skippedSteps={skippedSteps}
                                    onSkip={handleSkipStep}
                                    imageSelections={imageSelections}
                                    onImageSelect={handleImageSelect}
                                />
                            ) : (
                                <div className="p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
                                    <p className="text-gray-500">Sản phẩm này chưa có cấu hình tùy biến.</p>
                                </div>
                            )}

                            <DynamicPriceBar 
                                subcategory={currentL2}
                                steps={currentL2.customization_steps || []}
                                selections={stepSelections}
                                onShowModal={() => setIsModalOpen(true)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-gray-500">Vui lòng chọn một danh mục sản phẩm ở trên</p>
                    </div>
                )}
            </main>

            {/* Quy trình & Trust Section */}
            <section className="bg-white py-16 mt-12 border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-10">Quy Trình Triển Khai B2B Chuyên Nghiệp</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl mb-4">1️⃣</div>
                            <h3 className="font-bold mb-2">Tư Vấn & Lên Ý Tưởng</h3>
                            <p className="text-sm text-gray-500">Trao đổi yêu cầu, chọn mẫu, và nhận bảng giá chi tiết.</p>
                        </div>
                        <div>
                            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl mb-4">2️⃣</div>
                            <h3 className="font-bold mb-2">Thiết Kế Mockup</h3>
                            <p className="text-sm text-gray-500">Lên phối cảnh 3D thực tế với màu sắc và logo trường.</p>
                        </div>
                        <div>
                            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl mb-4">3️⃣</div>
                            <h3 className="font-bold mb-2">Duyệt Mẫu Thực Tế</h3>
                            <p className="text-sm text-gray-500">Gửi mẫu thật đến tận nơi để trường kiểm tra chất lượng.</p>
                        </div>
                        <div>
                            <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl mb-4">4️⃣</div>
                            <h3 className="font-bold mb-2">Sản Xuất & Giao Hàng</h3>
                            <p className="text-sm text-gray-500">Sản xuất số lượng lớn đúng tiến độ và giao hàng tận nơi.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* B2B Lead Modal */}
            {currentL1 && currentL2 && (
                <B2BLeadModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    category={currentL1}
                    subcategory={currentL2}
                    steps={currentL2.customization_steps || []}
                    selections={stepSelections}
                />
            )}
        </div>
    );
}
