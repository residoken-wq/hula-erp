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
import B2B360ExperienceModal from './B2B360ExperienceModal';

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

    // 360 Experience Modal State
    const [is360ModalOpen, setIs360ModalOpen] = useState(false);
    const [initial360Tab, setInitial360Tab] = useState<'studio' | 'classroom'>('studio');

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
    const currentL1: WizardCategoryL1 | undefined = (config?.categories || []).find(c => c && c.id === selectedL1);
    const currentL2: WizardCategoryL2 | undefined = (currentL1?.subcategories || []).find(c => c && c.id === selectedL2);

    // Initialize default selections when switching L2
    useEffect(() => {
        if (currentL2 && currentL2.customization_steps) {
            const initialSelections: Record<string, string> = {};
            currentL2.customization_steps.forEach(step => {
                if (!step) return;
                if (step.default_option_id) {
                    initialSelections[step.id] = step.default_option_id;
                } else if (step.options && step.options.length > 0) {
                    const firstValidOpt = step.options.find(Boolean);
                    if (firstValidOpt) {
                        initialSelections[step.id] = firstValidOpt.id;
                    }
                }
            });
            setStepSelections(initialSelections);
        }
    }, [selectedL2, currentL2]);

    const handleSelectL1 = (id: string) => {
        setSelectedL1(id);
        const l1 = (config?.categories || []).find(c => c && c.id === id);
        if (l1 && l1.subcategories && l1.subcategories.length > 0) {
            const firstValidSub = l1.subcategories.find(Boolean);
            if (firstValidSub) {
                setSelectedL2(firstValidSub.id);
            } else {
                setSelectedL2('');
            }
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

    const selectedOptionsList = (currentL2?.customization_steps || [])
        .filter(Boolean)
        .map(step => {
            const optionId = stepSelections[step.id];
            return (step.options || []).find(o => o && o.id === optionId);
        })
        .filter(Boolean) as any[];

    // Extract active custom color
    const selectedColorOption = selectedOptionsList.find(o => o?.color_code && o.color_code.trim() !== '' && o.color_code !== '#000000');
    const selectedColorHex = selectedColorOption?.color_code || '#8CE3CB';
    const selectedColorName = selectedColorOption?.name || 'Mặc định';

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

                            {/* 360 & 3D Classroom Experience CTA Banner */}
                            <div className="mt-4 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-cyan-500/30 relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />
                                
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                                Mô Phỏng 3D Chuẩn Xưởng HULA
                                            </span>
                                            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-bold">
                                                3D 360°
                                            </span>
                                        </div>
                                        <h3 className="text-base font-extrabold text-white tracking-tight">
                                            Trải Nghiệm 360° Với Bản Phối Này
                                        </h3>
                                        <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed">
                                            Xoay 360° kiểm tra nệm, chăn, gối và túi xách (bung linh kiện, lót che chỉ thêu) hoặc đặt vào bối cảnh lớp học mầm non thực tế.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInitial360Tab('studio');
                                                setIs360ModalOpen(true);
                                            }}
                                            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <span>🛋️</span>
                                            <span>Studio 360°</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInitial360Tab('classroom');
                                                setIs360ModalOpen(true);
                                            }}
                                            className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <span>🏫</span>
                                            <span>Lớp Học 360°</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                onShow360={() => {
                                    setInitial360Tab('studio');
                                    setIs360ModalOpen(true);
                                }}
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
            <section className="bg-white py-20 mt-12 relative overflow-hidden border-t border-gray-100">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-sm font-bold tracking-wider text-primary uppercase mb-2 block">Roadmap</span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Quy Trình Triển Khai B2B Chuyên Nghiệp</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">Đồng hành cùng bạn từ ý tưởng đến sản phẩm hoàn thiện với quy trình khép kín, minh bạch và tối ưu.</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-primary to-blue-100 -translate-y-1/2 z-0 opacity-50 rounded-full"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative z-10">
                            {/* Step 1 */}
                            <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full p-1 shadow-sm">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">1</div>
                                </div>
                                <div className="mt-6 text-center">
                                    <div className="w-14 h-14 mx-auto bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    </div>
                                    <h3 className="font-bold text-lg mb-3 text-gray-800">Tư Vấn & Lên Ý Tưởng</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Trao đổi yêu cầu, chọn mẫu thiết kế, và nhận bảng giá chi tiết phù hợp với ngân sách.</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 md:mt-8">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full p-1 shadow-sm">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">2</div>
                                </div>
                                <div className="mt-6 text-center">
                                    <div className="w-14 h-14 mx-auto bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <h3 className="font-bold text-lg mb-3 text-gray-800">Thiết Kế Mockup</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Lên phối cảnh 3D thực tế với màu sắc thương hiệu và logo trường một cách trực quan.</p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full p-1 shadow-sm">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">3</div>
                                </div>
                                <div className="mt-6 text-center">
                                    <div className="w-14 h-14 mx-auto bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <h3 className="font-bold text-lg mb-3 text-gray-800">Duyệt Mẫu Thực Tế</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Gửi mẫu thật đến tận nơi để nhà trường kiểm tra trực tiếp chất liệu và form dáng.</p>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 md:mt-8">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full p-1 shadow-sm">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">4</div>
                                </div>
                                <div className="mt-6 text-center">
                                    <div className="w-14 h-14 mx-auto bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                    </div>
                                    <h3 className="font-bold text-lg mb-3 text-gray-800">Sản Xuất & Giao Hàng</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Tiến hành sản xuất số lượng lớn đúng tiến độ cam kết và giao hàng tận nơi nhanh chóng.</p>
                                </div>
                            </div>
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

            {/* B2B Interactive 360 Experience Modal */}
            {currentL2 && (
                <B2B360ExperienceModal
                    isOpen={is360ModalOpen}
                    onClose={() => setIs360ModalOpen(false)}
                    subcategory={currentL2}
                    selectedOptions={selectedOptionsList}
                    selectedColorHex={selectedColorHex}
                    selectedColorName={selectedColorName}
                    onProceedToLead={() => {
                        setIs360ModalOpen(false);
                        setIsModalOpen(true);
                    }}
                    initialTab={initial360Tab}
                />
            )}
        </div>
    );
}
