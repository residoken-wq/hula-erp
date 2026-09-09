/**
 * CampusInspector.tsx
 * Dynamic Inspector Panel for HULA School POV Experience:
 * - Adapts to current selected product line across R1-R5:
 *   • Cara Bedding: 6 Cara colors, scope selector, approach
 *   • Satin Bedding: Satin colors, comparison with Cara (120x65 vs 120x63)
 *   • Foam Fold 4: Interactive "Gấp nệm" & "Cất lên kệ cubby" animations
 *   • Foam Basic: Solid foam block specs (no fold4)
 *   • Sleep Bag: Standard (thin) vs Plus (quilted wave), 6 colors
 *   • Storage Bags: 5 bag models, "Cất vào ô tủ / Lấy lại", handle/zipper inspection
 * - Accessible, responsive, zero technical jargon
 */

'use client';

import React, { useState } from 'react';
import {
    campusWorldState,
    CARA_COLORS,
    SATIN_COLORS,
    ColorScope,
    CampusInstance,
} from '../engine/CampusWorldState';
import { KINDY_R4_BOOKMARKS } from '../engine/CampusCameraController';

interface CampusInspectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedInstance: CampusInstance | null;
    isApproached: boolean;
    onToggleApproach: () => void;
    activeColorInfo: { colorId: string; label: string; isMixed: boolean };
}

