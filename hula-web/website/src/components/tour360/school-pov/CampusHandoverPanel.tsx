/**
 * CampusHandoverPanel.tsx
 * Interactive Handover Panel for Room R7 (Weekend Handover Encounter):
 * - Displays 6 Steps: H0 (Meeting) -> H1 (Select Bag) -> H2 (Verify Label) -> H3 (Prepare) -> H4 (Transfer) -> H5 (Completed)
 * - Role-tailored dialogue for Cô An, Mẹ Linh, Bé Mây
 * - Label & Items checklist inspection modal
 * - Replay / Encounter reset capability
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
    handoverStateMachine,
    HANDOVER_STEPS_META,
    MAY_HANDOVER_LABEL,
    HandoverState,
} from '../engine/HandoverStateMachine';
import { RoleId, ROLES, campusWorldState } from '../engine/CampusWorldState';

interface CampusHandoverPanelProps {
    activeRole: RoleId;
    onExploreMore?: () => void;
}

export function CampusHandoverPanel({ activeRole, onExploreMore }: CampusHandoverPanelProps) {
    const [state, setState] = useState<HandoverState>(handoverStateMachine.state);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(handoverStateMachine.isLabelModalOpen);
    const [isTransferring, setIsTransferring] = useState(handoverStateMachine.isTransferring);

    useEffect(() => {
        const unsubscribe = handoverStateMachine.subscribe(() => {
            setState(handoverStateMachine.state);
            setIsLabelModalOpen(handoverStateMachine.isLabelModalOpen);
            setIsTransferring(handoverStateMachine.isTransferring);
        });
        return unsubscribe;
    }, []);

    const stepMeta = HANDOVER_STEPS_META[state];
    const roleInfo = ROLES[activeRole] || ROLES['me-linh'];
    const currentDialogue = stepMeta.dialogue[activeRole] || '';
    const currentActionLabel = stepMeta.actionLabel[activeRole] || 'Tiếp tục';

    const handleAction = () => {
        handoverStateMachine.triggerAction(activeRole);
    };

    const handleConfirmLabel = () => {
        handoverStateMachine.confirmLabelVerification();
    };

    const handleCloseLabel = () => {
        handoverStateMachine.closeLabelModal();
    };

    const handleReplay = () => {
        handoverStateMachine.replay();
    };

    const stepsList: Array<{ state: HandoverState; code: string }> = [
        { state: 'waiting', code: 'H0' },
        { state: 'bag_selected', code: 'H1' },
        { state: 'label_verified', code: 'H2' },
        { state: 'ready_to_transfer', code: 'H3' },
        { state: 'transferring', code: 'H4' },
        { state: 'completed', code: 'H5' },
    ];

    const currentStepIndex = state === 'received' ? 4 : stepsList.findIndex(s => s.state === state);

    return (
        <>
            {/* Handover Overlay Bar at bottom of screen */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-[#B7D9CC] shadow-2xl space-y-3.5 animate-fadeIn">
                {/* 1. Header: Step Code & Step Progress Indicators */}
                <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#087F8C] text-white">
                            {stepMeta.stepCode}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#183B3A]">
                            {stepMeta.stepTitle}
                        </span>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5">
                        {stepsList.map((step, idx) => {
                            const isDone = idx < currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            return (
                                <div
                                    key={step.code}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        isCurrent
                                            ? 'bg-[#087F8C] scale-125 ring-2 ring-[#087F8C]/30'
                                            : isDone
                                            ? 'bg-[#183B3A]'
                                            : 'bg-[#DDE5E1]'
                                    }`}
                                    title={step.code}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* 2. Character Dialogue */}
                <div className="flex items-start gap-3 bg-[#F6F8F5] p-3 rounded-2xl border border-[#EAEFEA]">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#087F8C] flex items-center justify-center font-bold text-sm shrink-0 border border-[#DDE5E1]">
                        {activeRole === 'be-may' ? '👶' : activeRole === 'co-an' ? '👩‍🏫' : '👩'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-[#087F8C] uppercase tracking-wider block">
                            Góc nhìn {roleInfo.name} ({roleInfo.title})
                        </span>
                        <p className="text-xs sm:text-sm text-[#183B3A] italic font-medium leading-relaxed mt-0.5">
                            {currentDialogue}
                        </p>
                    </div>
                </div>

                {/* 3. Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                    {state === 'completed' ? (
                        <>
                            <button
                                type="button"
                                onClick={handleReplay}
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white text-[#183B3A] border-2 border-[#183B3A] hover:bg-[#F6F8F5] transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
                            >
                                <span>↺</span>
                                <span>Khám phá lại cuộc gặp (Replay)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => campusWorldState.setRoom('R1')}
                                className="py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#183B3A] text-white hover:bg-[#234F4E] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                <span>Về Lớp Lá</span>
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            disabled={isTransferring}
                            onClick={handleAction}
                            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                                isTransferring
                                    ? 'bg-[#7FA39C] text-white cursor-wait'
                                    : 'bg-[#087F8C] text-white hover:bg-[#076C77]'
                            }`}
                        >
                            {isTransferring ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Đang chuyển giao quyền sở hữu túi...</span>
                                </>
                            ) : (
                                <span>{currentActionLabel}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Label & Items Verification Modal (H2) */}
            {isLabelModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Kiểm tra thông tin nhãn túi đồ của Mây"
                >
                    <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#DDE5E1] space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E1]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#087F8C]/10 text-[#087F8C] flex items-center justify-center font-bold">
                                    🏷️
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#183B3A]">
                                        Nhãn Tên & Danh Mục Đồ Của Bé
                                    </h3>
                                    <p className="text-xs text-[#566967]">
                                        Xác nhận đúng thông tin trước khi bàn giao
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseLabel}
                                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#F6F8F5] text-[#566967] hover:text-[#183B3A] transition-all"
                                aria-label="Đóng bảng kiểm tra nhãn"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Physical Tag Preview */}
                        <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-dashed border-[#D6C2A0] space-y-2 text-center">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#7A6240]">
                                TRƯỜNG MẦM NON HULA — TÚI ĐỒ CÁ NHÂN
                            </span>
                            <div className="text-lg font-black text-[#183B3A]">
                                BÉ: {MAY_HANDOVER_LABEL.childName} — {MAY_HANDOVER_LABEL.className}
                            </div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F0EA] text-[#087F8C]">
                                Mã đồ: bag-may-01
                            </span>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-2 text-xs text-[#183B3A]">
                            <div className="flex justify-between py-1.5 border-b border-[#EAEFEA]">
                                <span className="text-[#566967]">1. Bộ nệm:</span>
                                <span className="font-bold">{MAY_HANDOVER_LABEL.beddingName}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#EAEFEA]">
                                <span className="text-[#566967]">2. Túi bảo quản:</span>
                                <span className="font-bold">{MAY_HANDOVER_LABEL.bagName}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-[#566967]">3. Trạng thái xếp:</span>
                                <span className="font-bold text-[#087F8C]">Đã gập gọn & kéo khóa hoàn tất</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleConfirmLabel}
                                className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#183B3A] text-white hover:bg-[#234F4E] transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                            >
                                <span>✓</span>
                                <span>Xác nhận đúng nhãn & danh mục đồ</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
