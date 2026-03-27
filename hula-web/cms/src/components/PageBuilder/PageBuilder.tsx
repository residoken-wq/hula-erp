import React from 'react';
import { Button, Card, Dropdown, MenuProps, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UpOutlined, DownOutlined, DragOutlined, EyeOutlined } from '@ant-design/icons';
import BlockForm from './BlockForm';
import { BlockData, BlockType } from './types';

interface PageBuilderProps {
    value?: BlockData[];
    onChange?: (value: BlockData[]) => void;
    onPreview?: () => void;
}

const BLOCK_LABELS: Record<BlockType, string> = {
    RICH_TEXT: 'Bài viết (Rich Text)',
    HERO_BANNER: 'Hero Banner',
    IMAGE_GALLERY: 'Thư viện ảnh',
    TWO_COLUMN_TEXT_IMAGE: '2 Cột (Chữ & Ảnh)',
    STATS_GRID: 'Lưới số liệu',
    VIDEO_EMBED: 'Nhúng Video',
    CALL_TO_ACTION: 'Nút kêu gọi (CTA)',
    RELATED_PRODUCTS: 'Sản phẩm liên quan',
    TEAM_MEMBERS: 'Đội ngũ nhân sự',
};

export default function PageBuilder({ value = [], onChange, onPreview }: PageBuilderProps) {
    const safeValue = Array.isArray(value) ? value : [];

    const handleAddBlock = (type: BlockType) => {
        const newBlock: BlockData = {
            id: `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type,
            data: {}
        };
        onChange?.([...safeValue, newBlock]);
    };

    const handleRemoveBlock = (index: number) => {
        const newBlocks = [...safeValue];
        newBlocks.splice(index, 1);
        onChange?.(newBlocks);
    };

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === safeValue.length - 1) return;

        const newBlocks = [...safeValue];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[targetIndex];
        newBlocks[targetIndex] = temp;
        onChange?.(newBlocks);
    };

    const handleUpdateBlockData = (index: number, data: any) => {
        const newBlocks = [...safeValue];
        newBlocks[index] = { ...newBlocks[index], data };
        onChange?.(newBlocks);
    };

    const addMenuItems: MenuProps['items'] = Object.keys(BLOCK_LABELS).map((key) => ({
        key,
        label: BLOCK_LABELS[key as BlockType],
        onClick: () => handleAddBlock(key as BlockType)
    }));

    return (
        <div className="page-builder-container">
            {onPreview && (
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>Các Content Blocks</div>
                    <Button type="primary" icon={<EyeOutlined />} onClick={onPreview}>Xem trước (Live Preview)</Button>
                </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {safeValue.map((block, index) => (
                    <Card
                        key={block.id}
                        size="small"
                        title={<span><DragOutlined style={{ marginRight: 8, color: '#ccc' }} /> {BLOCK_LABELS[block.type] || block.type}</span>}
                        extra={
                            <Space>
                                <Button size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => handleMoveBlock(index, 'up')} />
                                <Button size="small" icon={<DownOutlined />} disabled={index === safeValue.length - 1} onClick={() => handleMoveBlock(index, 'down')} />
                                <Popconfirm title="Xóa block này?" onConfirm={() => handleRemoveBlock(index)}>
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Space>
                        }
                        style={{ borderLeft: '4px solid #1890ff', overflow: 'visible' }}
                        styles={{ body: { overflow: 'visible' } }}
                    >
                        <BlockForm 
                            type={block.type} 
                            data={block.data || {}} 
                            onChange={(data) => handleUpdateBlockData(index, data)} 
                        />
                    </Card>
                ))}

                {safeValue.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8 }}>
                        Chưa có nội dung nào. Bấm nút bên dưới để thêm Block đầu tiên.
                    </div>
                )}

                <Dropdown menu={{ items: addMenuItems }} trigger={['click']}>
                    <Button type="dashed" block icon={<PlusOutlined />} size="large">
                        Thêm Block Mới
                    </Button>
                </Dropdown>
            </div>
        </div>
    );
}
