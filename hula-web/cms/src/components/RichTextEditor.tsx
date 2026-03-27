'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal, Input, Button, Spin, Empty, message } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { uploadApi } from '@/lib/api';

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
}

// --- Helpers ---
const getApiBaseUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://erp.nemmamnon.com';
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
};

const resolveImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${getApiBaseUrl()}/api/upload/files/${url.replace('/uploads/', '')}`;
    return url;
};

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
                        const rawUrl = response.url || response.path || response.data?.url || '';
                        resolve({ default: resolveImageUrl(rawUrl) });
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
    
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Library state
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryFiles, setLibraryFiles] = useState<Array<{ name: string; url: string; size: number; modified: string }>>([]);
    const [librarySearch, setLibrarySearch] = useState('');

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
                    ui: {
                        viewportOffset: {
                            top: 56
                        }
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
                    if (onChangeRef.current) onChangeRef.current(data);
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
        if (editorRef.current) {
            const currentData = editorRef.current.getData();
            if (value !== currentData && value !== undefined) {
                // Check if focused to avoid layout shift while typing
                const isFocused = editorRef.current.editing.view.document.isFocused;
                if (!isFocused) {
                    editorRef.current.setData(value || '');
                }
            }
        }
    }, [value]);

    // --- Library functions ---
    const openLibrary = async () => {
        setLibraryOpen(true);
        setLibrarySearch('');
        try {
            setLibraryLoading(true);
            const res = await uploadApi.listFiles();
            setLibraryFiles(Array.isArray(res.data) ? res.data : []);
        } catch {
            message.error('Không thể tải thư viện hình ảnh');
            setLibraryFiles([]);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handlePickFromLibrary = (url: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const resolvedUrl = resolveImageUrl(url);
        editor.model.change((writer: any) => {
            const imageElement = writer.createElement('imageBlock', { src: resolvedUrl });
            editor.model.insertContent(imageElement);
        });

        setLibraryOpen(false);
        message.success('Đã chèn ảnh vào bài viết');
    };

    const filteredLibraryFiles = libraryFiles.filter(f =>
        (f?.name || '').toLowerCase().includes(librarySearch.trim().toLowerCase())
    );

    return (
        <div className="ckeditor-wrapper" style={{ position: 'relative' }}>
            {/* Floated Library button over the right side of the sticky toolbar */}
            <div style={{ position: 'sticky', top: 56, zIndex: 101, display: 'flex', justifyContent: 'flex-end', width: '100%', height: 0, overflow: 'visible', pointerEvents: 'none' }}>
                <Button
                    icon={<PictureOutlined />}
                    onClick={openLibrary}
                    type="primary"
                    style={{ marginRight: 12, marginTop: 6, pointerEvents: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                >
                    Chọn từ thư viện
                </Button>
            </div>

            <div
                ref={editorContainerRef}
                style={{ minHeight: `${minHeight}px` }}
            />

            {/* Library Modal */}
            <Modal
                open={libraryOpen}
                onCancel={() => setLibraryOpen(false)}
                footer={null}
                width={900}
                title="Chọn ảnh từ thư viện"
                destroyOnClose
            >
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <Input
                        placeholder="Tìm theo tên file..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        allowClear
                    />
                    <Button onClick={openLibrary} loading={libraryLoading}>
                        Tải lại
                    </Button>
                </div>

                {libraryLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Spin />
                    </div>
                ) : filteredLibraryFiles.length === 0 ? (
                    <Empty description={libraryFiles.length === 0 ? 'Chưa có hình ảnh trong thư viện' : 'Không tìm thấy'} />
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: 12,
                            maxHeight: '60vh',
                            overflow: 'auto',
                            paddingRight: 4,
                        }}
                    >
                        {filteredLibraryFiles.map((f) => (
                            <div
                                key={f.name}
                                onClick={() => handlePickFromLibrary(f.url)}
                                style={{
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: '#fafafa',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    (e.currentTarget as HTMLElement).style.transform = 'none';
                                }}
                                title={f.name}
                            >
                                <div style={{ width: '100%', aspectRatio: '1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src={resolveImageUrl(f.url)}
                                        alt={f.name}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ccc" font-size="40">🖼️</text></svg>';
                                        }}
                                    />
                                </div>
                                <div style={{ padding: '6px 10px', fontSize: 12, color: '#555' }}>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            <style jsx global>{`
                .ck-editor__editable {
                    min-height: ${minHeight}px !important;
                }
                .ck-editor__editable:focus {
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
                }
                /* Force sticky positioning to work by overriding parent overflows */
                .ck.ck-editor__top {
                    position: sticky !important;
                    top: 56px !important;
                    z-index: 100 !important;
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
                /* Ant Design Pro Layout fixes for sticky */
                .page-builder-container, 
                .ant-pro-page-container,
                .ant-layout-content,
                .ant-pro-grid-content,
                .ant-pro-layout-content,
                .ant-pro-basicLayout-content,
                .ckeditor-wrapper,
                .ckeditor-wrapper .ant-form-item-control-input,
                .ckeditor-wrapper .ant-form-item-control-input-content {
                    /* Unset overflows so CSS position: sticky can propagate up to the main scroller */
                    overflow: visible !important;
                    overflow-x: visible !important;
                    overflow-y: visible !important;
                }
                .ant-card, .ant-card-body {
                    overflow: visible !important;
                }
                /* Override global resets for Editor Content */
                .ck-content ul, .ck-content ul li {
                    list-style-type: disc !important;
                }
                .ck-content ol, .ck-content ol li {
                    list-style-type: decimal !important;
                }
                .ck-content ul, .ck-content ol {
                    padding-left: 2em !important;
                    margin-bottom: 1em !important;
                }
                .ck-content li {
                    margin-bottom: 0.25em !important;
                }
                .ck-content h2, .ck-content h3, .ck-content h4 {
                    margin-top: 1em !important;
                    margin-bottom: 0.5em !important;
                }
                .ck-content p {
                    margin-bottom: 1em !important;
                }
            `}</style>
        </div>
    );
}
