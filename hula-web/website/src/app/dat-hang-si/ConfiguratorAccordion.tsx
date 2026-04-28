import React, { useState } from 'react';
import { WizardCustomizationStep, WizardOption } from './types';

interface Props {
    steps: WizardCustomizationStep[];
    selections: Record<string, string>;
    onChange: (stepId: string, optionId: string) => void;
}

export default function ConfiguratorAccordion({ steps, selections, onChange }: Props) {
    const [openStep, setOpenStep] = useState<string>(steps[0]?.id || '');

    const renderOptionUI = (step: WizardCustomizationStep) => {
        const selectedId = selections[step.id];

        if (step.type === 'toggle') {
            return (
                <div className="flex flex-wrap gap-2">
                    {(step.options || []).map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => {
                                onChange(step.id, opt.id);
                                // Tự động chuyển step tiếp theo
                                const currentIndex = steps.findIndex(s => s.id === step.id);
                                if (currentIndex < steps.length - 1) {
                                    setOpenStep(steps[currentIndex + 1].id);
                                }
                            }}
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
                            onClick={() => {
                                onChange(step.id, opt.id);
                                const currentIndex = steps.findIndex(s => s.id === step.id);
                                if (currentIndex < steps.length - 1) {
                                    setOpenStep(steps[currentIndex + 1].id);
                                }
                            }}
                            title={opt.name}
                            className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center p-1 ${
                                selectedId === opt.id
                                    ? 'border-primary scale-110 shadow-md'
                                    : 'border-transparent hover:scale-105'
                            }`}
                            style={{ 
                                backgroundColor: opt.color_code || '#ddd',
                                backgroundImage: opt.image_url ? `url(${opt.image_url})` : 'none',
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
                        onClick={() => {
                            onChange(step.id, opt.id);
                            const currentIndex = steps.findIndex(s => s.id === step.id);
                            if (currentIndex < steps.length - 1) {
                                setOpenStep(steps[currentIndex + 1].id);
                            }
                        }}
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
                                    isOpen ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    B{index + 1}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${isOpen ? 'text-primary' : 'text-gray-800'}`}>
                                        {step.label}
                                    </h3>
                                    {!isOpen && selectedOption && (
                                        <p className="text-sm text-gray-500 mt-0.5">{selectedOption.name}</p>
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
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
