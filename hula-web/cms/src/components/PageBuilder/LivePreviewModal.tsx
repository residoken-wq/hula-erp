import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { BlockData } from './types';

interface LivePreviewModalProps {
    open: boolean;
    onClose: () => void;
    blocks: BlockData[];
    title?: string;
}

export default function LivePreviewModal({ open, onClose, blocks, title = "Xem trước trang" }: LivePreviewModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (open && iframeRef.current) {
            // Send blocks to the iframe after a short delay to ensure it's loaded
            const timer = setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage({
                    type: 'PREVIEW_BLOCKS_DATA',
                    payload: blocks
                }, '*');
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [open, blocks]);

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ top: 20 }}
            bodyStyle={{ padding: 0, height: 'calc(100vh - 120px)' }}
            destroyOnClose
        >
            <div style={{ width: '100%', height: '100%', background: '#fff' }}>
                <iframe
                    ref={iframeRef}
                    // The main website runs on port 3000 locally
                    src="http://localhost:3000/preview" 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Live Preview"
                />
            </div>
        </Modal>
    );
}
