import React from 'react';
import { Table, Select, Input, InputNumber, Tag } from 'antd';
import { MenuOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { getGoogleDriveImageUrl } from '../../utils/googleDrive';
import ImageLinkCell from './ImageLinkCell';

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

const DraggableRow = ({ children, ...props }: RowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        cursor: 'move',
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    return React.cloneElement(child as React.ReactElement, {
                        children: (
                            <div {...listeners} style={{ touchAction: 'none', cursor: 'grab' }}>
                                <MenuOutlined style={{ color: '#999' }} />
                            </div>
                        ),
                    });
                }
                return child;
            })}
        </tr>
    );
};

interface OrderItem {
    key: string;
    sku?: string;
    unit_price?: number;
    quantity?: number;
    total_price?: number;
    vat_content?: string;
    image_url?: string;
    product?: { image_url?: string };
    _description?: string;
    _type?: string;
}

interface Product {
    value: string;
    label: string;
    price: number;
    description?: string;
    type?: string;
    unit?: string;
}

interface Props {
    items: OrderItem[];
    products: Product[];
    isMobile: boolean;
    onItemChange: (index: number, field: string, value: any) => void;
    onRemoveItem: (index: number) => void;
    onReorder: (items: OrderItem[]) => void;
}

const SalesOrderItemsTable: React.FC<Props> = ({
    items,
    products,
    isMobile,
    onItemChange,
    onRemoveItem,
    onReorder,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
    );

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            const activeIndex = items.findIndex((i) => i.key === active.id);
            const overIndex = items.findIndex((i) => i.key === over?.id);
            const newItems = arrayMove(items, activeIndex, overIndex);
            onReorder(newItems);
        }
    };

    const itemColumns = [
        {
            key: 'sort',
            width: 30,
            render: () => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />,
        },
        {
            title: '#',
            dataIndex: 'position',
            width: 50,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Sản phẩm', width: 350,
            render: (_: any, record: any, index: number) => {
                const prodInfo = products.find(p => p.value === record.sku);
                const link = record.image_url;
                const finalLink = link || (record.product ? record.product.image_url : null);
                const src = getGoogleDriveImageUrl(finalLink);

                return (
                    <div>
                        <Select
                            showSearch
                            placeholder="Chọn SP"
                            optionFilterProp="label"
                            style={{ width: '100%' }}
                            value={record.sku}
                            onChange={(val) => onItemChange(index, 'sku', val)}
                            options={products}
                        />
                        {prodInfo && (
                            <div style={{ marginTop: 4, lineHeight: '1.4' }}>
                                {prodInfo.type === 'COMBO' && <Tag color="purple" style={{ fontSize: 10, marginRight: 4 }}><GiftOutlined /> Combo</Tag>}
                                <div style={{
                                    fontSize: 11,
                                    color: '#666',
                                    fontStyle: 'italic',
                                    whiteSpace: 'pre-wrap',  // Support newlines in description
                                    marginTop: prodInfo.type === 'COMBO' ? 4 : 0
                                }}>
                                    {prodInfo.description || 'Chưa có mô tả'}
                                </div>
                            </div>
                        )}
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {finalLink && (
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={src || ''}
                                        alt="img"
                                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #ddd' }}
                                        onClick={() => window.open(finalLink, '_blank')}
                                    />
                                </div>
                            )}
                            <ImageLinkCell
                                value={finalLink}
                                onChange={(newVal) => onItemChange(index, 'image_url', newVal)}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Mô tả VAT',
            dataIndex: 'vat_content',
            width: 200,
            render: (text: any, _: any, index: number) => (
                <Input.TextArea
                    rows={2}
                    placeholder="Mô tả HĐ..."
                    value={text}
                    onChange={(e) => onItemChange(index, 'vat_content', e.target.value)}
                />
            )
        },
        {
            title: 'Đơn giá', dataIndex: 'unit_price', width: 140,
            render: (text: any, record: any, index: number) => {
                const prod = products.find(p => p.value === record.sku);
                const basePrice = prod ? prod.price : 0;
                return (
                    <div>
                        {prod && (
                            <div style={{ fontSize: 10, color: '#999', marginBottom: 2, textAlign: 'right' }}>
                                Gốc: {basePrice.toLocaleString()}
                            </div>
                        )}
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            value={text}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(displayVal) => displayVal!.replace(/\$\s?|(,*)/g, '')}
                            onChange={(val) => onItemChange(index, 'unit_price', val)}
                        />
                    </div>
                );
            }
        },
        {
            title: 'SL', dataIndex: 'quantity', width: 80,
            render: (text: any, _: any, index: number) => (
                <InputNumber min={1} value={text} onChange={(val) => onItemChange(index, 'quantity', val)} style={{ width: '100%' }} />
            )
        },
        {
            title: 'Tiền', dataIndex: 'total_price', align: 'right' as const, width: 140,
            render: (val: any) => <b>{Number(val).toLocaleString()}</b>
        },
        {
            title: '', width: 50, align: 'center' as const,
            render: (_: any, __: any, index: number) => <DeleteOutlined onClick={() => onRemoveItem(index)} style={{ color: 'red', cursor: 'pointer' }} />
        }
    ];

    return (
        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
                <div style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
                    <Table
                        components={{
                            body: {
                                row: DraggableRow,
                            },
                        }}
                        dataSource={items}
                        columns={itemColumns}
                        pagination={false}
                        rowKey="key"
                        size="small"
                        bordered
                        scroll={isMobile ? { x: 800 } : undefined}
                    />
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default SalesOrderItemsTable;
