'use client';

import React, { useState, useEffect } from 'react';
import { WizardCategoryL2, WizardOption } from './types';
import Product360Studio from './Product360Studio';
import { CampusSchoolPOV } from '@/components/tour360/school-pov/CampusSchoolPOV';

interface B2B360ExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    subcategory: WizardCategoryL2;
    selectedOptions: WizardOption[];
    selectedColorHex?: string;
    selectedColorName?: string;
    logoUrl?: string | null;
    onProceedToLead: () => void;
    initialTab?: 'studio' | 'classroom';
}

export default function B2B360ExperienceModal({
    isOpen,
    onClose,
    subcategory,
    selectedOptions,
    selectedColorHex = '#8CE3CB',
    selectedColorName = 'Xanh ngọc',
    logoUrl = null,
    onProceedToLead,
    initialTab = 'studio',
}: B2B360ExperienceModalProps) {
    const [activeTab, setActiveTab] = useState<'studio' | 'classroom'>(initialTab);

    // Escape listener & scroll lock
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const customDesign = {
        colorHex: selectedColorHex,
        colorName: selectedColorName,
        logoUrl: logoUrl,
        subcategoryName: subcategory.name,
    };

    return (
        <div
            className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none"
            role="dialog"
            aria-modal="true"
            aria-label="Trải nghiệm 360 độ HULA B2B"
        >
            {/* TOP BAR: Navigation, Tabs & Close */}
            <header className="h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shrink-0">
                {/* Left: Product Name & Branding */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                        360°
                    </div>
                    <div>
                        <h2 className="text-white text-sm font-extrabold tracking-tight flex items-center gap-2">
                            <span>{subcategory.name}</span>
                            <span className="hidden sm:inline-block text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800">
                                Thiết Kế Riêng
                            </span>
                        </h2>
                        <p className="text-slate-400 text-xs hidden sm:block">
                            Phối cảnh 3D chân thật theo tiêu chuẩn may mặc trường mầm non HULA
                        </p>
                    </div>
                </div>

                {/* Center: 2 Experience Scenarios Tabs */}
                <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center gap-1 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setActiveTab('studio')}
                        className={`px-3 sm:px-5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === 'studio'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <span>🛋️</span>
                        <span>Studio Sản Phẩm 360°</span>
                        <span className="hidden md:inline text-[10px] opacity-75">(Kịch bản 1)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('classroom')}
                        className={`px-3 sm:px-5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === 'classroom'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <span>🏫</span>
                        <span>Lớp Học Mầm Non 360°</span>
                        <span className="hidden md:inline text-[10px] opacity-75">(Kịch bản 2)</span>
                    </button>
                </div>

                {/* Right: CTA & Close */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onProceedToLead();
                        }}
                        className="hidden md:flex px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-extrabold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 items-center gap-1.5"
                    >
                        <span>📋</span>
                        <span>Chốt Thiết Kế & Báo Giá</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 text-lg"
                        aria-label="Đóng trải nghiệm 360°"
                    >
                        ✕
                    </button>
                </div>
            </header>

            {/* MAIN VIEWPORT: Switchable Scenarios */}
            <main className="relative flex-1 w-full h-full overflow-hidden min-w-0 min-h-0">
                {activeTab === 'studio' ? (
                    <Product360Studio
                        subcategory={subcategory}
                        selectedOptions={selectedOptions}
                        selectedColorHex={selectedColorHex}
                        selectedColorName={selectedColorName}
                        logoUrl={logoUrl}
                        onProceedToLead={() => {
                            onClose();
                            onProceedToLead();
                        }}
                    />
                ) : (
                    <div className="w-full h-full relative">
                        <CampusSchoolPOV
                            onClose={onClose}
                            customDesign={customDesign}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