export function CampusInspector({
    isOpen,
    onClose,
    selectedInstance,
    isApproached,
    onToggleApproach,
    activeColorInfo,
}: CampusInspectorProps) {
    const [isSpecsOpen, setIsSpecsOpen] = useState(false);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [isChoicesSummaryOpen, setIsChoicesSummaryOpen] = useState(false);

    if (!isOpen) return null;

    const currentScope = campusWorldState.scope;
    const currentRoom = campusWorldState.currentRoomId;
    const roomInstances = Object.values(campusWorldState.instances).filter(
        i => i.roomId === currentRoom
    );

    const ref = selectedInstance?.productReference || 'REF-MAT-CARA-STD';
    const isCara = ref === 'REF-MAT-CARA-STD';
    const isSatin = ref === 'REF-MAT-SATIN-STD';
    const isFoamFold4 = ref === 'REF-FOAM-FOLD4';
    const isFoamBasic = ref === 'REF-FOAM-BASIC';
    const isSleepBag = ref.startsWith('REF-SLEEP-');
    const isBag = ref.startsWith('REF-BAG-');

    // Color palette to display
    const colorsList = isSatin ? SATIN_COLORS : (isCara || isSleepBag ? CARA_COLORS : []);

    const handleSelectColor = (colorId: string) => {
        campusWorldState.setColor(colorId);
    };

    const handleSelectScope = (scope: ColorScope) => {
        campusWorldState.setScope(scope);
    };

    const handleSelectInstance = (id: string) => {
        campusWorldState.selectInstance(id);
    };

    const handleToggleFold = () => {
        campusWorldState.toggleFold();
    };

    const handleToggleStore = () => {
        campusWorldState.toggleStore();
    };

    return (
        <aside
            className={`fixed lg:absolute top-14 sm:top-16 bottom-0 right-0 z-20 w-full sm:w-[360px] max-w-full bg-white/95 backdrop-blur-xl border-l border-[#DDE5E1] shadow-xl flex flex-col transition-transform duration-300 ease-out select-none ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="region"
            aria-label="Bảng điều khiển và thông số sản phẩm"
        >
            {/* 1. Header Bar */}
            <div className="p-4 sm:p-5 border-b border-[#DDE5E1] flex items-center justify-between bg-white/80">
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-[#087F8C] uppercase tracking-wider">
                        {isCara ? 'BỘ NỆM MẦM NON TIÊU CHUẨN' :
                         isSatin ? 'DÒNG NỆM SATIN HÀN QUỐC' :
                         isFoamFold4 ? 'NỆM FOAM TIỆN LỢI' :
                         isFoamBasic ? 'NỆM FOAM CƠ BẢN' :
                         isSleepBag ? 'TÚI NGỦ MẦM NON' :
                         'TÚI BẢO QUẢN TIÊU CHUẨN'}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#183B3A] truncate">
                        {selectedInstance ? selectedInstance.label : 'Chi tiết sản phẩm'}
                    </h2>
                    <span className="text-[11px] text-[#566967]">
                        {isCara ? 'Vải Cotton Cara chần gòn thoáng khí' :
                         isSatin ? 'Vải Satin kháng khuẩn mềm mát' :
                         isFoamFold4 ? 'Ruột Foam nguyên khối chống thấm' :
                         isFoamBasic ? 'Nệm Foam êm phẳng cho trẻ' :
                         isSleepBag ? 'Túi ngủ tích hợp nệm, gối và chăn' :
                         'Túi vải bảo quản kháng ẩm có khóa kéo'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#F6F8F5] text-[#566967] hover:text-[#183B3A] transition-all"
                    aria-label="Đóng bảng điều khiển"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* 2. Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* Instance Switcher Badges in Room */}
                {roomInstances.length > 1 && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#183B3A] uppercase tracking-wide">
                            Chọn mẫu trong phòng
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {roomInstances.map(inst => {
                                const isSelected = selectedInstance?.id === inst.id;
                                return (
                                    <button
                                        key={inst.id}
                                        type="button"
                                        onClick={() => handleSelectInstance(inst.id)}
                                        className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all text-center border ${
                                            isSelected
                                                ? 'bg-[#183B3A] text-white border-[#183B3A] shadow-xs'
                                                : 'bg-[#F6F8F5] text-[#183B3A] border-[#DDE5E1] hover:bg-[#EAEFEA]'
                                        }`}
                                    >
                                        {inst.label.split(' · ')[0]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Foam 4 Fold & Store Controls (R3) */}
                {isFoamFold4 && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-[#EAF4F2] border border-[#B7D9CC]">
                        <span className="text-xs font-bold text-[#183B3A] block">
                            Thao tác nệm 4 khúc
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleToggleFold}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                                    selectedInstance?.folded
                                        ? 'bg-white text-[#183B3A] border border-[#DDE5E1]'
                                        : 'bg-[#087F8C] text-white hover:bg-[#076C77]'
                                }`}
                            >
                                <span>{selectedInstance?.folded ? '📂 Mở nệm ra' : '📁 Gấp 4 khúc'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleStore}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                                    selectedInstance?.stored
                                        ? 'bg-[#183B3A] text-white'
                                        : 'bg-white text-[#183B3A] border border-[#DDE5E1] hover:bg-[#F6F8F5]'
                                }`}
                            >
                                <span>{selectedInstance?.stored ? '↩️ Đặt lại sàn' : '📦 Cất lên kệ'}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-[#566967] leading-relaxed">
                            Nệm gập theo 4 khúc bản lề và cất gọn gàng vào ngăn kệ cubby của lớp mầm.
                        </p>
                    </div>
                )}

                {/* Storage Bag Actions (R5) */}
                {isBag && (
                    <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#EAF4F2] border border-[#B7D9CC]">
                        <span className="text-xs font-bold text-[#183B3A] block">
                            Thao tác bảo quản
                        </span>
                        <button
                            type="button"
                            onClick={handleToggleStore}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                                selectedInstance?.stored
                                    ? 'bg-[#183B3A] text-white'
                                    : 'bg-[#087F8C] text-white hover:bg-[#076C77]'
                            }`}
                        >
                            <span>{selectedInstance?.stored ? '↩️ Lấy lại đặt lên giá' : '📥 Cất túi vào ô tủ'}</span>
                        </button>
                        <p className="text-[11px] text-[#566967]">
                            Kiểm tra quai, khóa và ô để túi trước giờ phụ huynh đón bé.
                        </p>
                    </div>
                )}

                {/* Scope Selection (for Bedding Sets) */}
                {(isCara || isSatin) && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#183B3A] uppercase tracking-wide">
                            Phạm vi áp dụng màu
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6F8F5] rounded-2xl border border-[#DDE5E1]">
                            <button
                                type="button"
                                onClick={() => handleSelectScope('selectedInstance')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-center ${
                                    currentScope === 'selectedInstance'
                                        ? 'bg-white text-[#183B3A] shadow-xs font-semibold'
                                        : 'text-[#566967] hover:text-[#183B3A]'
                                }`}
                            >
                                Một bộ này
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectScope('matchingProductsInCurrentRoom')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-center ${
                                    currentScope === 'matchingProductsInCurrentRoom'
                                        ? 'bg-white text-[#183B3A] shadow-xs font-semibold'
                                        : 'text-[#566967] hover:text-[#183B3A]'
                                }`}
                            >
                                Cả nhóm trong phòng
                            </button>
                        </div>
                    </div>
                )}

                {/* Color Swatches (if applicable) */}
                {colorsList.length > 0 && (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#183B3A] uppercase tracking-wide">
                                {isSatin ? 'Bảng màu Satin có nguồn' : 'Bảng 6 màu tiêu chuẩn'}
                            </label>
                            <span className="text-xs font-semibold text-[#087F8C]">
                                {activeColorInfo.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {colorsList.map(c => {
                                const isColorActive = !activeColorInfo.isMixed && activeColorInfo.colorId === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelectColor(c.id)}
                                        className={`relative p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[54px] ${
                                            isColorActive
                                                ? 'bg-white border-[#087F8C] shadow-md ring-2 ring-[#087F8C]/20'
                                                : 'bg-[#F6F8F5] border-[#DDE5E1] hover:bg-white hover:border-[#B2CBC5]'
                                        }`}
                                    >
                                        <div
                                            className="w-7 h-7 rounded-full border border-black/10 shadow-xs flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: c.previewHex }}
                                        >
                                            {isColorActive && (
                                                <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-semibold text-[#183B3A] text-center leading-tight whitespace-normal break-words px-1">
                                            {c.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* QA Camera Bookmarks (Instruction 08: 6 Kindy QA angles in R4) */}
                {currentRoom === 'R4' && (
                    <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#EAF4F2] border border-[#B7D9CC]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#183B3A]">
                                Góc máy đối chiếu thực tế (QA)
                            </span>
                            <span className="text-[10px] font-bold text-[#087F8C] uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-[#B7D9CC]">
                                6 Góc Chuẩn
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {Object.values(KINDY_R4_BOOKMARKS).map(bm => (
                                <button
                                    key={bm.id}
                                    type="button"
                                    onClick={() => campusWorldState.setBookmark(bm.id)}
                                    className="py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center border min-h-[44px] flex flex-col items-center justify-center bg-white text-[#183B3A] border-[#DDE5E1] hover:bg-[#087F8C] hover:text-white active:scale-95 shadow-xs"
                                    title={bm.label}
                                >
                                    <span>{bm.id}</span>
                                    <span className="text-[9px] font-normal opacity-80 truncate max-w-full">
                                        {bm.id === 'V01' ? 'Tổng thể' :
                                         bm.id === 'V02' ? 'Cửa sổ' :
                                         bm.id === 'V03' ? 'Túi Thường' :
                                         bm.id === 'V04' ? 'Túi Plus' :
                                         bm.id === 'V05' ? 'Nếp rủ' : 'Tầm mắt cô'}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-[#566967] leading-tight">
                            Đối chiếu nhanh với bộ ảnh thực tế trường Kindy Garden (V01-V06).
                        </p>
                    </div>
                )}

                {/* Action Buttons: Approach Camera / Return */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={onToggleApproach}
                        className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                            isApproached
                                ? 'bg-white text-[#183B3A] border-2 border-[#183B3A] hover:bg-[#F6F8F5]'
                                : 'bg-[#183B3A] text-white hover:bg-[#234F4E]'
                        }`}
                    >
                        {isApproached ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span>Đứng dậy / Quay lại vị trí trước</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Lại gần quan sát chi tiết</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Satin vs Cara Comparison Accordion (in R2) */}
                {isSatin && (
                    <div className="border border-[#B7D9CC] rounded-2xl overflow-hidden bg-[#EAF4F2]">
                        <button
                            type="button"
                            onClick={() => setIsCompareOpen(!isCompareOpen)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-[#183B3A] hover:bg-[#DFEFEA] transition-colors"
                        >
                            <span>So sánh nhanh với Cotton Cara</span>
                            <svg className={`w-4 h-4 text-[#566967] transition-transform ${isCompareOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isCompareOpen && (
                            <div className="p-3.5 space-y-2 text-xs border-t border-[#B7D9CC] text-[#183B3A] bg-white/70">
                                <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                    <span className="text-[#566967]">Bề rộng nệm:</span>
                                    <span className="font-bold">Satin 65 cm (Cara 63 cm)</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                    <span className="text-[#566967]">Chất liệu vải:</span>
                                    <span className="font-bold">Satin bóng mượt (Cara chần gòn)</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-[#566967]">Cảm giác nằm:</span>
                                    <span className="font-bold">Mềm mát, sang trọng</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Catalogue Specifications Accordion */}
                <div className="border border-[#DDE5E1] rounded-2xl overflow-hidden bg-white">
                    <button
                        type="button"
                        onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-[#183B3A] hover:bg-[#F6F8F5] transition-colors"
                    >
                        <span>Quy cách kích thước & cấu tạo</span>
                        <svg className={`w-4 h-4 text-[#566967] transition-transform ${isSpecsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isSpecsOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-2 text-xs border-t border-[#DDE5E1] text-[#566967] bg-[#F7F9F6]/50">
                            {isCara && (
                                <>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Nệm chần gòn:</span>
                                        <span className="font-bold text-[#183B3A]">120 × 63 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Gối nằm:</span>
                                        <span className="font-bold text-[#183B3A]">40 × 25 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Chăn đắp:</span>
                                        <span className="font-bold text-[#183B3A]">130 × 70 cm</span>
                                    </div>
                                </>
                            )}
                            {isSatin && (
                                <>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Nệm Satin:</span>
                                        <span className="font-bold text-[#183B3A]">120 × 65 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Gối nằm:</span>
                                        <span className="font-bold text-[#183B3A]">40 × 25 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Chăn đắp:</span>
                                        <span className="font-bold text-[#183B3A]">130 × 70 cm</span>
                                    </div>
                                </>
                            )}
                            {isFoamFold4 && (
                                <>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Quy cách mở:</span>
                                        <span className="font-bold text-[#183B3A]">120 × 60 × 3 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Cấu tạo:</span>
                                        <span className="font-bold text-[#183B3A]">4 đoạn gấp zíc zắc 30 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Drap bọc:</span>
                                        <span className="font-bold text-[#183B3A]">Satin Hàn Quốc</span>
                                    </div>
                                </>
                            )}
                            {isFoamBasic && (
                                <>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Quy cách tấm:</span>
                                        <span className="font-bold text-[#183B3A]">120 × 60 × 3 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Drap bọc:</span>
                                        <span className="font-bold text-[#183B3A]">Poly thoáng khí</span>
                                    </div>
                                </>
                            )}
                            {isSleepBag && (
                                <>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Thân túi ngủ:</span>
                                        <span className="font-bold text-[#183B3A]">125 × 63 cm</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#EAEFEA]">
                                        <span>Chăn đắp liền:</span>
                                        <span className="font-bold text-[#183B3A]">98 × 80 cm</span>
                                    </div>
                                </>
                            )}
                            {isBag && (
                                <div className="py-1 text-[#183B3A] font-medium">
                                    Túi bảo quản nệm mầm non tiêu chuẩn, có quai xách chắc chắn và nhãn tên.
                                </div>
                            )}
                            <div className="pt-1 text-[11px] text-[#087F8C]">
                                Dữ liệu đối chiếu danh mục catalogue HULA
                            </div>
                        </div>
                    )}
                </div>

                {/* Feature: "Xem lựa chọn của tôi" (Prominent in R6 & accessible across campus) */}
                <div className="pt-2 border-t border-[#DDE5E1] space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsChoicesSummaryOpen(!isChoicesSummaryOpen)}
                        className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border ${
                            isChoicesSummaryOpen
                                ? 'bg-[#183B3A] text-white border-[#183B3A]'
                                : 'bg-[#EAF4F2] text-[#087F8C] border-[#B7D9CC] hover:bg-[#DEF0EB]'
                        }`}
                    >
                        <span>📋</span>
                        <span>{isChoicesSummaryOpen ? 'Ẩn tóm tắt lựa chọn' : 'Xem lựa chọn phối bộ của tôi'}</span>
                    </button>

                    {isChoicesSummaryOpen && (() => {
                        const choices = campusWorldState.getMyChoicesSummary();
                        return (
                            <div className="p-4 rounded-2xl bg-white border border-[#087F8C]/30 shadow-md space-y-3 animate-fadeIn text-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-[#EAEFEA]">
                                    <span className="font-bold text-[#183B3A] uppercase tracking-wide text-[11px]">
                                        Tóm Tắt Phối Bộ Trong Lớp
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F0EA] text-[#087F8C]">
                                        Lớp HULA (R6)
                                    </span>
                                </div>

                                <div className="space-y-2 text-[#183B3A]">
                                    <div className="flex justify-between items-start py-1 border-b border-[#F0F4F2]">
                                        <span className="text-[#566967]">1. Cotton Cara:</span>
                                        <span className="font-semibold text-right max-w-[55%]">
                                            {choices.cara.colors.length > 0 ? choices.cara.colors.join(', ') : 'Chưa chọn'} ({choices.cara.count} bộ)
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start py-1 border-b border-[#F0F4F2]">
                                        <span className="text-[#566967]">2. Satin Hàn Quốc:</span>
                                        <span className="font-semibold text-right max-w-[55%]">
                                            {choices.satin.colors.length > 0 ? choices.satin.colors.join(', ') : 'Chưa chọn'} ({choices.satin.count} bộ)
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start py-1 border-b border-[#F0F4F2]">
                                        <span className="text-[#566967]">3. Nệm Foam 4 Khúc:</span>
                                        <span className="font-semibold text-right max-w-[55%]">
                                            {choices.foam.stored
                                                ? '📦 Đã cất vào kệ cubby'
                                                : choices.foam.folded
                                                ? '📁 Đang gấp 4 khúc'
                                                : '📂 Đang trải phẳng trên sàn'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start py-1 border-b border-[#F0F4F2]">
                                        <span className="text-[#566967]">4. Túi Ngủ Cara:</span>
                                        <span className="font-semibold text-right max-w-[55%]">
                                            {choices.sleep.color ? `Màu ${choices.sleep.color}` : 'Tiêu chuẩn'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start py-1 border-b border-[#F0F4F2]">
                                        <span className="text-[#566967]">5. Túi Bảo Quản:</span>
                                        <span className="font-semibold text-right max-w-[55%]">
                                            {choices.bags.length > 0
                                                ? choices.bags.map(b => b.label.split(' (')[0]).join(' + ')
                                                : 'Mẫu tiêu chuẩn'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => campusWorldState.setRoom('R7')}
                                        className="w-full py-2.5 px-3 bg-[#183B3A] text-white rounded-xl font-bold text-xs hover:bg-[#234F4E] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                    >
                                        <span>→ Tiếp tục đến Phòng Đón Bé (R7)</span>
                                    </button>
                                </div>

                                <p className="text-[10px] text-[#566967] leading-relaxed italic text-center pt-1">
                                    Cấu hình trải nghiệm thực tế tại trường mầm non HULA. Sản xuất theo đơn hàng trường và quy chuẩn catalogue.
                                </p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </aside>
    );
}
