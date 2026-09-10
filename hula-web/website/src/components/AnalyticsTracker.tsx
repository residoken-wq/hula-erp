'use client';

import { useEffect, useRef } from 'react';

const generateSessionId = () => {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

export default function AnalyticsTracker() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Detect obvious headless / automation tools
        const isHeadless = typeof navigator !== 'undefined' && (Boolean(navigator.webdriver) || /bot|crawler|spider|lightpanda|headless/i.test(navigator.userAgent));

        let sessionId = '';
        try {
            sessionId = sessionStorage.getItem('hula_session_id') || '';
            if (!sessionId) {
                sessionId = generateSessionId();
                sessionStorage.setItem('hula_session_id', sessionId);
            }
        } catch {
            sessionId = generateSessionId();
        }

        let cachedIp = '';
        try {
            cachedIp = sessionStorage.getItem('hula_client_ip') || '';
        } catch {}

        const resolveClientIp = async (): Promise<string> => {
            if (cachedIp) return cachedIp;
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 2000);
                const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
                clearTimeout(timer);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.ip) {
                        cachedIp = json.ip;
                        try {
                            sessionStorage.setItem('hula_client_ip', json.ip);
                        } catch {}
                        return json.ip;
                    }
                }
            } catch {
                // Ignore fallback error
            }
            return '';
        };

        const pingServer = async () => {
            try {
                const clientIp = cachedIp || (await resolveClientIp());
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';
                await fetch(`${API_URL}/public/analytics/ping`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        client_ip: clientIp || undefined,
                        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                    }),
                });
            } catch (error) {
                // Silently fail on network errors
            }
        };

        // Ping immediately on load
        pingServer();

        // If not a bot, ping every 60 seconds
        if (!isHeadless) {
            const interval = setInterval(pingServer, 60000);
            return () => clearInterval(interval);
        }
    }, []);

    return null; // This component doesn't render anything
}

