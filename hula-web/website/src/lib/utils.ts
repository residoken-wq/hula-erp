const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

export const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
        return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    }
    return getGoogleDriveImageUrl(url);
};

export const getGoogleDriveImageUrl = (url?: string) => {
    if (!url) return '';
    try {
        if (url.includes('drive.google.com')) {
            // Case 1: /file/d/VIDEO_ID/view
            const standardMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (standardMatch) {
                return `https://drive.google.com/thumbnail?id=${standardMatch[1]}&sz=w1000`;
            }

            // Case 2: ?id=VIDEO_ID
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
            }
        }
        return url;
    } catch {
        return url || '';
    }
};
