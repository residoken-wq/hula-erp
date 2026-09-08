/**
 * HULA 360 Product Showroom - Detail Drawer Modal
 * Displays authentic sale kit specifications and genuine catalogue images:
 * - Exact dimensions: Nệm 120x63cm, Gối 40x25cm, Chăn 130x70cm, Túi Size S (48x40cm)
 * - Real catalogue scans: catalogue_01.jpg & catalogue_03.jpg
 * - Care instructions & material properties
 */

import React, { useEffect } from 'react';
import { SHOWROOM_PRODUCT } from './data/showroomConfig';

interface ProductDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProductDetailDrawer({ isOpen, onClose }: ProductDetailDrawerProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn select-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
        >
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl border border-[#DDE5E1] shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-[#DDE5E1] flex items-center justify-between shrink-0 bg-[#F7F8F5]">
                    <div>
                        <span className="text-[11px] font-semibold text-[#087F8C] uppercase tracking-wider">
                            Thông số Sale Kit HULA
                        </span>
                        <h3 id="detail-title" className="text-lg sm:text-xl font-bold text-[#183B3A]">
                            Bộ Nệm Ngủ Cotton Cara (REF-MAT-CARA-STD)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#DDE5E1] text-[#183B3A] text-xl font-light flex items-center justify-center transition-all shadow-xs"
                        aria-label="Đóng bảng thông số"
                    >
                        ×
                    </button>
                </div>

                {/* Content Body (Scrollable) */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#183B3A]">
                    {/* Key Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-[#F7F8F5] border border-[#DDE5E1] text-center">
                            <span className="text-[11px] text-[#566967] block">Nệm chần gòn</span>
                            <strong className="text-sm sm:text-base font-semibold text-[#087F8C]">
                                {SHOWROOM_PRODUCT.dimensions.mattress}
                            </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F7F8F5] border border-[#DDE5E1] text-center">
                            <span className="text-[11px] text-[#566967] block">Gối nằm</span>
                            <strong className="text-sm sm:text-base font-semibold text-[#087F8C]">
                                {SHOWROOM_PRODUCT.dimensions.pillow}
                            </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F7F8F5] border border-[#DDE5E1] text-center">
                            <span className="text-[11px] text-[#566967] block">Chăn đắp</span>
                            <strong className="text-sm sm:text-base font-semibold text-[#087F8C]">
                                {SHOWROOM_PRODUCT.dimensions.blanket}
                            </strong>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F7F8F5] border border-[#DDE5E1] text-center">
                            <span className="text-[11px] text-[#566967] block">Túi bảo quản</span>
                            <strong className="text-sm sm:text-base font-semibold text-[#087F8C]">
                                {SHOWROOM_PRODUCT.dimensions.bag}
                            </strong>
                        </div>
                    </div>

                    {/* Features Alert */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0FAF9] border border-[#087F8C]/30 text-xs sm:text-sm space-y-1.5 text-[#183B3A]">
                        <div className="font-semibold text-[#087F8C] flex items-center gap-1.5">
                            <span>✦</span>
                            <span>Đặc điểm thiết kế mầm non tiêu chuẩn:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[#566967] pl-1">
                            {SHOWROOM_PRODUCT.features.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Full Specs Table */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-[#566967] mb-2.5">
                            Quy cách chi tiết sản phẩm
                        </h4>
                        <div className="border border-[#DDE5E1] rounded-xl overflow-hidden divide-y divide-[#DDE5E1] text-xs sm:text-sm">
                            {SHOWROOM_PRODUCT.specs.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex py-2 px-3 sm:px-4 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-[#F7F8F5]/60'
                                    }`}
                                >
                                    <span className="w-1/3 text-[#566967] shrink-0">{item.label}</span>
                                    <span className="w-2/3 font-medium text-[#183B3A]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Catalogue Evidence Images */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-[#566967] mb-2.5">
                            Hình ảnh catalogue đối chiếu thực tế
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {SHOWROOM_PRODUCT.catalogueImages.map((img, i) => (
                                <div key={i} className="rounded-xl border border-[#DDE5E1] overflow-hidden bg-[#F7F8F5]">
                                    <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img.url}
                                            alt={img.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-2.5 bg-white border-t border-[#DDE5E1]">
                                        <div className="text-xs font-semibold text-[#183B3A]">{img.title}</div>
                                        <div className="text-[11px] text-[#566967]">{img.caption}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#DDE5E1] flex justify-end shrink-0 bg-[#F7F8F5]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-[#087F8C] hover:bg-[#066B76] text-white text-sm font-semibold transition-all shadow-xs"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}
