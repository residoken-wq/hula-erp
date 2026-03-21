'use client';

import React, { useEffect, useState } from 'react';
import { BlockRenderer } from '@/components/BlockRenderer';

export default function PreviewPage() {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [isEmbedded, setIsEmbedded] = useState(false);

    useEffect(() => {
        // Detect if loaded inside an iframe
        if (window !== window.parent) {
            setIsEmbedded(true);
        }

        const handleMessage = (event: MessageEvent) => {
            // Verify origin if needed in production, e.g., if (event.origin !== 'http://localhost:3002') return;
            if (event.data?.type === 'PREVIEW_BLOCKS_DATA') {
                setBlocks(event.data.payload || []);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!isEmbedded && process.env.NODE_ENV === 'production') {
        return <div className="p-8 text-center text-gray-500">Preview route is only available in CMS embed mode.</div>;
    }

    return (
        <div className="preview-container min-h-screen bg-white">
            <BlockRenderer blocks={blocks} />
            
            {!blocks.length && (
                <div className="flex items-center justify-center min-h-[50vh] text-gray-400">
                    <p>Đang chờ dữ liệu từ trình soạn thảo...</p>
                </div>
            )}
        </div>
    );
}
