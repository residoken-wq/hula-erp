'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function MaintenancePage() {
    const [progress, setProgress] = useState(75);

    // Settings from CMS
    const [siteName, setSiteName] = useState('Nệm Mầm Non HULA');
    const [contactPhone, setContactPhone] = useState('0123 456 789');
    const [contactEmail, setContactEmail] = useState('info@nemmamnon.com');

    // Fetch settings from backend (single request)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/public/settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.site_name) setSiteName(data.site_name);
                    if (data.contact_phone) setContactPhone(data.contact_phone);
                    if (data.contact_email) setContactEmail(data.contact_email);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        // Simulate progress
        const timer = setInterval(() => {
            setProgress((p) => {
                if (p >= 95) return 75 + Math.random() * 20;
                return p + Math.random() * 0.5;
            });
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Animated gears */}
            <div className="absolute top-20 right-20 opacity-10">
                <svg className="w-32 h-32 animate-spin" style={{ animationDuration: '10s' }} viewBox="0 0 100 100">
                    <path fill="currentColor" d="M50 10 L53 10 L55 25 L63 22 L68 12 L72 14 L70 28 L78 28 L82 18 L86 22 L80 35 L88 40 L95 32 L98 37 L88 48 L88 52 L98 63 L95 68 L88 60 L80 65 L86 78 L82 82 L78 72 L70 72 L72 86 L68 88 L63 78 L55 75 L53 90 L47 90 L45 75 L37 78 L32 88 L28 86 L30 72 L22 72 L18 82 L14 78 L20 65 L12 60 L5 68 L2 63 L12 52 L12 48 L2 37 L5 32 L12 40 L20 35 L14 22 L18 18 L22 28 L30 28 L28 14 L32 12 L37 22 L45 25 L47 10 Z M50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35" />
                </svg>
            </div>
            <div className="absolute bottom-32 left-16 opacity-10">
                <svg className="w-24 h-24 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} viewBox="0 0 100 100">
                    <path fill="currentColor" d="M50 10 L53 10 L55 25 L63 22 L68 12 L72 14 L70 28 L78 28 L82 18 L86 22 L80 35 L88 40 L95 32 L98 37 L88 48 L88 52 L98 63 L95 68 L88 60 L80 65 L86 78 L82 82 L78 72 L70 72 L72 86 L68 88 L63 78 L55 75 L53 90 L47 90 L45 75 L37 78 L32 88 L28 86 L30 72 L22 72 L18 82 L14 78 L20 65 L12 60 L5 68 L2 63 L12 52 L12 48 L2 37 L5 32 L12 40 L20 35 L14 22 L18 18 L22 28 L30 28 L28 14 L32 12 L37 22 L45 25 L47 10 Z M50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35" />
                </svg>
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* Icon */}
                <div className="mb-8">
                    <div className="w-28 h-28 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-xl shadow-primary-500/30 animate-pulse">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Đang Bảo Trì
                </h1>

                <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
                    Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn.
                    Website sẽ hoạt động trở lại trong thời gian ngắn.
                </p>

                {/* Progress bar */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Tiến độ</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Status cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">Database</p>
                        <p className="text-xs text-green-600">Hoạt động</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">Website</p>
                        <p className="text-xs text-yellow-600">Đang cập nhật</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">API</p>
                        <p className="text-xs text-green-600">Hoạt động</p>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-lg mx-auto">
                    <p className="text-gray-600 mb-4">
                        Nếu bạn cần hỗ trợ gấp, vui lòng liên hệ:
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a
                            href={`tel:${contactPhone.replace(/\s/g, '')}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Gọi ngay
                        </a>
                        <a
                            href={`mailto:${contactEmail}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Gửi email
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-12 text-gray-400 text-sm">
                    © 2026 {siteName}. Cảm ơn sự kiên nhẫn của bạn.
                </p>
            </div>
        </div>
    );
}
