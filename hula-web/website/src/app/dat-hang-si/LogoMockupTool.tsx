'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';

interface Props {
    visualizerRef: React.RefObject<HTMLDivElement>;
}

export default function LogoMockupTool({ visualizerRef }: Props) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [processedLogoUrl, setProcessedLogoUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [blendMode, setBlendMode] = useState<'normal' | 'multiply' | 'overlay'>('multiply');
    const [opacity, setOpacity] = useState(0.85);
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview raw logo
        const objectUrl = URL.createObjectURL(file);
        setLogoUrl(objectUrl);
        setProcessedLogoUrl(null);
        setIsProcessing(true);
        setIsOpen(true);

        try {
            // Dynamically import to avoid Webpack/SSR issues with WebAssembly and Node modules
            const imgly = await import('@imgly/background-removal');
            const removeBg: any = (imgly as any).default || (imgly as any).removeBackground || (imgly as any);
            
            const config = {
                // Let the library automatically use its default unpkg.com CDN path which guarantees version match
            };

            // Run background removal
            const imageBlob = await removeBg(file, config);
            const processedUrl = URL.createObjectURL(imageBlob);
            setProcessedLogoUrl(processedUrl);
        } catch (error) {
            console.error("Error removing background:", error);
            alert("Lỗi khi xóa phông nền. Sẽ sử dụng ảnh gốc.");
            setProcessedLogoUrl(objectUrl);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExport = async () => {
        if (!visualizerRef.current) return;
        setIsExporting(true);
        try {
            // Temporarily hide UI controls if any were rendered inside visualizer
            const canvas = await html2canvas(visualizerRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2, // High resolution
            });
            
            const link = document.createElement('a');
            link.download = `mockup-logo-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Không thể xuất ảnh, vui lòng thử lại.');
        } finally {
            setIsExporting(false);
        }
    };

    // Render the draggable logo inside a Portal or directly inside the Visualizer if it's placed inside it.
    // Assuming this component is mounted INSIDE the Visualizer's relative container.
    return (
        <>
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 items-end">
                <label className="bg-white/90 backdrop-blur border border-blue-200 shadow-sm text-blue-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50 transition text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    {isProcessing ? 'Đang xử lý...' : 'Demo Logo (Nội bộ)'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>

                {isOpen && (processedLogoUrl || logoUrl) && (
                    <div className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-100 w-48 text-sm animate-fade-in flex flex-col gap-3">
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Chế độ hòa trộn</label>
                            <select 
                                value={blendMode}
                                onChange={(e) => setBlendMode(e.target.value as any)}
                                className="w-full border rounded px-2 py-1 text-sm bg-gray-50 outline-none"
                            >
                                <option value="normal">Bình thường (Normal)</option>
                                <option value="multiply">In lên vải (Multiply)</option>
                                <option value="overlay">Phủ màu (Overlay)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 flex justify-between">
                                <span>Độ đậm nhạt</span>
                                <span>{Math.round(opacity * 100)}%</span>
                            </label>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05" 
                                value={opacity} 
                                onChange={(e) => setOpacity(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button 
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full bg-primary text-white py-1.5 rounded text-sm font-medium hover:bg-primary/90 flex justify-center items-center gap-1 mt-1"
                        >
                            {isExporting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Tải ảnh Demo
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* The Draggable Logo Layer */}
            {(processedLogoUrl || logoUrl) && (
                <Rnd
                    default={{
                        x: 100,
                        y: 100,
                        width: 150,
                        height: 150,
                    }}
                    minWidth={50}
                    minHeight={50}
                    bounds="parent"
                    className="z-50 border border-transparent hover:border-blue-400 hover:border-dashed group"
                >
                    <div className="w-full h-full relative">
                        {/* Drag handle overlay to catch pointer events easily */}
                        <div className="absolute inset-0 z-10 cursor-move"></div>
                        
                        <img 
                            src={processedLogoUrl || logoUrl!} 
                            alt="Demo Logo"
                            className="w-full h-full object-contain pointer-events-none"
                            style={{
                                mixBlendMode: blendMode,
                                opacity: opacity,
                                filter: isProcessing ? 'blur(4px) grayscale(100%)' : 'none',
                                transition: 'filter 0.3s'
                            }}
                        />

                        {/* Processing Indicator */}
                        {isProcessing && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 rounded">
                                <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                            </div>
                        )}
                        
                        {/* Delete button (only visible on hover) */}
                        <button 
                            onClick={() => { setLogoUrl(null); setProcessedLogoUrl(null); setIsOpen(false); }}
                            className="absolute -top-3 -right-3 z-30 bg-red-500 text-white w-6 h-6 rounded-full hidden group-hover:flex items-center justify-center text-xs shadow-md"
                        >
                            ×
                        </button>
                    </div>
                </Rnd>
            )}
        </>
    );
}
