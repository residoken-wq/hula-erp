/**
 * CampusRealPhotosModal.tsx
 * Real Product Photo Lightbox Modal for HULA School POV (Instruction 09):
 * - Displays authentic photographs from catalogue (NEM_MN_-_03.jpg) and school projects (Sright & KIS)
 * - 100% original photos, zero AI hallucination
 * - Synchronized colorway switching for the 6 standard Cotton Cara colors
 * - Project gallery showing real preschool classroom setups
 * - Accessible, responsive, non-destructive to 3D canvas state
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CARA_COLORS } from '../engine/CampusWorldState';

interface CampusRealPhotosModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeColorId: string;
    onSelectColor: (colorId: string) => void;
    initialTab?: 'catalogue' | 'projects';
}

const SRIGHT_PHOTOS = [
    { id: 'sright-01', url: '/images/tour360/real-photos/projects/sright/sright-01.jpg', title: 'Trường Mầm Non Sright · Giờ ngủ trưa' },
    { id: 'sright-02', url: '/images/tour360/real-photos/projects/sright/sright-02.jpg', title: 'Trường Mầm Non Sright · Bố trí nệm trong lớp' },
    { id: 'sright-03', url: '/images/tour360/real-photos/projects/sright/sright-03.jpg', title: 'Trường Mầm Non Sright · Chi tiết gối và chăn' },
    { id: 'sright-04', url: '/images/tour360/real-photos/projects/sright/sright-04.jpg', title: 'Trường Mầm Non Sright · Đồng bộ màu sắc' },
    { id: 'sright-05', url: '/images/tour360/real-photos/projects/sright/sright-05.jpg', title: 'Trường Mầm Non Sright · Gấp gọn sau giờ ngủ' },
    { id: 'sright-06', url: '/images/tour360/real-photos/projects/sright/sright-06.jpg', title: 'Trường Mầm Non Sright · Kệ nệm lớp học' },
    { id: 'sright-07', url: '/images/tour360/real-photos/projects/sright/sright-07.jpg', title: 'Trường Mầm Non Sright · Góc sinh hoạt' },
    { id: 'sright-08', url: '/images/tour360/real-photos/projects/sright/sright-08.jpg', title: 'Trường Mầm Non Sright · Chất liệu vải mềm' },
    { id: 'sright-09', url: '/images/tour360/real-photos/projects/sright/sright-09.jpg', title: 'Trường Mầm Non Sright · Viền may chắc chắn' },
    { id: 'sright-10', url: '/images/tour360/real-photos/projects/sright/sright-10.jpg', title: 'Trường Mầm Non Sright · Kiểm tra xuất xưởng' },
    { id: 'sright-11', url: '/images/tour360/real-photos/projects/sright/sright-11.jpg', title: 'Trường Mầm Non Sright · Bàn giao lớp học' },
    { id: 'sright-12', url: '/images/tour360/real-photos/projects/sright/sright-12.jpg', title: 'Trường Mầm Non Sright · Cận cảnh tem nhãn' },
    { id: 'sright-13', url: '/images/tour360/real-photos/projects/sright/sright-13.jpg', title: 'Trường Mầm Non Sright · Xếp gọn ngăn nắp' },
    { id: 'sright-14', url: '/images/tour360/real-photos/projects/sright/sright-14.jpg', title: 'Trường Mầm Non Sright · Lớp học sáng thoáng' },
    { id: 'sright-15', url: '/images/tour360/real-photos/projects/sright/sright-15.jpg', title: 'Trường Mầm Non Sright · Toàn cảnh không gian' },
];

const KIS_PHOTOS = [
    { id: 'kis-01', url: '/images/tour360/real-photos/projects/kis/kis-01.jpg', title: 'Trường Song Ngữ KIS Academy · Giờ nghỉ trưa' },
    { id: 'kis-02', url: '/images/tour360/real-photos/projects/kis/kis-02.jpg', title: 'Trường Song Ngữ KIS Academy · Dãy nệm trải đều' },
    { id: 'kis-03', url: '/images/tour360/real-photos/projects/kis/kis-03.jpg', title: 'Trường Song Ngữ KIS Academy · Chi tiết góc nghiêng' },
    { id: 'kis-04', url: '/images/tour360/real-photos/projects/kis/kis-04.jpg', title: 'Trường Song Ngữ KIS Academy · Nếp chăn và gối' },
    { id: 'kis-05', url: '/images/tour360/real-photos/projects/kis/kis-05.jpg', title: 'Trường Song Ngữ KIS Academy · Thêu logo trường' },
    { id: 'kis-06', url: '/images/tour360/real-photos/projects/kis/kis-06.jpg', title: 'Trường Song Ngữ KIS Academy · Không gian sàn gỗ' },
    { id: 'kis-07', url: '/images/tour360/real-photos/projects/kis/kis-07.jpg', title: 'Trường Song Ngữ KIS Academy · Gấp nệm sau giờ ngủ' },
    { id: 'kis-08', url: '/images/tour360/real-photos/projects/kis/kis-08.jpg', title: 'Trường Song Ngữ KIS Academy · Cất kệ ngăn nắp' },
    { id: 'kis-09', url: '/images/tour360/real-photos/projects/kis/kis-09.jpg', title: 'Trường Song Ngữ KIS Academy · Túi đựng cá nhân' },
    { id: 'kis-10', url: '/images/tour360/real-photos/projects/kis/kis-10.jpg', title: 'Trường Song Ngữ KIS Academy · Bàn giao cuối tuần' },
    { id: 'kis-11', url: '/images/tour360/real-photos/projects/kis/kis-11.jpg', title: 'Trường Song Ngữ KIS Academy · Góc lớp thân thiện' },
];

export function CampusRealPhotosModal({
    isOpen,
    onClose,
    activeColorId,
    onSelectColor,
    initialTab = 'catalogue',
}: CampusRealPhotosModalProps) {
    const [currentTab, setCurrentTab] = useState<'catalogue' | 'projects'>(initialTab);
    const [projectFilter, setProjectFilter] = useState<'all' | 'sright' | 'kis'>('all');
    const [selectedProjectPhoto, setSelectedProjectPhoto] = useState<{ url: string; title: string } | null>(null);
    const [isFullCatalogueOpen, setIsFullCatalogueOpen] = useState(false);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setCurrentTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Keyboard ESC listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedProjectPhoto) {
                    setSelectedProjectPhoto(null);
                } else if (isFullCatalogueOpen) {
                    setIsFullCatalogueOpen(false);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, selectedProjectPhoto, isFullCatalogueOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const activeColor = CARA_COLORS.find(c => c.id === activeColorId) || CARA_COLORS[0];
    const projectPhotos = projectFilter === 'sright' ? SRIGHT_PHOTOS : projectFilter === 'kis' ? KIS_PHOTOS : [...SRIGHT_PHOTOS, ...KIS_PHOTOS];

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
            role="dialog"
            aria-modal="true"
            aria-label="Thư viện ảnh sản phẩm thật HULA"
        >
            <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] max-h-[850px] shadow-2xl border border-[#DDE5E1] flex flex-col overflow-hidden">
                {/* 1. Header with Tabs */}
                <div className="px-5 py-4 border-b border-[#DDE5E1] flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#087F8C]/10 text-[#087F8C] flex items-center justify-center text-lg font-bold">
                            📸
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-[#183B3A]">
                                Thư Viện Ảnh Thật · Cotton Cara
                            </h3>
                            <p className="text-xs text-[#566967]">
                                Ảnh chụp sản phẩm nguyên bản từ catalogue HULA & dự án thực tế
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#F6F8F5] text-[#566967] hover:text-[#183B3A] transition-all"
                        aria-label="Đóng thư viện ảnh"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 2. Navigation Tabs */}
                <div className="px-5 pt-3 pb-2 border-b border-[#DDE5E1] bg-[#F6F8F5] flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentTab('catalogue')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                currentTab === 'catalogue'
                                    ? 'bg-[#183B3A] text-white shadow-xs'
                                    : 'bg-white text-[#566967] hover:text-[#183B3A] border border-[#DDE5E1]'
                            }`}
                        >
                            <span>🏷️</span>
                            <span>Ảnh Catalogue 6 Màu</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentTab('projects')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                currentTab === 'projects'
                                    ? 'bg-[#183B3A] text-white shadow-xs'
                                    : 'bg-white text-[#566967] hover:text-[#183B3A] border border-[#DDE5E1]'
                            }`}
                        >
                            <span>🏫</span>
                            <span>Ảnh Dự Án Thực Tế (26 Ảnh)</span>
                        </button>
                    </div>

                    {currentTab === 'catalogue' && (
                        <button
                            type="button"
                            onClick={() => setIsFullCatalogueOpen(true)}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#087F8C] bg-white border border-[#B7D9CC] hover:bg-[#EAF4F2] transition-colors"
                        >
                            <span>📄 Xem Toàn Trang Catalogue (NEM_MN_-_03)</span>
                        </button>
                    )}
                </div>

                {/* 3. Tab Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-[#FBFDFB]">
                    {currentTab === 'catalogue' ? (
                        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center h-full">
                            {/* Left: Large Photo Preview */}
                            <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full">
                                <div className="relative rounded-2xl overflow-hidden border border-[#DDE5E1] bg-white shadow-lg p-2 max-h-[480px] flex items-center justify-center w-full">
                                    <img
                                        src={`/images/tour360/real-photos/catalogue/cara_${activeColor.id}.jpg`}
                                        alt={`Ảnh chụp thật bộ nệm Cotton Cara màu ${activeColor.label}`}
                                        className="max-h-[440px] w-auto object-contain rounded-xl"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/tour360/real-photos/catalogue/cara_blue.jpg';
                                        }}
                                    />
                                    <div className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-[#183B3A]/90 backdrop-blur-md text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor.previewHex }} />
                                        <span>Cotton Cara · {activeColor.label}</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-[#566967] text-center mt-2.5 max-w-md">
                                    Nguồn ảnh: <span className="font-semibold text-[#183B3A]">Catalogue HULA NEM_MN_-_03.jpg</span>.
                                    Chữ <span className="font-semibold text-[#183B3A]">"YOUR LOGO HERE"</span> là minh họa khả năng thêu/in logo trường học tùy biến của xưởng HULA, không phải logo mặc định.
                                </p>
                            </div>

                            {/* Right: Color Switcher & Specs */}
                            <div className="w-full lg:w-80 flex flex-col gap-4">
                                <div className="p-4 rounded-2xl bg-white border border-[#DDE5E1] shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-[#183B3A] uppercase tracking-wide">
                                            Chọn màu đối chiếu ảnh thật
                                        </span>
                                        <span className="text-xs font-semibold text-[#087F8C]">
                                            {activeColor.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {CARA_COLORS.map(c => {
                                            const isActive = c.id === activeColor.id;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => onSelectColor(c.id)}
                                                    className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                                        isActive
                                                            ? 'bg-[#EAF4F2] border-[#087F8C] ring-2 ring-[#087F8C]/20 shadow-xs'
                                                            : 'bg-white border-[#DDE5E1] hover:border-[#B7D9CC]'
                                                    }`}
                                                >
                                                    <div
                                                        className="w-7 h-7 rounded-full border border-black/10 shadow-xs flex items-center justify-center shrink-0"
                                                        style={{ backgroundColor: c.previewHex }}
                                                    >
                                                        {isActive && (
                                                            <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#183B3A] text-center leading-tight">
                                                        {c.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Spec Highlights */}
                                <div className="p-4 rounded-2xl bg-white border border-[#DDE5E1] shadow-xs space-y-2 text-xs text-[#566967]">
                                    <span className="font-bold text-[#183B3A] block">
                                        Quy Cách Bộ Nệm Cotton Cara Tiêu Chuẩn:
                                    </span>
                                    <ul className="space-y-1 pl-4 list-disc text-[11px]">
                                        <li><strong className="text-[#183B3A]">Kích thước nệm:</strong> 120 x 63 cm (dày 2.5 cm)</li>
                                        <li><strong className="text-[#183B3A]">Gối kèm theo:</strong> 40 x 25 cm, ruột bông gòn êm ái</li>
                                        <li><strong className="text-[#183B3A]">Chăn đắp:</strong> 130 x 70 cm, cổ chăn gập mép lót mềm</li>
                                        <li><strong className="text-[#183B3A]">Viền nẹp:</strong> Viền may piping xám định hình chu vi</li>
                                        <li><strong className="text-[#183B3A]">Chất vải:</strong> Cotton Cara thoáng mát, kháng khuẩn</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Project Filter Sub-bar */}
                            <div className="flex items-center justify-between pb-2 border-b border-[#DDE5E1]">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setProjectFilter('all')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            projectFilter === 'all'
                                                ? 'bg-[#087F8C] text-white shadow-xs'
                                                : 'bg-white text-[#566967] hover:text-[#183B3A] border border-[#DDE5E1]'
                                        }`}
                                    >
                                        Tất cả ({SRIGHT_PHOTOS.length + KIS_PHOTOS.length} ảnh)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProjectFilter('sright')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            projectFilter === 'sright'
                                                ? 'bg-[#087F8C] text-white shadow-xs'
                                                : 'bg-white text-[#566967] hover:text-[#183B3A] border border-[#DDE5E1]'
                                        }`}
                                    >
                                        Trường Sright ({SRIGHT_PHOTOS.length} ảnh)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProjectFilter('kis')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            projectFilter === 'kis'
                                                ? 'bg-[#087F8C] text-white shadow-xs'
                                                : 'bg-white text-[#566967] hover:text-[#183B3A] border border-[#DDE5E1]'
                                        }`}
                                    >
                                        Trường KIS Academy ({KIS_PHOTOS.length} ảnh)
                                    </button>
                                </div>
                                <span className="text-[11px] text-[#566967] hidden md:inline">
                                    Bấm ảnh để phóng to chi tiết
                                </span>
                            </div>

                            {/* Gallery Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {projectPhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        onClick={() => setSelectedProjectPhoto({ url: photo.url, title: photo.title })}
                                        className="group relative rounded-2xl overflow-hidden border border-[#DDE5E1] bg-white cursor-pointer shadow-xs hover:shadow-md hover:border-[#087F8C] transition-all aspect-[4/3]"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={photo.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-80 group-hover:opacity-90 transition-opacity flex items-end p-2.5">
                                            <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight">
                                                {photo.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Footer */}
                <div className="px-5 py-3 border-t border-[#DDE5E1] bg-white flex items-center justify-between shrink-0">
                    <span className="text-xs text-[#566967]">
                        💡 Đóng bảng ảnh sẽ đưa bạn trở lại đúng góc nhìn 3D hiện tại
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#183B3A] hover:bg-[#234F4E] text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
                    >
                        Quay lại lớp học 3D
                    </button>
                </div>
            </div>

            {/* 5. Sub-Lightbox: Individual Project Photo Zoom */}
            {selectedProjectPhoto && (
                <div
                    className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn"
                    onClick={() => setSelectedProjectPhoto(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedProjectPhoto.url}
                            alt={selectedProjectPhoto.title}
                            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
                        />
                        <div className="mt-3 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md text-[#183B3A] text-xs font-bold text-center">
                            {selectedProjectPhoto.title}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedProjectPhoto(null)}
                            className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 6. Sub-Lightbox: Full Catalogue Page (NEM_MN_-_03) */}
            {isFullCatalogueOpen && (
                <div
                    className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn"
                    onClick={() => setIsFullCatalogueOpen(false)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img
                            src="/images/tour360/real-photos/catalogue/NEM_MN_-_03.jpg"
                            alt="Trang Catalogue HULA 6 màu Cotton Cara"
                            className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
                        />
                        <div className="mt-2.5 px-4 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[#183B3A] text-xs font-bold">
                            Catalogue HULA · Trang 03 · 6 Phối Màu Cotton Cara Tiêu Chuẩn
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFullCatalogueOpen(false)}
                            className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
