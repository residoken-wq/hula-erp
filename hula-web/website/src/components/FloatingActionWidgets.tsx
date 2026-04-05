'use client';

import { useSettings } from '@/contexts/SettingsContext';

export default function FloatingActionWidgets() {
    const { settings, loading } = useSettings();

    // Do not show anything if all are empty or loading
    if (loading || (!settings?.contact_phone && !settings?.zalo_url && !settings?.facebook_url)) {
        return null;
    }

    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-4 items-center">
            {/* Phone Widget */}
            {settings?.contact_phone && (
                <div className="relative group">
                    <a
                        href={`tel:${settings.contact_phone.replace(/[^0-9+]/g, '')}`}
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
                        {settings.contact_phone}
                    </span>
                </div>
            )}

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
    );
}
