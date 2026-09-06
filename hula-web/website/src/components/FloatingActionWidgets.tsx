'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import Classroom360Modal from './Classroom360Modal';

export default function FloatingActionWidgets() {
    const { settings, loading } = useSettings();
    const [isOpen360, setIsOpen360] = useState(false);

    // Do not show anything if loading
    if (loading) {
        return null;
    }

    const PHONE_NUMBER = settings?.contact_phone || '0983882210';
    const show360Widget = settings?.widget_360_enabled !== false && settings?.widget_360_enabled !== 'false';

    return (
        <>
            <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-4 items-center">
                {/* 360 Classroom Experience Widget Button */}
                {show360Widget && (
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => setIsOpen360(true)}
                            className="w-14 h-14 bg-gradient-to-tr from-[#23a7d3] via-[#0284c7] to-[#0ea5e9] rounded-full flex flex-col items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 text-white relative border-2 border-white/50 group-hover:border-white animate-pulse group-hover:animate-none"
                            aria-label="Trải nghiệm Lớp học 360 độ"
                        >
                            {/* Radar Ping Animation */}
                            <div className="w-12 h-12 border-2 border-cyan-300 border-opacity-70 rounded-full flex items-center justify-center absolute animate-ping pointer-events-none"></div>

                            {/* 360 Graphic / Icon */}
                            <div className="flex flex-col items-center justify-center leading-none select-none">
                                <span className="text-[13px] font-black tracking-tight font-sans drop-shadow-sm">360°</span>
                                <span className="text-[8px] font-extrabold uppercase tracking-tighter text-cyan-100">LỚP HỌC</span>
                            </div>

                            {/* Hot Badge */}
                            <span className="text-[9px] font-black tracking-tighter bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1 shadow-md uppercase border border-white">
                                {settings?.widget_360_badge || '360°'}
                            </span>
                        </button>
                        {/* Tooltip */}
                        <span className="absolute top-1/2 -translate-y-1/2 right-full mr-4 bg-slate-900/95 text-white text-xs font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl border border-white/20 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>{settings?.widget_360_tooltip || 'Khám phá Lớp học 360°'}</span>
                            <span className="text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded">MỚI</span>
                        </span>
                    </div>
                )}

                {/* Phone Widget */}
            <div className="relative group">
                <a
                    href={`tel:${PHONE_NUMBER}`}
                    className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-bounce group-hover:animate-none"
                    aria-label="Gọi điện thoại"
                >
                    <div className="w-10 h-10 border-2 border-white border-opacity-30 rounded-full flex items-center justify-center absolute animate-ping"></div>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </a>
                {/* Tooltip */}
                <span className="absolute top-1/2 -translate-y-1/2 right-full mr-4 bg-gray-800 text-white text-sm font-semibold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                    {PHONE_NUMBER}
                </span>
            </div>

            {/* Zalo Widget */}
            {settings?.zalo_url && (
                <div className="relative group">
                    <a
                        href={settings.zalo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                        aria-label="Chat Zalo"
                    >
                        <div className="text-[#0068FF] font-black text-[22px] font-sans tracking-tighter">Zalo</div>
                    </a>
                    {/* Tooltip */}
                    <span className="absolute top-1/2 -translate-y-1/2 right-full mr-4 bg-gray-800 text-white text-sm font-semibold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                        Chat Zalo
                    </span>
                </div>
            )}

            {/* Messenger Widget */}
            {settings?.facebook_url && (
                <div className="relative group">
                    <a
                        href={settings.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-gradient-to-tr from-[#00c6ff] to-[#0072ff] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                        aria-label="Chat Messenger"
                    >
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.145 2 11.26c0 2.923 1.493 5.518 3.821 7.185v3.42c0 .66.758 1.026 1.282.617l3.666-2.863c1.2.33 2.482.502 3.821.502 5.523 0 10-4.146 10-9.261C24 6.145 19.523 2 12 2zm1.189 12.381l-2.615-2.793-5.083 2.793 5.586-5.918 2.615 2.794 5.083-2.794-5.586 5.918z" />
                        </svg>
                    </a>
                    {/* Tooltip */}
                    <span className="absolute top-1/2 -translate-y-1/2 right-full mr-4 bg-gray-800 text-white text-sm font-semibold px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                        Messenger
                    </span>
                </div>
            )}
            </div>

            {/* Interactive 360 Classroom Experience Modal */}
            <Classroom360Modal
                isOpen={isOpen360}
                onClose={() => setIsOpen360(false)}
                settings={settings}
            />
        </>
    );
}
