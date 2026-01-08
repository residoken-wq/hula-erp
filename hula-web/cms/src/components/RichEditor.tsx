'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamic import ReactQuill - CSS will be loaded via CDN in globals.css
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill');
        return RQ;
    },
    {
        ssr: false,
        loading: () => (
            <div style={{
                height: 300,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: '1px solid #d9d9d9',
            }}>
                Loading editor...
            </div>
        ),
    }
);

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
    ],
};

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
    return (
        <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={quillModules}
            placeholder={placeholder}
            style={{ height: 400, marginBottom: 50 }}
        />
    );
}
