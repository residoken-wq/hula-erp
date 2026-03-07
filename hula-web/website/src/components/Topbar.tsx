'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export default function Topbar() {
    const { settings } = useSettings();
    const [isVisible, setIsVisible] = useState(true);
    const [homeConfig, setHomeConfig] = useState<any>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                const res = await fetch(`${baseUrl}/public/home-config`, { next: { revalidate: 60 } });
                if (res.ok) {
                    const data = await res.json();
                    setHomeConfig(data);
                }
            } catch { /* silent */ }
        };
        fetchConfig();
    }, []);

    if (!homeConfig?.topbar_enabled || !isVisible) return null;

    const speed = homeConfig.topbar_speed || 20;
    const leftText = homeConfig.topbar_left_text || '';
    const rightText = homeConfig.topbar_right_text || '';
    const rightUrl = homeConfig.topbar_right_url || '';

    return (
        <div className="bg-primary-600 text-white text-sm relative z-[60]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-9">
                {/* Left section — same width as logo */}
                <div className="flex-shrink-0" style={{ width: 'auto', minWidth: 120 }}>
                    <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {leftText}
                    </span>
                </div>

                {/* Marquee section */}
                <div className="flex-1 overflow-hidden mx-4 relative">
                    <div className="topbar-marquee-mask">
                        {rightUrl ? (
                            <Link
                                href={rightUrl}
                                className="topbar-marquee text-white/90 hover:text-accent font-medium text-xs sm:text-sm whitespace-nowrap inline-block"
                                style={{ animationDuration: `${speed}s` }}
                            >
                                {rightText}
                            </Link>
                        ) : (
                            <span
                                className="topbar-marquee text-white/90 font-medium text-xs sm:text-sm whitespace-nowrap inline-block"
                                style={{ animationDuration: `${speed}s` }}
                            >
                                {rightText}
                            </span>
                        )}
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
                    aria-label="Ẩn topbar"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
