import React from 'react';
import { WizardCategoryL2, WizardCustomizationStep } from './types';

interface Props {
    subcategory: WizardCategoryL2;
    steps: WizardCustomizationStep[];
    selections: Record<string, string>;
    onShowModal: () => void;
    onShow360?: () => void;
}

export default function DynamicPriceBar({ subcategory, steps, selections, onShowModal, onShow360 }: Props) {

    // Calculate total modifier from selections
    let totalModifier = 0;
    for (const step of (steps || [])) {
        if (!step) continue;
        const optionId = selections[step.id];
        const option = (step.options || []).find(o => o && o.id === optionId);
        if (option) {
            totalModifier += option.price_modifier;
        }
    }

    // Get min and max price based on tiers
    const tiers = subcategory.price_tiers;
    let minPrice = 0;
    let maxPrice = 0;

    if (tiers && tiers.length > 0) {
        const prices = tiers.map(t => t.base_price + totalModifier);
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
    } else {
        // Fallback if no tiers
        minPrice = totalModifier;
        maxPrice = totalModifier;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-primary/20 overflow-hidden sticky bottom-4 md:static z-50">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="text-center md:text-left md:flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Giá dự kiến</p>
                        <div className="text-2xl font-bold text-primary">
                            {minPrice > 0 ? (
                                minPrice === maxPrice
                                    ? `${minPrice.toLocaleString('vi-VN')}đ`
                                    : `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`
                            ) : (
                                "Đang cập nhật"
                            )}
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col items-center sm:items-end">
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            {onShow360 && (
                                <button
                                    type="button"
                                    onClick={onShow360}
                                    className="w-full sm:w-auto px-5 py-3 rounded-full font-extrabold text-sm border-2 border-cyan-500 text-cyan-800 bg-cyan-50 hover:bg-cyan-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <span>✨</span>
                                    <span>Xem 3D 360°</span>
                                </button>
                            )}
                            <button
                                onClick={onShowModal}
                                className="w-full sm:w-auto px-8 py-3 bg-primary-500 text-white rounded-full font-bold shadow-md hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                            >
                                NHẬN BÁO GIÁ SỈ CHI TIẾT
                            </button>
                        </div>
                        <span className="text-xs text-gray-500 mt-2 block">
                            Click để nhập số lượng & nhận báo giá chính xác
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
