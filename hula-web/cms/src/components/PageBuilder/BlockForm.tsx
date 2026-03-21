import React from 'react';
import { Input, Button, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import ImageUploader from '@/components/ImageUploader';
import { BlockType } from './types';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface BlockFormProps {
    type: BlockType;
    data: any;
    onChange: (data: any) => void;
}

export default function BlockForm({ type, data, onChange }: BlockFormProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...data, [key]: value });
    };

    switch (type) {
        case 'RICH_TEXT':
            return (
                <RichTextEditor
                    value={data.content || ''}
                    onChange={(val: string) => handleChange('content', val)}
                    minHeight={250}
                />
            );
        case 'HERO_BANNER':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input placeholder="Tiêu đề Hero..." value={data.title} onChange={e => handleChange('title', e.target.value)} />
                    <Input.TextArea rows={2} placeholder="Mô tả..." value={data.description} onChange={e => handleChange('description', e.target.value)} />
                    <div>
                        <ImageUploader 
                            simple 
                            hint="Ảnh nền Hero (1920x600px)" 
                            value={data.image_url} 
                            onChange={(url) => handleChange('image_url', url)} 
                        />
                    </div>
                </div>
            );
        case 'IMAGE_GALLERY':
            const urls = data.images || [];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input placeholder="Tiêu đề Gallery (Tùy chọn)" value={data.title} onChange={e => handleChange('title', e.target.value)} />
                    {urls.map((url: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <ImageUploader simple value={url} onChange={(newUrl) => {
                                    const newUrls = [...urls];
                                    newUrls[idx] = newUrl;
                                    handleChange('images', newUrls);
                                }} />
                            </div>
                            <Button danger onClick={() => handleChange('images', urls.filter((_: any, i: number) => i !== idx))}><DeleteOutlined/></Button>
                        </div>
                    ))}
                    <Button onClick={() => handleChange('images', [...urls, ''])} icon={<PlusOutlined/>}>Thêm ảnh</Button>
                </div>
            );
        case 'TWO_COLUMN_TEXT_IMAGE':
            return (
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Select 
                            value={data.imagePosition || 'right'} 
                            onChange={v => handleChange('imagePosition', v)}
                            options={[{label: 'Ảnh nằm Phải', value: 'right'}, {label: 'Ảnh nằm Trái', value: 'left'}]}
                        />
                        <Input placeholder="Tiêu đề khối" value={data.title} onChange={e => handleChange('title', e.target.value)} />
                        <RichTextEditor
                            value={data.content || ''}
                            onChange={(val: string) => handleChange('content', val)}
                            minHeight={200}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <ImageUploader simple value={data.image_url} onChange={(url) => handleChange('image_url', url)} hint="Hình ảnh hiển thị" />
                    </div>
                </div>
            );
        case 'STATS_GRID':
            const items = data.items || [];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((item: any, idx: number) => (
                         <div key={idx} style={{ display: 'flex', gap: 8 }}>
                             <Input placeholder="Icon/Emoji (VD: 📊)" value={item.icon} onChange={e => {
                                 const newItems = [...items]; newItems[idx].icon = e.target.value; handleChange('items', newItems);
                             }} style={{ width: 140 }} />
                             <Input placeholder="Số liệu (VD: 10+)" value={item.number} onChange={e => {
                                 const newItems = [...items]; newItems[idx].number = e.target.value; handleChange('items', newItems);
                             }} style={{ width: 140 }} />
                             <Input placeholder="Mô tả" value={item.label} onChange={e => {
                                 const newItems = [...items]; newItems[idx].label = e.target.value; handleChange('items', newItems);
                             }} />
                             <Button danger onClick={() => handleChange('items', items.filter((_: any, i: number) => i !== idx))}><DeleteOutlined/></Button>
                         </div>
                    ))}
                    <Button onClick={() => handleChange('items', [...items, { icon: '', number: '', label: '' }])} icon={<PlusOutlined/>}>Thêm số liệu</Button>
                </div>
            );
        case 'VIDEO_EMBED':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input placeholder="Link Youtube/Vimeo..." value={data.video_url} onChange={e => handleChange('video_url', e.target.value)} />
                    <Input placeholder="Mô tả phụ cho video (Tùy chọn)" value={data.caption} onChange={e => handleChange('caption', e.target.value)} />
                </div>
            );
        case 'CALL_TO_ACTION':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input placeholder="Tiêu đề Kêu gọi..." value={data.title} onChange={e => handleChange('title', e.target.value)} />
                    <Input.TextArea placeholder="Mô tả giải thích..." value={data.description} onChange={e => handleChange('description', e.target.value)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Input placeholder="Tên Nút (VD: Đăng ký ngay)" value={data.buttonText} onChange={e => handleChange('buttonText', e.target.value)} />
                        <Input placeholder="Link đến (VD: /lien-he)" value={data.buttonUrl} onChange={e => handleChange('buttonUrl', e.target.value)} />
                    </div>
                </div>
            );
        case 'RELATED_PRODUCTS':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     <Input placeholder="Tiêu đề khối (VD: Sản phẩm liên quan)" value={data.title} onChange={e => handleChange('title', e.target.value)} />
                     <p style={{ color: '#888', fontSize: 13, margin: 0 }}>Hệ thống tự động hiển thị sản phẩm liên quan từ cơ sở dữ liệu trên website.</p>
                </div>
            );
        case 'TEAM_MEMBERS':
            const members = data.members || [];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     <Input placeholder="Tiêu đề khối (VD: Đội ngũ của chúng tôi)" value={data.title} onChange={e => handleChange('title', e.target.value)} />
                     {members.map((member: any, idx: number) => (
                         <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 12, background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8 }}>
                             <div style={{ width: 120 }}>
                                <ImageUploader simple value={member.image_url} onChange={(url) => {
                                    const newM = [...members]; newM[idx].image_url = url; handleChange('members', newM);
                                }} />
                             </div>
                             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                 <Input placeholder="Tên thành viên" value={member.name} onChange={e => {
                                     const newM = [...members]; newM[idx].name = e.target.value; handleChange('members', newM);
                                 }} />
                                 <Input placeholder="Chức vụ / Vị trí" value={member.role} onChange={e => {
                                     const newM = [...members]; newM[idx].role = e.target.value; handleChange('members', newM);
                                 }} />
                             </div>
                             <Button danger onClick={() => handleChange('members', members.filter((_: any, i: number) => i !== idx))}><DeleteOutlined/></Button>
                         </div>
                    ))}
                    <Button onClick={() => handleChange('members', [...members, { name: '', role: '', image_url: '' }])} icon={<PlusOutlined/>}>Thêm thành viên</Button>
                </div>
            );
        default:
            return <div>Chưa hỗ trợ config cho dạng block này.</div>;
    }
}
