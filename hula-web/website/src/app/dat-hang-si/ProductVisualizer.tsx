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
}

export default function ProductVisualizer({ subcategory, selectedOptions }: Props) {
    // Support new base_images[] array with fallback to legacy base_image
    const hasBaseImages = subcategory.base_images && subcategory.base_images.length > 0;
    const legacyBaseImage = subcategory.base_image;

    // Global: tìm option có color/texture trong tất cả selectedOptions (dùng cho legacy mode + floating badge)
    const colorOption = selectedOptions?.find(o => hasValidColor(o));
    const textureOption = selectedOptions?.find(o => o.visualization_overlay);

    return (
        <div className="relative w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-4">
            {hasBaseImages ? (
                /* Multi-frame layered view */
                <div className="relative w-full h-full flex items-center justify-center">
                    {[...subcategory.base_images!].sort((a, b) => a.sort_order - b.sort_order).map((frame) => {
                        // FIX: Steps gắn frame cụ thể + steps KHÔNG gắn frame (global) đều áp dụng cho frame này
                        const mappedSteps = subcategory.customization_steps?.filter(s =>
                            s.required_frame_id === frame.id || !s.required_frame_id
                        ) || [];
                        const mappedOptions = mappedSteps
                            .map(step => selectedOptions.find(opt => step.options?.some(o => o.id === opt.id)))
                            .filter(Boolean) as WizardOption[];

                        // Ưu tiên: overlay image > color tint
                        const overlayOption = mappedOptions.find(o => o.visualization_overlay);
                        const tintOption = mappedOptions.find(o => hasValidColor(o));

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
                                    isolation: 'isolate', // Tạo stacking context riêng để mix-blend chỉ ảnh hưởng frame này
                                }}
                            >
                                {/* Ảnh gốc frame */}
                                <img 
                                    src={resolveImageUrl(frame.url)} 
                                    alt={frame.label || subcategory.name}
                                    className="w-full h-full object-contain"
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

                                {/* Priority 2: Color tint (chỉ khi không có overlay image) */}
                                {!overlayOption && tintOption && hasValidColor(tintOption) && (
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
                        src={resolveImageUrl(legacyBaseImage)} 
                        alt={subcategory.name}
                        className="max-w-full max-h-full object-contain relative z-10 transition-transform duration-500"
                    />
                    
                    {/* Color Tinting Overlay - dùng mix-blend-mode multiply (không cần mask-image) */}
                    {colorOption && hasValidColor(colorOption) && (
                        <div 
                            className="absolute inset-0 z-20 pointer-events-none transition-colors duration-500"
                            style={{
                                backgroundColor: colorOption.color_code,
                                mixBlendMode: 'multiply',
                                opacity: 0.6,
                            }}
                        />
                    )}

                    {/* Texture Overlay */}
                    {textureOption && textureOption.visualization_overlay && (
                        <img 
                            src={resolveImageUrl(textureOption.visualization_overlay)}
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
            
            {colorOption && hasValidColor(colorOption) && (
                 <div className="absolute right-4 top-4 z-40">
                    <div 
                        className="w-10 h-10 rounded-full shadow-lg border-2 border-white animate-slide-in-right"
                        style={{ backgroundColor: colorOption.color_code }}
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
