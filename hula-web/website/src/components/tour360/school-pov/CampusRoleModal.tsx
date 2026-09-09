/**
 * CampusRoleModal.tsx
 * Character / Role Selection Modal for HULA School POV:
 * - Cô An (1.55 m)
 * - Mẹ Linh (1.60 m)
 * - Bé Mây (0.95 m)
 * Changes camera eye height dynamically while preserving campus session state
 */

'use client';

import React from 'react';
import { campusWorldState, ROLES, RoleId } from '../engine/CampusWorldState';

interface CampusRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeRole: RoleId;
}

export function CampusRoleModal({
    isOpen,
    onClose,
    activeRole,
}: CampusRoleModalProps) {
    if (!isOpen) return null;

    const handleSelectRole = (roleId: RoleId) => {
        campusWorldState.setRole(roleId);
        onClose();
    };

    const rolesList = Object.values(ROLES);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-label="Chọn góc nhìn nhân vật"
        >
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#DDE5E1] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#DDE5E1]">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#183B3A]">
                            Chọn Góc Nhìn Khám Phá (POV)
                        </h3>
                        <p className="text-xs text-[#566967]">
                            Mỗi nhân vật có tầm mắt và cảm nhận không gian riêng biệt
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#F6F8F5] text-[#566967] hover:text-[#183B3A] transition-all"
                        aria-label="Đóng bảng chọn nhân vật"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Roles Cards */}
                <div className="py-4 space-y-3">
                    {rolesList.map(role => {
                        const isSelected = activeRole === role.id;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => handleSelectRole(role.id)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-98 flex items-start gap-3.5 ${
                                    isSelected
                                        ? 'bg-[#183B3A] text-white border-[#183B3A] shadow-md ring-2 ring-[#087F8C]/30'
                                        : 'bg-[#F7F9F6] text-[#183B3A] border-[#DDE5E1] hover:bg-white hover:border-[#B7D9CC]'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                                    isSelected ? 'bg-[#087F8C] text-white' : 'bg-white text-[#087F8C] border border-[#DDE5E1]'
                                }`}>
                                    {role.id === 'be-may' ? '👶' : role.id === 'co-an' ? '👩‍🏫' : '👩'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm sm:text-base">
                                            {role.name}
                                        </span>
                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-[#EAEFEA] text-[#183B3A]'
                                        }`}>
                                            Tầm mắt {role.eyeHeight.toFixed(2)} m
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-1 font-medium ${isSelected ? 'text-white/80' : 'text-[#087F8C]'}`}>
                                        {role.title}
                                    </p>
                                    <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? 'text-white/70' : 'text-[#566967]'}`}>
                                        {role.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[#DDE5E1] text-[11px] text-[#566967] text-center">
                    Góc nhìn thay đổi tức thì, giữ nguyên các bộ nệm và màu sắc bạn đã chọn
                </div>
            </div>
        </div>
    );
}
