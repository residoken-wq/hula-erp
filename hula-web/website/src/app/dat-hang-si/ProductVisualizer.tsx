import React from 'react';
import { WizardCategoryL2, WizardOption } from './types';

interface Props {
    subcategory: WizardCategoryL2;
    selectedOptions: WizardOption[];
}

export default function ProductVisualizer({ subcategory, selectedOptions }: Props) {
    // Tìm các overlay cần hiển thị
    // Ưu tiên option có visualization_overlay (texture/hình ảnh)
    // Hoặc option có color_code (để làm mask tinting)
    
    // Tạm thời, mình sẽ lấy base_image, và phủ một lớp color overlay (mix-blend-mode: multiply) nếu có color_code
    
    const colorOption = selectedOptions.find(o => o.color_code);
    const textureOption = selectedOptions.find(o => o.visualization_overlay);

    return (
        <div className="relative w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-4">
            {/* Base Image */}
            {subcategory.base_image ? (
                <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                        src={subcategory.base_image} 
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
                                WebkitMaskImage: `url(${subcategory.base_image})`,
                                maskImage: `url(${subcategory.base_image})`,
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
                            src={textureOption.visualization_overlay}
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
        </div>
    );
}
