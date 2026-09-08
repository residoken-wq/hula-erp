/**
 * HULA 360 Product Showroom - Help Modal Component
 * Explains how to interact with the color customizer, shortcuts and scope toggling.
 */

import React, { useEffect } from 'react';

interface ShowroomHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShowroomHelpModal({ isOpen, onClose }: ShowroomHelpModalProps) {
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
            aria-labelledby="help-title"
        >
            <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-[#DDE5E1] shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-[#DDE5E1] flex items-center justify-between shrink-0 bg-[#F7F8F5]">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <h3 id="help-title" className="text-lg font-bold text-[#183B3A]">
                            Hướng dẫn Phối màu lớp học
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#DDE5E1] text-[#183B3A] text-xl font-light flex items-center justify-center transition-all shadow-xs"
                        aria-label="Đóng hướng dẫn"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-[#183B3A] overflow-y-auto">
                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#087F8C]/15 text-[#087F8C] font-bold flex items-center justify-center shrink-0">
                            1
                        </span>
                        <div>
                            <strong className="font-semibold block">Chọn màu sắc</strong>
                            <p className="text-[#566967] mt-0.5">
                                Bấm chọn 1 trong 6 ô màu Cotton Cara ở bảng bên phải (hoặc dùng phím mũi tên trên bàn phím).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#087F8C]/15 text-[#087F8C] font-bold flex items-center justify-center shrink-0">
                            2
                        </span>
                        <div>
                            <strong className="font-semibold block">Phạm vi áp dụng</strong>
                            <p className="text-[#566967] mt-0.5">
                                Chọn <strong>Toàn bộ lớp</strong> để đổi màu cả 6 bộ cùng lúc, hoặc chọn <strong>Một bộ</strong> để chọn phối màu riêng từng nệm (Bộ 01 đến Bộ 06).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#087F8C]/15 text-[#087F8C] font-bold flex items-center justify-center shrink-0">
                            3
                        </span>
                        <div>
                            <strong className="font-semibold block">Góc nhìn camera</strong>
                            <p className="text-[#566967] mt-0.5">
                                Sử dụng 3 nút <strong>Tổng thể</strong>, <strong>Cận sản phẩm</strong> và <strong>Góc cất đồ</strong> bên dưới để quan sát nệm ở các vị trí khác nhau.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#087F8C]/15 text-[#087F8C] font-bold flex items-center justify-center shrink-0">
                            4
                        </span>
                        <div>
                            <strong className="font-semibold block">Kéo lia góc nhìn</strong>
                            <p className="text-[#566967] mt-0.5">
                                Nhấn giữ chuột trái hoặc vuốt nhẹ trên màn hình để lia góc phối cảnh tinh tế.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#087F8C]/15 text-[#087F8C] font-bold flex items-center justify-center shrink-0">
                            5
                        </span>
                        <div>
                            <strong className="font-semibold block">Phím tắt nhanh</strong>
                            <p className="text-[#566967] mt-0.5">
                                Nhấn phím <strong>Escape</strong> bất kỳ lúc nào để đóng bảng trợ giúp hoặc thoát khỏi showroom.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#DDE5E1] flex justify-end shrink-0 bg-[#F7F8F5]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-[#087F8C] hover:bg-[#066B76] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
                    >
                        Đã rõ
                    </button>
                </div>
            </div>
        </div>
    );
}
