import React from 'react';
import { WizardCategoryL2, WizardOption } from './types';

const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

// Guard: chỉ coi là có color_code khi giá trị thực sự hợp lệ (loại trừ #000000 do HTML color picker mặc định)
const hasValidColor = (opt?: WizardOption): boolean => {
    if (!opt?.color_code) return false;
    const c = opt.color_code.trim().toLowerCase();
    return c !== '' && c !== '#000000';
};

interface Props {
    subcategory: WizardCategoryL2;
    selectedOptions: WizardOption[];
    stepSelections?: Record<string, string>; // stepId -> optionId (chính xác, không bị trùng ID)
}

export default function ProductVisualizer({ subcategory, selectedOptions, stepSelections = {} }: Props) {
    const hasBaseImages = subcategory.base_images && subcategory.base_images.length > 0;
    const legacyBaseImage = subcategory.base_image;

    // Resolve selected option cho mỗi step CHÍNH XÁC bằng stepSelections map
    // Tránh bug: nhiều steps cùng có option id "1", "2"
    const resolveStepOption = (stepId: string): WizardOption | undefined => {
        const step = subcategory.customization_steps?.find(s => s.id === stepId);
        if (!step) return undefined;
        const selectedOptionId = stepSelections[stepId];
        if (!selectedOptionId) return undefined;
        return step.options?.find(o => o.id === selectedOptionId);
    };

    // Lấy tất cả resolved options cho 1 nhóm steps (dùng cho frame mapping)
    const resolveOptionsForSteps = (steps: typeof subcategory.customization_steps): WizardOption[] => {
        if (!steps) return [];
        return steps
            .map(step => resolveStepOption(step.id))
            .filter(Boolean) as WizardOption[];
    };

    // All resolved options (cho floating badges + legacy mode)
    const allResolvedOptions = resolveOptionsForSteps(subcategory.customization_steps || []);

    // Global lookups cho legacy mode + floating badge
    const globalImageSwap = allResolvedOptions.find(o => o.image_url);
    const globalColor = allResolvedOptions.find(o => hasValidColor(o));
    const globalTexture = allResolvedOptions.find(o => o.visualization_overlay);

    return (
        <div className="relative w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-4">
            {hasBaseImages ? (
                /* Multi-frame layered view */
                <div className="relative w-full h-full flex items-center justify-center">
                    {[...subcategory.base_images!].sort((a, b) => a.sort_order - b.sort_order).map((frame) => {
                        // Steps gắn frame cụ thể + steps KHÔNG gắn frame (global)
                        const mappedSteps = subcategory.customization_steps?.filter(s =>
                            s.required_frame_id === frame.id || !s.required_frame_id
                        ) || [];

                        // Resolve options CHÍNH XÁC bằng stepSelections
                        const mappedOptions = resolveOptionsForSteps(mappedSteps);

                        // Ưu tiên: image swap > overlay texture > color tint
                        const swapOption = mappedOptions.find(o => o.image_url);
                        const overlayOption = mappedOptions.find(o => o.visualization_overlay);
                        const tintOption = mappedOptions.find(o => hasValidColor(o));

                        // Hình hiển thị: nếu option có image_url thì thay thế ảnh gốc frame
                        const displayImageUrl = swapOption?.image_url
                            ? resolveImageUrl(swapOption.image_url)
                            : resolveImageUrl(frame.url);

                        return (
                            <div
                                key={frame.id}
                                className="absolute transition-transform duration-500"
                                style={{
                                    left: `${(frame.x / 600) * 100}%`,
                                    top: `${(frame.y / 600) * 100}%`,
                                    width: `${(frame.width / 600) * 100}%`,
                                    height: `${(frame.height / 600) * 100}%`,
                                    zIndex: frame.sort_order + 10,
                                    isolation: 'isolate',
                                }}
                            >
                                {/* Ảnh hiển thị: swap nếu option có image_url, fallback về frame gốc */}
                                <img 
                                    src={displayImageUrl} 
                                    alt={frame.label || subcategory.name}
                                    className="w-full h-full object-contain transition-all duration-500"
                                    key={displayImageUrl}
                                />

                                {/* Priority 1: Overlay image (texture/pattern) */}
                                {overlayOption && overlayOption.visualization_overlay && (
                                    <img 
                                        src={resolveImageUrl(overlayOption.visualization_overlay)}
                                        className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 animate-fade-in"
                                        alt="Texture overlay"
                                        style={{ zIndex: 2 }}
                                    />
                                )}

                                {/* Priority 2: Color tint (chỉ khi không có overlay image và không swap ảnh) */}
                                {!overlayOption && !swapOption && tintOption && hasValidColor(tintOption) && (
                                    <div 
                                        className="absolute inset-0 pointer-events-none transition-colors duration-500"
                                        style={{
                                            backgroundColor: tintOption.color_code,
                                            mixBlendMode: 'multiply',
                                            opacity: 0.6,
                                            zIndex: 2,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : legacyBaseImage ? (
                /* Legacy single base_image view */
                <div className="relative w-full h-full flex items-center justify-center" style={{ isolation: 'isolate' }}>
                    <img 
                        src={globalImageSwap?.image_url ? resolveImageUrl(globalImageSwap.image_url) : resolveImageUrl(legacyBaseImage)} 
                        alt={subcategory.name}
                        className="max-w-full max-h-full object-contain relative z-10 transition-all duration-500"
                        key={globalImageSwap?.image_url || legacyBaseImage}
                    />
                    
                    {/* Color Tinting Overlay */}
                    {!globalImageSwap && globalColor && hasValidColor(globalColor) && (
                        <div 
                            className="absolute inset-0 z-20 pointer-events-none transition-colors duration-500"
                            style={{
                                backgroundColor: globalColor.color_code,
                                mixBlendMode: 'multiply',
                                opacity: 0.6,
                            }}
                        />
                    )}

                    {/* Texture Overlay */}
                    {globalTexture && globalTexture.visualization_overlay && (
                        <img 
                            src={resolveImageUrl(globalTexture.visualization_overlay)}
                            className="absolute max-w-full max-h-full object-contain z-30 transition-opacity duration-500 animate-fade-in"
                            alt="Texture overlay"
                        />
                    )}
                </div>
            ) : (
                <div className="text-gray-300 text-center">
                    <span className="text-6xl block mb-4">🖼️</span>
                    <p>Chưa có hình ảnh mô phỏng</p>
                </div>
            )}

            {/* Floating Selection Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-2 z-40">
                {selectedOptions.filter(o => o.name && o.name.length <= 3).map(opt => (
                    <div key={opt.id} className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-primary font-bold border border-primary/20 animate-slide-in-right">
                        {opt.name}
                    </div>
                ))}
            </div>
            
            {globalColor && hasValidColor(globalColor) && (
                 <div className="absolute right-4 top-4 z-40">
                    <div 
                        className="w-10 h-10 rounded-full shadow-lg border-2 border-white animate-slide-in-right"
                        style={{ backgroundColor: globalColor.color_code }}
                    />
                 </div>
            )}

            {/* Frame labels (bottom) */}
            {hasBaseImages && (
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1 z-40">
                    {subcategory.base_images!.map(frame => (
                        <div key={frame.id} className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {frame.label || frame.id}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
