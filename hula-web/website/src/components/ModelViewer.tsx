'use client';

import { useEffect, useRef } from 'react';

// TypeScript declarations for model-viewer custom element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string;
                    poster?: string;
                    alt?: string;
                    ar?: boolean;
                    'ar-modes'?: string;
                    'camera-controls'?: boolean;
                    'auto-rotate'?: boolean;
                    'shadow-intensity'?: string;
                    'environment-image'?: string;
                    exposure?: string;
                    style?: React.CSSProperties;
                },
                HTMLElement
            >;
        }
    }
}

interface ModelViewerProps {
    src: string;
    poster?: string;
    alt?: string;
    ar?: boolean;
    autoRotate?: boolean;
    cameraControls?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

export default function ModelViewer({
    src,
    poster,
    alt = '3D Model',
    ar = true,
    autoRotate = true,
    cameraControls = true,
    style,
    className
}: ModelViewerProps) {
    const modelViewerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // Dynamically import model-viewer only on client side
        import('@google/model-viewer');
    }, []);

    return (
        <model-viewer
            ref={modelViewerRef as any}
            src={src}
            poster={poster}
            alt={alt}
            ar={ar}
            ar-modes="webxr scene-viewer quick-look"
            camera-controls={cameraControls}
            auto-rotate={autoRotate}
            shadow-intensity="1"
            style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                ...style
            }}
            className={className}
        />
    );
}
