/**
 * HULA 360 Product Showroom - Color Configurator Panel
 * Matches design/desktop.svg (360px right panel) & design/mobile.svg:
 * - Design tokens: #183B3A (text), #566967 (subtext), #087F8C (accent), #DDE5E1 (border)
 * - 6-swatch clickable card grid (3x2, min 48px height, checkmark on active)
 * - Scope toggle: "Toàn bộ lớp" vs "Một bộ" (with instance chips mat-01..mat-06)
 * - Dimension table: Nệm 120x63, Gối 40x25, Chăn 130x70
 * - "Xem chi tiết" CTA (48px height, #087F8C)
 */

import React, { useRef } from 'react';
import {
    SHOWROOM_PRODUCT,
    SHOWROOM_COLORS,
    SHOWROOM_INSTANCES,
    ShowroomColor,
} from './data/showroomConfig';
import { ShowroomScope } from './hooks/useShowroomColorState';

interface ColorConfiguratorPanelProps {
    activeColorId: string;
    activeColorLabel: string;
    isMixed: boolean;
    scope: ShowroomScope;
    selectedInstanceId: string;
    instanceColors: Record<string, string>;
    onSelectColor: (colorId: string) => void;
    onSetScope: (scope: ShowroomScope) => void;
    onSelectInstance: (instanceId: string) => void;
    onOpenDetail: () => void;
}

