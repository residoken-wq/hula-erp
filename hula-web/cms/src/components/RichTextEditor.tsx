'use client';

import { useEffect, useRef, useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
}

// Custom Upload Adapter — uploads images via /api/upload/image
class HulaUploadAdapter {
    private loader: any;
    private xhr?: XMLHttpRequest;

    constructor(loader: any) {
        this.loader = loader;
    }

    upload(): Promise<{ default: string }> {
        return this.loader.file.then((file: File) => new Promise<{ default: string }>((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

            this.xhr = new XMLHttpRequest();
            this.xhr.open('POST', `${baseUrl}/upload/image`, true);
            if (token) {
                this.xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            this.xhr.upload.addEventListener('progress', (evt) => {
                if (evt.lengthComputable) {
                    this.loader.uploadTotal = evt.total;
                    this.loader.uploaded = evt.loaded;
                }
            });

            this.xhr.addEventListener('load', () => {
                if (!this.xhr) return;
                if (this.xhr.status >= 200 && this.xhr.status < 300) {
                    try {
                        const response = JSON.parse(this.xhr.responseText);
                        resolve({ default: response.url || response.path || response.data?.url || '' });
                    } catch {
                        reject('Invalid server response.');
                    }
                } else {
                    reject(`Upload failed with status ${this.xhr.status}`);
                }
            });

            this.xhr.addEventListener('error', () => reject('Upload failed due to network error.'));
            this.xhr.addEventListener('abort', () => reject('Upload aborted.'));

            this.xhr.send(formData);
        }));
    }

    abort() {
        if (this.xhr) {
            this.xhr.abort();
        }
    }
}

function HulaUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new HulaUploadAdapter(loader);
    };
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Nhập nội dung...',
    minHeight = 400
}: RichTextEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        setIsLayoutReady(true);
        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        if (!isLayoutReady || !editorContainerRef.current) return;

        let editorInstance: any = null;

        const initEditor = async () => {
            try {
                // Dynamic import CKEditor to avoid SSR issues
                const { ClassicEditor, Essentials, Paragraph, Bold, Italic, Underline,
                    Heading, Link, List, Table, TableToolbar, Alignment,
                    BlockQuote, Indent, IndentBlock, Image, ImageUpload,
                    ImageResize, ImageToolbar, ImageCaption, ImageInsert,
                    MediaEmbed, HtmlEmbed, SourceEditing, GeneralHtmlSupport } = await import('ckeditor5');

                if (editorRef.current) return; // Already initialized

                editorInstance = await ClassicEditor.create(editorContainerRef.current!, {
                    plugins: [
                        Essentials, Paragraph, Bold, Italic, Underline,
                        Heading, Link, List, Table, TableToolbar, Alignment,
                        BlockQuote, Indent, IndentBlock,
                        Image, ImageUpload, ImageResize, ImageToolbar, ImageCaption, ImageInsert,
                        MediaEmbed, HtmlEmbed, SourceEditing, GeneralHtmlSupport
                    ],
                    extraPlugins: [HulaUploadAdapterPlugin],
                    toolbar: {
                        items: [
                            'heading', '|',
                            'bold', 'italic', 'underline', '|',
                            'link', 'blockQuote', '|',
                            'bulletedList', 'numberedList', '|',
                            'outdent', 'indent', '|',
                            'alignment', '|',
                            'insertImage', 'insertTable', 'mediaEmbed', 'htmlEmbed', '|',
                            'sourceEditing', '|',
                            'undo', 'redo'
                        ],
                        shouldNotGroupWhenFull: false
                    },
                    heading: {
                        options: [
                            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                            { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                            { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                            { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                        ]
                    },
                    image: {
                        toolbar: ['imageTextAlternative', '|', 'imageResize'],
                        resizeOptions: [
                            { name: 'resizeImage:original', value: null, label: 'Original' },
                            { name: 'resizeImage:50', value: '50', label: '50%' },
                            { name: 'resizeImage:75', value: '75', label: '75%' },
                        ],
                    },
                    table: {
                        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                    },
                    htmlSupport: {
                        allow: [
                            { name: /.*/, attributes: true, classes: true, styles: true }
                        ]
                    },
                    placeholder: placeholder
                });

                editorRef.current = editorInstance;

                // Set initial content
                if (value) {
                    editorInstance.setData(value);
                }

                // Listen for changes
                editorInstance.model.document.on('change:data', () => {
                    const data = editorInstance.getData();
                    onChange(data);
                });

            } catch (error) {
                console.error('Failed to initialize CKEditor:', error);
            }
        };

        initEditor();

        return () => {
            if (editorRef.current) {
                editorRef.current.destroy().catch((error: any) => {
                    console.error('Failed to destroy CKEditor:', error);
                });
                editorRef.current = null;
            }
        };
    }, [isLayoutReady]);

    // Update content when value prop changes
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.getData()) {
            editorRef.current.setData(value || '');
        }
    }, [value]);

    return (
        <div className="ckeditor-wrapper">
            <div
                ref={editorContainerRef}
                style={{ minHeight: `${minHeight}px` }}
            />
            <style jsx global>{`
                .ck-editor__editable {
                    min-height: ${minHeight}px !important;
                }
                .ck-editor__editable:focus {
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
                }
                .ck.ck-toolbar {
                    border-radius: 8px 8px 0 0 !important;
                    background: #f8fafc !important;
                }
                .ck.ck-editor__main > .ck-editor__editable {
                    border-radius: 0 0 8px 8px !important;
                }
                .ck.ck-editor {
                    border-radius: 8px !important;
                }
            `}</style>
        </div>
    );
}
