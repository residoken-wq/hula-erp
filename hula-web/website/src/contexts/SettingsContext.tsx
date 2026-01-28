'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
    site_name: string;
    site_description: string;
    logo_url: string;
    contact_phone: string;
    contact_email: string;
    contact_address: string;
    facebook_url: string;
    zalo_url: string;
}

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
}

const defaultSettings: Settings = {
    site_name: 'Nệm Mầm Non HULA',
    site_description: '',
    logo_url: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    facebook_url: '',
    zalo_url: '',
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    loading: true,
});

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use environment variable or fallback to relative path for same-origin
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const res = await fetch(`${apiUrl}/public/settings`, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        site_name: data.site_name || defaultSettings.site_name,
                        site_description: data.site_description || '',
                        logo_url: data.logo_url || '',
                        contact_phone: data.contact_phone || '',
                        contact_email: data.contact_email || '',
                        contact_address: data.contact_address || '',
                        facebook_url: data.facebook_url || '',
                        zalo_url: data.zalo_url || '',
                    });
                } else {
                    console.error('Failed to fetch settings:', res.status);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
}
