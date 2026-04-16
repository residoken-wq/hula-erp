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

        let sessionId = sessionStorage.getItem('hula_session_id');
        if (!sessionId) {
            sessionId = generateSessionId();
            sessionStorage.setItem('hula_session_id', sessionId);
        }

        const pingServer = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com/api';
                await fetch(`${API_URL}/public/analytics/ping`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ session_id: sessionId }),
                });
            } catch (error) {
                console.error('Analytics ping failed', error);
            }
        };

        // Ping immediately on load
        pingServer();

        // Then ping every 60 seconds
        const interval = setInterval(pingServer, 60000);

        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
}