export function ColorConfiguratorPanel({
    activeColorId,
    activeColorLabel,
    isMixed,
    scope,
    selectedInstanceId,
    instanceColors,
    onSelectColor,
    onSetScope,
    onSelectInstance,
    onOpenDetail,
}: ColorConfiguratorPanelProps) {
    const swatchListRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation for 3x2 radio swatch grid
    const handleSwatchKeyDown = (e: React.KeyboardEvent, index: number) => {
        let targetIndex = -1;
        if (e.key === 'ArrowRight') {
            targetIndex = (index + 1) % SHOWROOM_COLORS.length;
        } else if (e.key === 'ArrowLeft') {
            targetIndex = (index - 1 + SHOWROOM_COLORS.length) % SHOWROOM_COLORS.length;
        } else if (e.key === 'ArrowDown') {
            targetIndex = (index + 3) % SHOWROOM_COLORS.length;
        } else if (e.key === 'ArrowUp') {
            targetIndex = (index - 3 + SHOWROOM_COLORS.length) % SHOWROOM_COLORS.length;
        }

        if (targetIndex >= 0) {
            e.preventDefault();
            const targetColor = SHOWROOM_COLORS[targetIndex];
            onSelectColor(targetColor.id);
            const buttons = swatchListRef.current?.querySelectorAll<HTMLButtonElement>('button[data-swatch]');
            buttons?.[targetIndex]?.focus();
        }
    };

    return (
        <aside
            className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-[#DDE5E1] p-4 sm:p-6 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[50vh] lg:max-h-full"
            aria-label="Bảng điều khiển phối màu nệm"
        >
            <div className="space-y-4 sm:space-y-5">
                {/* 1. Category & Product Title */}
                <div>
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#566967]">
                        {SHOWROOM_PRODUCT.category}
                    </span>
                    <h2 className="text-2xl sm:text-[27px] font-semibold text-[#183B3A] leading-tight mt-0.5">
                        {SHOWROOM_PRODUCT.name}
                    </h2>
                    <p className="text-sm sm:text-base text-[#566967] mt-0.5">
                        {SHOWROOM_PRODUCT.subtitle}
                    </p>
                </div>

                <div className="h-[1px] bg-[#DDE5E1]" aria-hidden="true" />

                {/* 2. Color Selection (3 cols x 2 rows) */}
                <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                        <span className="text-base sm:text-[17px] font-semibold text-[#183B3A]">
                            Màu sắc
                        </span>
                        <span className="text-xs sm:text-sm text-[#566967]">
                            Đang chọn:{' '}
                            <strong className="text-[#087F8C] font-semibold">
                                {activeColorLabel}
                            </strong>
                        </span>
                    </div>

                    {/* 6 Color Swatch Cards */}
                    <div
                        ref={swatchListRef}
                        className="grid grid-cols-3 gap-2 sm:gap-2.5"
                        role="radiogroup"
                        aria-label="Chọn màu nệm Cotton Cara"
                    >
                        {SHOWROOM_COLORS.map((color, index) => {
                            const isSelected = !isMixed && activeColorId === color.id;
                            return (
                                <button
                                    key={color.id}
                                    data-swatch
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => onSelectColor(color.id)}
                                    onKeyDown={e => handleSwatchKeyDown(e, index)}
                                    className={`relative min-h-[48px] p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[#087F8C] focus-visible:outline-none ${
                                        isSelected
                                            ? 'border-[#087F8C] bg-[#F0FAF9] shadow-xs'
                                            : 'border-[#DDE5E1] bg-white hover:bg-[#F7F8F5]'
                                    }`}
                                    title={`Chọn màu ${color.label}`}
                                >
                                    {/* Color Dot with Checkmark */}
                                    <div className="relative flex items-center justify-center">
                                        <span
                                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-inner border border-black/10 flex items-center justify-center"
                                            style={{ backgroundColor: color.previewHex }}
                                        >
                                            {isSelected && (
                                                <svg
                                                    className="w-3 h-3 text-[#183B3A] stroke-[3]"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-medium text-[#183B3A] leading-tight text-center truncate w-full">
                                        {color.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-[11px] sm:text-xs text-[#566967] mt-2 italic">
                        Màu hiển thị chỉ mang tính tham khảo.
                    </p>
                </div>

                <div className="h-[1px] bg-[#DDE5E1]" aria-hidden="true" />

                {/* 3. Scope Selection: Toàn bộ lớp vs Một bộ */}
                <div>
                    <label className="block text-base sm:text-[17px] font-semibold text-[#183B3A] mb-2 sm:mb-2.5">
                        Áp dụng màu cho
                    </label>

                    {/* Scope Segmented Control */}
                    <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F7F8F5] border border-[#DDE5E1]">
                        <button
                            type="button"
                            onClick={() => onSetScope('allMatchingProducts')}
                            className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                scope === 'allMatchingProducts'
                                    ? 'bg-[#087F8C] text-white shadow-xs font-semibold'
                                    : 'text-[#183B3A] hover:bg-white/60'
                            }`}
                        >
                            Toàn bộ lớp
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetScope('selectedInstance')}
                            className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                scope === 'selectedInstance'
                                    ? 'bg-[#087F8C] text-white shadow-xs font-semibold'
                                    : 'text-[#183B3A] hover:bg-white/60'
                            }`}
                        >
                            Một bộ
                        </button>
                    </div>

                    {/* Scope Subtext or Instance Selector */}
                    {scope === 'allMatchingProducts' ? (
                        <p className="text-xs text-[#566967] mt-2">
                            Áp dụng đồng bộ cho tất cả 6 bộ nệm cùng dòng trong lớp học.
                        </p>
                    ) : (
                        <div className="mt-2.5 space-y-1.5 animate-fadeIn">
                            <span className="text-[11px] font-medium text-[#566967]">
                                Chọn bộ muốn phối màu:
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                                {SHOWROOM_INSTANCES.map(inst => {
                                    const isTarget = selectedInstanceId === inst.id;
                                    const instColorId = instanceColors[inst.id];
                                    const colorObj = SHOWROOM_COLORS.find(c => c.id === instColorId);
                                    return (
                                        <button
                                            key={inst.id}
                                            type="button"
                                            onClick={() => onSelectInstance(inst.id)}
                                            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center justify-between gap-1 transition-all ${
                                                isTarget
                                                    ? 'border-[#087F8C] bg-[#F0FAF9] text-[#087F8C] font-semibold'
                                                    : 'border-[#DDE5E1] bg-white text-[#183B3A] hover:bg-[#F7F8F5]'
                                            }`}
                                        >
                                            <span>{inst.label}</span>
                                            <span
                                                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                                style={{ backgroundColor: colorObj?.previewHex || '#56C5ED' }}
                                                title={colorObj?.label}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-[1px] bg-[#DDE5E1]" aria-hidden="true" />

                {/* 4. Dimensions Table */}
                <div>
                    <h3 className="text-base sm:text-[17px] font-semibold text-[#183B3A] mb-2">
                        Kích thước
                    </h3>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between text-[#566967]">
                            <span>Nệm</span>
                            <span className="font-medium text-[#183B3A]">
                                {SHOWROOM_PRODUCT.dimensions.mattress}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[#566967]">
                            <span>Gối</span>
                            <span className="font-medium text-[#183B3A]">
                                {SHOWROOM_PRODUCT.dimensions.pillow}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[#566967]">
                            <span>Chăn</span>
                            <span className="font-medium text-[#183B3A]">
                                {SHOWROOM_PRODUCT.dimensions.blanket}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Bottom Action: CTA "Xem chi tiết" (48px min touch target) */}
            <div className="pt-4 sm:pt-6">
                <button
                    type="button"
                    onClick={onOpenDetail}
                    className="w-full min-h-[48px] px-4 rounded-xl bg-[#087F8C] hover:bg-[#066B76] active:scale-[0.98] text-white text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <span>Xem chi tiết</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
