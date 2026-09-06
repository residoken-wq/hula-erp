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
    google_maps_url: string;
    facebook_page_url: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    pinterest?: string;
    // Section background colors
    section_hero_bg: string;
    section_hero_usp_bg: string;
    section_categories_bg: string;
    section_about_bg: string;
    section_journey_bg: string;
    section_projects_bg: string;
    section_partners_bg: string;
    section_testimonials_bg: string;
    section_blog_bg: string;
    // Section text colors
    section_hero_text: string;
    section_hero_usp_text: string;
    section_categories_text: string;
    section_about_text: string;
    section_journey_text: string;
    section_projects_text: string;
    section_partners_text: string;
    section_testimonials_text: string;
    section_blog_text: string;
    hidden_pages: string;
    widget_360_enabled?: boolean | string;
    widget_360_tooltip?: string;
    widget_360_badge?: string;
    widget_360_panorama_url?: string;
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
    google_maps_url: '',
    facebook_page_url: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    pinterest: '',
    section_hero_bg: '',
    section_hero_usp_bg: '',
    section_categories_bg: '',
    section_about_bg: '',
    section_journey_bg: '',
    section_projects_bg: '',
    section_partners_bg: '',
    section_testimonials_bg: '',
    section_blog_bg: '',
    section_hero_text: '',
    section_hero_usp_text: '',
    section_categories_text: '',
    section_about_text: '',
    section_journey_text: '',
    section_projects_text: '',
    section_partners_text: '',
    section_testimonials_text: '',
    section_blog_text: '',
    hidden_pages: '',
    widget_360_enabled: true,
    widget_360_tooltip: 'Khám phá Lớp học 360°',
    widget_360_badge: '360°',
    widget_360_panorama_url: '',
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
                        google_maps_url: data.google_maps_url || '',
                        facebook_page_url: data.facebook_page_url || '',
                        facebook: data.facebook || '',
                        instagram: data.instagram || '',
                        tiktok: data.tiktok || '',
                        youtube: data.youtube || '',
                        linkedin: data.linkedin || '',
                        pinterest: data.pinterest || '',
                        section_hero_bg: data.section_hero_bg || '',
                        section_hero_usp_bg: data.section_hero_usp_bg || '',
                        section_categories_bg: data.section_categories_bg || '',
                        section_about_bg: data.section_about_bg || '',
                        section_journey_bg: data.section_journey_bg || '',
                        section_projects_bg: data.section_projects_bg || '',
                        section_partners_bg: data.section_partners_bg || '',
                        section_testimonials_bg: data.section_testimonials_bg || '',
                        section_blog_bg: data.section_blog_bg || '',
                        section_hero_text: data.section_hero_text || '',
                        section_hero_usp_text: data.section_hero_usp_text || '',
                        section_categories_text: data.section_categories_text || '',
                        section_about_text: data.section_about_text || '',
                        section_journey_text: data.section_journey_text || '',
                        section_projects_text: data.section_projects_text || '',
                        section_partners_text: data.section_partners_text || '',
                        section_testimonials_text: data.section_testimonials_text || '',
                        section_blog_text: data.section_blog_text || '',
                        hidden_pages: data.hidden_pages || '',
                        widget_360_enabled: (() => {
                            if (data.widget_360_enabled !== undefined && data.widget_360_enabled !== '') {
                                return data.widget_360_enabled !== 'false' && data.widget_360_enabled !== false;
                            }
                            if (typeof window !== 'undefined') {
                                const stored = localStorage.getItem('widget_360_enabled');
                                if (stored !== null) return stored === 'true';
                            }
                            return true;
                        })(),
                        widget_360_tooltip: data.widget_360_tooltip || 'Khám phá Lớp học 360°',
                        widget_360_badge: data.widget_360_badge || '360°',
                        widget_360_panorama_url: data.widget_360_panorama_url || '',
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
