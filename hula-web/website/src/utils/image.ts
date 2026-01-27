/**
 * Converts a Google Drive share link to a direct download/view link
 * that can be used in <img> tags.
 * 
 * Supports:
 * - standard view/sharing links (drive.google.com/file/d/...)
 * - already direct links (lh3.googleusercontent.com, etc)
 * 
 * @param url The image URL to convert
 * @returns The direct link URL
 */
export const convertGoogleDriveLink = (url: string | undefined | null): string => {
    if (!url) return '';

    try {
        // If it's already a direct google user content link, return as is
        if (url.includes('googleusercontent.com')) return url;

        // Check for standard drive file links
        // Patterns: 
        // https://drive.google.com/file/d/VIDEO_ID/view...
        // https://drive.google.com/open?id=VIDEO_ID

        let fileId = '';

        const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
        if (fileIdMatch) {
            fileId = fileIdMatch[1];
        } else {
            const idParamMatch = url.match(/[?&]id=([^&]+)/);
            if (idParamMatch) {
                fileId = idParamMatch[1];
            }
        }

        if (fileId) {
            // Use the "uc" (user content) export=view endpoint
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }

        return url;
    } catch (e) {
        return url;
    }
};
