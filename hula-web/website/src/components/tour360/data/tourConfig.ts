/**
 * HULA 360 Tour - Configuration & Eligibility Logic
 * Single Source of Truth for whether the Tour widget should be visible.
 * Adheres to Instruction 03 §2: Server-driven only, no localStorage override.
 */

export interface TourSettingsInput {
    hidden_pages?: string | string[];
    widget_360_enabled?: boolean | string | number;
    widget_360_tooltip?: string;
    widget_360_badge?: string;
    widget_360_panorama_url?: string;
    contact_phone?: string;
    [key: string]: any;
}

/**
 * Computes whether the 360 Tour widget is eligible to be displayed on the current route.
 *
 * Rules:
 * 1. If settings is null or loading, return false (widget will not flicker).
 * 2. If server set widget_360_enabled to false, always return false.
 * 3. If hidden_pages contains 'widget_360' or '/widget_360', return false.
 * 4. If currentRoute matches any entry in hidden_pages, return false.
 * 5. No localStorage override permitted.
 */
export function computeTourEligibility(
    settings: TourSettingsInput | null | undefined,
    currentRoute?: string
): boolean {
    if (!settings) {
        return false;
    }

    // 1. Check server toggle
    if (
        settings.widget_360_enabled === false ||
        settings.widget_360_enabled === 'false' ||
        settings.widget_360_enabled === 0 ||
        settings.widget_360_enabled === '0'
    ) {
        return false;
    }

    // 2. Parse hidden_pages
    const hiddenList = parseHiddenPages(settings.hidden_pages);

    // If widget_360 is globally suppressed in hidden_pages
    if (hiddenList.includes('widget_360') || hiddenList.includes('/widget_360')) {
        return false;
    }

    // 3. If current route is suppressed in hidden_pages
    if (currentRoute) {
        const normalizedRoute = currentRoute.trim().toLowerCase();
        const isRouteHidden = hiddenList.some(item => {
            const normalizedItem = item.trim().toLowerCase();
            return (
                normalizedItem === normalizedRoute ||
                (normalizedItem !== '/' && normalizedRoute.startsWith(normalizedItem))
            );
        });
        if (isRouteHidden) {
            return false;
        }
    }

    return true;
}

/**
 * Helper to safely parse hidden_pages from string or array
 */
export function parseHiddenPages(hiddenPages: string | string[] | undefined | null): string[] {
    if (!hiddenPages) return [];
    if (Array.isArray(hiddenPages)) return hiddenPages;
    if (typeof hiddenPages === 'string') {
        const trimmed = hiddenPages.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(String);
            } catch {
                // fall through to comma-separated
            }
        }
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

/**
 * Normalizes tour settings to safe values
 */
export function normalizeTourSettings(settings: TourSettingsInput | null | undefined) {
    return {
        enabled: computeTourEligibility(settings),
        tooltip: (settings?.widget_360_tooltip || 'Khám phá Lớp học 360°').slice(0, 60),
        badge: (settings?.widget_360_badge || '360°').slice(0, 10),
        panoramaUrl: settings?.widget_360_panorama_url || '',
        contactPhone: settings?.contact_phone || '0983882210',
    };
}
