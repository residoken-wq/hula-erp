/**
 * HULA 360 Tour - Asset Loader Hook (useAssetLoader)
 * Handles image/texture preloading, tracks loading states and provides retry mechanisms
 * Satisfies A11: Friendly fallback without infinite spinners on asset failure.
 */

import { useState, useEffect, useCallback } from 'react';

export interface AssetLoadState {
    status: 'loading' | 'ready' | 'error';
    url: string;
    image: HTMLImageElement | null;
    errorMessage?: string;
    retry: () => void;
}

export function useAssetLoader(assetUrl: string | undefined): AssetLoadState {
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [retryCount, setRetryCount] = useState(0);

    const retry = useCallback(() => {
        setRetryCount(c => c + 1);
    }, []);

    useEffect(() => {
        if (!assetUrl) {
            setStatus('error');
            setErrorMessage('Không tìm thấy đường dẫn ảnh.');
            return;
        }

        setStatus('loading');
        setErrorMessage(undefined);

        let isCancelled = false;
        const img = new Image();

        img.onload = () => {
            if (isCancelled) return;
            setImage(img);
            setStatus('ready');
        };

        img.onerror = () => {
            if (isCancelled) return;
            setImage(null);
            setStatus('error');
            setErrorMessage(`Không thể tải hình ảnh: ${assetUrl}`);
        };

        img.src = assetUrl;

        return () => {
            isCancelled = true;
            img.onload = null;
            img.onerror = null;
        };
    }, [assetUrl, retryCount]);

    return {
        status,
        url: assetUrl || '',
        image,
        errorMessage,
        retry,
    };
}
