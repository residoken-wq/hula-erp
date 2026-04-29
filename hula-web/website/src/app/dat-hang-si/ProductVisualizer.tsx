import React, { useState } from 'react';
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

interface Props {
    subcategory: WizardCategoryL2;
    selectedOptions: WizardOption[];
}

export default function ProductVisualizer({ subcategory, selectedOptions }: Props) {
    // Tìm các overlay cần hiển thị
    // Ưu tiên option có visualization_overlay (texture/hình ảnh)
    // Hoặc option có color_code (để làm mask tinting)
    
    const colorOption = selectedOptions?.find(o => o.color_code);
    const textureOption = selectedOptions?.find(o => o.visualization_overlay);

    // Support new base_images[] array with fallback to legacy base_image
    const hasBaseImages = subcategory.base_images && subcategory.base_images.length > 0;
    const legacyBaseImage = subcategory.base_image;

    // For gallery view of base_images
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);

    return (
        <div className="relative w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-4">
            {hasBaseImages ? (
                /* Multi-frame layered view */
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Render all frames stacked by sort_order */}
                    {[...subcategory.base_images!].sort((a, b) => a.sort_order - b.sort_order).map((frame) => {
                        const mappedStep = subcategory.customization_steps?.find(s => s.required_frame_id === frame.id);
                        const mappedOption = mappedStep ? selectedOptions.find(opt => mappedStep.options?.some(o => o.id === opt.id)) : undefined;

                        return (
                            <React.Fragment key={frame.id}>
                                <div
                                    className="absolute transition-transform duration-500"
                                    style={{
                                        left: `${(frame.x / 600) * 100}%`,
                                        top: `${(frame.y / 600) * 100}%`,
                                        width: `${(frame.width / 600) * 100}%`,
                                        height: `${(frame.height / 600) * 100}%`,
                                        zIndex: frame.sort_order + 10,
                                    }}
                                >
                                    <img 
                                        src={resolveImageUrl(frame.url)} 
                                        alt={frame.label || subcategory.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Mapped Overlay: Priority 1 is Image, Priority 2 is Color Tint */}
                                {mappedOption && mappedOption.visualization_overlay ? (
                                    <div 
                                        className="absolute transition-opacity duration-500 animate-fade-in"
                                        style={{
                                            left: `${(frame.x / 600) * 100}%`,
                                            top: `${(frame.y / 600) * 100}%`,
                                            width: `${(frame.width / 600) * 100}%`,
                                            height: `${(frame.height / 600) * 100}%`,
                                            zIndex: frame.sort_order + 20,
                                        }}
                                    >
                                        <img 
                                            src={resolveImageUrl(mappedOption.visualization_overlay)}
                                            className="w-full h-full object-contain"
                                            alt="Texture overlay"
                                        />
                                    </div>
                                ) : mappedOption && mappedOption.color_code ? (
                                    <div 
                                        className="absolute pointer-events-none transition-colors duration-500"
                                        style={{
                                            left: `${(frame.x / 600) * 100}%`,
                                            top: `${(frame.y / 600) * 100}%`,
                                            width: `${(frame.width / 600) * 100}%`,
                                            height: `${(frame.height / 600) * 100}%`,
                                            zIndex: frame.sort_order + 20,
                                            backgroundColor: mappedOption.color_code,
                                            mixBlendMode: 'multiply',
                                            WebkitMaskImage: `url(${resolveImageUrl(frame.url)})`,
                                            maskImage: `url(${resolveImageUrl(frame.url)})`,
                                            maskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                            opacity: 0.8
                                        }}
                                    />
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </div>
            ) : legacyBaseImage ? (
                /* Legacy single base_image view */
                <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                        src={resolveImageUrl(legacyBaseImage)} 
                        alt={subcategory.name}
                        className="max-w-full max-h-full object-contain relative z-10 transition-transform duration-500"
                    />
                    
                    {/* Color Tinting Overlay using CSS Mix-Blend-Mode */}
                    {colorOption && colorOption.color_code && (
                        <div 
                            className="absolute inset-0 z-20 pointer-events-none transition-colors duration-500"
                            style={{
                                backgroundColor: colorOption.color_code,
                                mixBlendMode: 'multiply',
                                WebkitMaskImage: `url(${resolveImageUrl(legacyBaseImage)})`,
                                maskImage: `url(${resolveImageUrl(legacyBaseImage)})`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                opacity: 0.8
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
            
            {colorOption && colorOption.color_code && (
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
