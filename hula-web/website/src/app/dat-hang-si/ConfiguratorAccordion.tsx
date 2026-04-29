import React, { useState } from 'react';
import { WizardCustomizationStep, WizardOption } from './types';

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

interface Props {
    steps: WizardCustomizationStep[];
    selections: Record<string, string>;
    onChange: (stepId: string, optionId: string) => void;
    skippedSteps?: Record<string, boolean>;
    onSkip?: (stepId: string) => void;
}

export default function ConfiguratorAccordion({ steps, selections, onChange, skippedSteps = {}, onSkip }: Props) {
    const [openStep, setOpenStep] = useState<string>(steps[0]?.id || '');

    const handleSelect = (stepId: string, optionId: string) => {
        onChange(stepId, optionId);
        // Tự động chuyển step tiếp theo
        const currentIndex = steps.findIndex(s => s.id === stepId);
        if (currentIndex < steps.length - 1) {
            setOpenStep(steps[currentIndex + 1].id);
        }
    };

    const handleSkip = (stepId: string) => {
        onSkip?.(stepId);
        const currentIndex = steps.findIndex(s => s.id === stepId);
        if (currentIndex < steps.length - 1) {
            setOpenStep(steps[currentIndex + 1].id);
        }
    };

    const renderOptionUI = (step: WizardCustomizationStep) => {
        const selectedId = selections[step.id];
        const isSkipped = skippedSteps[step.id];

        if (isSkipped) {
            return (
                <div className="text-center py-4">
                    <p className="text-gray-400 text-sm mb-2">Bước này đã được bỏ qua</p>
                    <button
                        onClick={() => onSkip?.(step.id)}
                        className="text-primary text-sm underline hover:no-underline"
                    >
                        Chọn lại
                    </button>
                </div>
            );
        }

        if (step.type === 'toggle') {
            return (
                <div className="flex flex-wrap gap-2">
                    {(step.options || []).map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleSelect(step.id, opt.id)}
                            className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                                selectedId === opt.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            {opt.name} {opt.price_modifier > 0 && <span className="text-xs text-gray-400 block">+{(opt.price_modifier / 1000)}k</span>}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.type === 'color_swatch') {
            return (
                <div className="flex flex-wrap gap-3">
                    {(step.options || []).map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleSelect(step.id, opt.id)}
                            title={opt.name}
                            className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center p-1 ${
                                selectedId === opt.id
                                    ? 'border-primary scale-110 shadow-md'
                                    : 'border-transparent hover:scale-105'
                            }`}
                            style={{ 
                                backgroundColor: opt.color_code || '#ddd',
                                backgroundImage: opt.image_url ? `url(${resolveImageUrl(opt.image_url)})` : 'none',
                                backgroundSize: 'cover'
                            }}
                        >
                            {selectedId === opt.id && (
                                <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold drop-shadow-md">
                                    ✓
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            );
        }

        if (step.type === 'branding') {
            return (
                <div className="flex flex-col gap-2">
                    {(step.options || []).map(opt => (
                        <label
                            key={opt.id}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                selectedId === opt.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelect(step.id, opt.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedId === opt.id ? 'border-primary' : 'border-gray-300'
                                }`}>
                                    {selectedId === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    {opt.image_url && (
                                        <img src={resolveImageUrl(opt.image_url)} alt={opt.name} className="w-8 h-8 object-contain rounded" />
                                    )}
                                    <div>
                                        <span className="font-medium text-gray-800 block">{opt.name}</span>
                                        {opt.description && <span className="text-xs text-gray-500 block">{opt.description}</span>}
                                    </div>
                                </div>
                            </div>
                            {opt.price_modifier > 0 && (
                                <span className="text-sm font-semibold text-primary">
                                    +{opt.price_modifier.toLocaleString('vi-VN')}đ
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            );
        }

        // Default: dropdown
        return (
            <div className="flex flex-col gap-2">
                {(step.options || []).map(opt => (
                    <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedId === opt.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelect(step.id, opt.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedId === opt.id ? 'border-primary' : 'border-gray-300'
                            }`}>
                                {selectedId === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <div>
                                <span className="font-medium text-gray-800 block">{opt.name}</span>
                                {opt.description && <span className="text-xs text-gray-500 block">{opt.description}</span>}
                            </div>
                        </div>
                        {opt.price_modifier > 0 && (
                            <span className="text-sm font-semibold text-primary">
                                +{opt.price_modifier.toLocaleString('vi-VN')}đ
                            </span>
                        )}
                    </label>
                ))}
            </div>
        );
    };

    return (
        <div className="border border-primary/20 rounded-xl overflow-hidden bg-white shadow-sm">
            {steps.map((step, index) => {
                const isOpen = openStep === step.id;
                const selectedOption = step.options?.find(o => o.id === selections[step.id]);
                const isSkipped = skippedSteps[step.id];

                return (
                    <div key={step.id} className="border-b border-gray-100 last:border-b-0">
                        <button
                            onClick={() => setOpenStep(isOpen ? '' : step.id)}
                            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                                isOpen ? 'bg-primary/5' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isSkipped ? 'bg-gray-200 text-gray-400' :
                                    isOpen ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {isSkipped ? '—' : `B${index + 1}`}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${isSkipped ? 'text-gray-400 line-through' : isOpen ? 'text-primary' : 'text-gray-800'}`}>
                                        {step.label}
                                        {step.is_skippable && <span className="text-xs text-gray-400 font-normal ml-2">(tùy chọn)</span>}
                                    </h3>
                                    {!isOpen && !isSkipped && selectedOption && (
                                        <p className="text-sm text-gray-500 mt-0.5">{selectedOption.name}</p>
                                    )}
                                    {!isOpen && isSkipped && (
                                        <p className="text-sm text-gray-400 mt-0.5 italic">Đã bỏ qua</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-gray-400">
                                {isOpen ? '▲' : '▼'}
                            </div>
                        </button>
                        
                        {isOpen && (
                            <div className="p-4 pt-2 bg-white animate-fade-in">
                                {renderOptionUI(step)}
                                {step.is_skippable && !isSkipped && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                                        <button
                                            onClick={() => handleSkip(step.id)}
                                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            ↓ Bỏ qua bước này
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
