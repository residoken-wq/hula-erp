import React, { useState, useEffect, useRef } from 'react';
import { Steps, Card, Table, Button, Select, InputNumber, Row, Col, Space, message, Upload, Divider, Switch, Tabs, Input, Tag, Alert, Modal, List } from 'antd';
import { UploadOutlined, FilePdfOutlined, FileImageOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, CopyOutlined } from '@ant-design/icons';
import { Stage, Layer, Rect as KonvaRect, Image as KonvaImage, Transformer, Group, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import jsPDF from 'jspdf';
import api from '../../utils/api';
import { packMultipleBins, Bin, Rect, BinResult } from '../../utils/binPacking';

const { Step } = Steps;

// A custom component to handle image loading in Konva
const URLImage = ({ image, x, y, width, height, isSelected, onSelect, onChange }: any) => {
    const [img, setImg] = useState<HTMLImageElement | undefined>(undefined);
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    useEffect(() => {
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous';
        imageObj.src = image;
        imageObj.onload = () => {
            setImg(imageObj);
        };
    }, [image]);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, img]);

    if (!img) return null;

    return (
        <React.Fragment>
            <KonvaImage
                image={img}
                x={x}
                y={y}
                width={width}
                height={height}
                ref={shapeRef}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange({
                        ...image,
                        x: e.target.x(),
                        y: e.target.y()
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...image,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY)
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 10 || newBox.height < 10) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};

// --- Step 3 Interactive Rect Component ---
const DraggableRect = ({ rect, scale, face, isSelected, onSelect, onChange }: any) => {
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <React.Fragment>
            <Group
                ref={shapeRef}
                x={(rect.x || 0) * scale}
                y={(rect.y || 0) * scale}
                rotation={rect.rotation !== undefined ? rect.rotation : (rect.rotated ? -90 : 0)}
                offsetX={0}
                offsetY={rect.rotated ? rect.w * scale : 0}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange({
                        ...rect,
                        x: e.target.x() / scale,
                        y: e.target.y() / scale
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    onChange({
                        ...rect,
                        x: node.x() / scale,
                        y: node.y() / scale,
                        rotation: node.rotation()
                    });
                }}
            >
                <KonvaRect
                    width={(rect.rotated ? rect.h : rect.w) * scale}
                    height={(rect.rotated ? rect.w : rect.h) * scale}
                    fill={rect.data?.color || '#e6f7ff'}
                    stroke="#000"
                    strokeWidth={1}
                />
                <KonvaText 
                    text={rect.data?.name || `${rect.w}x${rect.h}`} 
                    fontSize={12} 
                    fill="#333" 
                    x={4} y={4} 
                />
                {rect.data?.logoConfig?.width > 0 && (
                    <Group
                        x={rect.data.logoConfig.x / face.pieceSize.w * (rect.rotated ? rect.h : rect.w) * scale || 0}
                        y={rect.data.logoConfig.y / face.pieceSize.h * (rect.rotated ? rect.w : rect.h) * scale || 0}
                    >
                        <KonvaRect 
                            width={rect.data.logoConfig.width / face.pieceSize.w * (rect.rotated ? rect.h : rect.w) * scale || 0}
                            height={rect.data.logoConfig.height / face.pieceSize.h * (rect.rotated ? rect.w : rect.h) * scale || 0}
                            fill="rgba(255,0,0,0.3)"
                            stroke="red"
                            strokeWidth={1}
                        />
                        <KonvaText text="LOGO" fontSize={10} fill="red" />
                    </Group>
                )}
            </Group>
            {isSelected && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={true}
                    resizeEnabled={false} // Chỉ cho phép xoay
                />
            )}
        </React.Fragment>
    );
};

const RulerLayer = ({ width, height, scale }: { width: number, height: number, scale: number }) => {
    const ticksX = [];
    for(let i=0; i<=width; i+=50) {
        ticksX.push(<KonvaRect key={`x${i}`} x={i * scale} y={0} width={1} height={10} fill="red" />);
        ticksX.push(<KonvaText key={`xt${i}`} x={i * scale + 2} y={12} text={`${i}cm`} fontSize={12} fill="red" />);
    }
    const ticksY = [];
    for(let i=0; i<=height; i+=50) {
        if (i === 0) continue;
        ticksY.push(<KonvaRect key={`y${i}`} x={0} y={i * scale} width={10} height={1} fill="red" />);
        ticksY.push(<KonvaText key={`yt${i}`} x={12} y={i * scale + 2} text={`${i}cm`} fontSize={12} fill="red" />);
    }

    return (
        <Layer>
            {ticksX}
            {ticksY}
        </Layer>
    );
};

const UnifiedDesignWorkflow: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);

    // --- Step 1 Data ---
    const [poList, setPoList] = useState<any[]>([]);
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loadingPo, setLoadingPo] = useState(false);

    // --- Copy Design Modal Data ---
    const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
    const [savedDesigns, setSavedDesigns] = useState<any[]>([]);

    useEffect(() => {
        if (isCopyModalVisible) {
            fetchSavedDesigns();
        }
    }, [isCopyModalVisible]);

    const fetchSavedDesigns = async () => {
        try {
            const res = await api.get('/designs/print-designs');
            setSavedDesigns(res.data);
        } catch (e) {
            message.error('Lỗi lấy danh sách sơ đồ');
        }
    };

    const handleCopyDesign = (design: any) => {
        if (design.tech_pack && design.tech_pack.faces) {
            setFaces(design.tech_pack.faces);
            setBinsByFace(design.tech_pack.binsByFace || { 'face-1': [{ w: 400, h: 120 }] });
            setPadding(design.tech_pack.padding ?? 2);
            setAllowRotation(design.tech_pack.allowRotation ?? true);
            if (design.tech_pack.resultsByFace) {
                setResultsByFace(design.tech_pack.resultsByFace);
            }
            message.success(`Đã sao chép cấu hình từ: ${design.name}`);
            setIsCopyModalVisible(false);
        } else {
            message.warning('Sơ đồ này không có dữ liệu cấu hình hợp lệ');
        }
    };

    const handleSaveDesign = async () => {
        if (!selectedItem) {
            message.warning('Chưa chọn sản phẩm!');
            return;
        }
        
        try {
            const dataToSave = {
                code: `SD-${Date.now()}`,
                name: `Sơ đồ ${selectedItem.product?.name || selectedItem.material?.name || 'Sản phẩm'}`,
                type: 'PRINT',
                product_id: selectedItem.product?.id,
                customer_id: selectedPo?.plan?.sales_orders?.[0]?.customer_id || selectedPo?.customer_id || null,
                tech_pack: {
                    faces,
                    binsByFace,
                    padding,
                    allowRotation,
                    resultsByFace
                }
            };
            await api.post('/designs/print-designs', dataToSave);
            message.success('Đã lưu sơ đồ vào hệ thống!');
        } catch (e) {
            console.error(e);
            message.error('Lỗi khi lưu sơ đồ');
        }
    };

    // --- Step 2 Data: Multi-Face Support ---
    const [faces, setFaces] = useState<any[]>([
        { id: 'face-1', name: 'Mặt trước', pieceSize: { w: 50, h: 40 }, bgColor: '#e6f7ff', logoUrl: null, processedLogoUrl: null, removeTolerance: 240, logoColor: 'original', logoConfig: { x: 10, y: 10, width: 20, height: 20 }, selectedId: null }
    ]);
    const [activeFaceKey, setActiveFaceKey] = useState('face-1');

    // --- Step 3 Data: Multi-Bin per Face ---
    const [binsByFace, setBinsByFace] = useState<Record<string, Bin[]>>({
        'face-1': [{ w: 400, h: 120 }]
    });
    const [resultsByFace, setResultsByFace] = useState<Record<string, { binResults: BinResult[], unpacked: Rect[] }>>({});
    
    const [padding, setPadding] = useState(2);
    const [allowRotation, setAllowRotation] = useState(true);
    const stageRefs = useRef<Record<string, any[]>>({}); // Refs for multiple canvases mapped by faceId

    const [selectedPiece, setSelectedPiece] = useState<{faceId: string, binIdx: number, rectId: string} | null>(null);
    const [customPiece, setCustomPiece] = useState({ name: 'Túi hông', w: 10, h: 10, color: '#ffec3d' });

    const handleAddCustomPiece = (faceId: string, binIdx: number) => {
        const newResults = {...resultsByFace};
        const packed = newResults[faceId].binResults[binIdx].packed;
        packed.push({
            id: `custom-${Date.now()}`,
            x: 0,
            y: 0,
            w: customPiece.w,
            h: customPiece.h,
            rotated: false,
            data: {
                color: customPiece.color,
                name: customPiece.name,
                logoConfig: { width: 0, height: 0, x:0, y:0 }
            }
        });
        setResultsByFace(newResults);
        message.success('Đã thêm chi tiết phụ vào Sơ đồ');
    };

    useEffect(() => {
        fetchPOs();
    }, []);

    const fetchPOs = async () => {
        setLoadingPo(true);
        try {
            const res = await api.get('/purchasing');
            const data = Array.isArray(res.data) ? res.data : [];
            const isRelevantItem = (item: any) => {
                const name = (item.description || item.product?.name || item.material?.name || '').toLowerCase();
                return name.includes('gia công in') || name.includes('gia công may') || name.includes('gia công thêu') || name.includes('gia công cắt');
            };

            const filtered = data.filter((po: any) => 
                po.type === 'OUTSOURCING' && 
                ['DRAFT', 'ORDERED', 'SENT', 'CONFIRMED'].includes(po.status) &&
                po.items && po.items.some(isRelevantItem)
            );
            setPoList(filtered);
        } catch (e) {
            message.error('Lỗi tải danh sách PO');
        }
        setLoadingPo(false);
    };

    const handleUpload = async (options: any, faceId: string) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            updateFace(faceId, { logoUrl: res.data.url });
            onSuccess(res.data.url);
            message.success('Tải logo thành công');
        } catch (e) {
            onError(e);
            message.error('Lỗi tải logo');
        }
    };

    const updateFace = (id: string, updates: any) => {
        setFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    // Background removal logic
    const processImage = (imgUrl: string, tolerance: number, colorMode: string, faceId: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r >= tolerance && g >= tolerance && b >= tolerance) {
                    data[i + 3] = 0;
                } else if (data[i + 3] > 0) {
                    if (colorMode === 'white') {
                        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
                    } else if (colorMode === 'black') {
                        data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const processedUrl = URL.createObjectURL(blob);
                    updateFace(faceId, { processedLogoUrl: processedUrl });
                }
            }, 'image/png');
        };
        img.src = imgUrl;
    };

    useEffect(() => {
        faces.forEach(face => {
            if (face.logoUrl) {
                // We re-run processImage if tolerance/color changes.
                // In a real app we'd debounce or check if it actually changed, but it's okay for now.
                processImage(face.logoUrl, face.removeTolerance || 240, face.logoColor || 'original', face.id);
            }
        });
    }, [faces.map(f => f.logoUrl).join(','), faces.map(f => f.removeTolerance).join(','), faces.map(f => f.logoColor).join(',')]);

    const handleAddFace = () => {
        const newId = `face-${Date.now()}`;
        setFaces([...faces, { id: newId, name: `Mặt vải ${faces.length + 1}`, pieceSize: { w: 50, h: 40 }, bgColor: '#fff7e6', logoUrl: null, processedLogoUrl: null, removeTolerance: 240, logoColor: 'original', logoConfig: { x: 10, y: 10, width: 20, height: 20 }, selectedId: null }]);
        setBinsByFace({ ...binsByFace, [newId]: [{ w: 400, h: 120 }] });
        setActiveFaceKey(newId);
    };

    const handleRemoveFace = (id: string) => {
        if (faces.length === 1) return;
        const newFaces = faces.filter(f => f.id !== id);
        setFaces(newFaces);
        setActiveFaceKey(newFaces[0].id);
    };

    const handleNext = () => {
        if (currentStep === 0 && !selectedItem) {
            message.warning('Vui lòng chọn 1 sản phẩm trong đơn gia công!');
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleAddBin = (faceId: string) => {
        const currentBins = binsByFace[faceId] || [];
        setBinsByFace({ ...binsByFace, [faceId]: [...currentBins, { w: 400, h: 120 }] });
    };

    const handleRemoveBin = (faceId: string, index: number) => {
        const currentBins = [...(binsByFace[faceId] || [])];
        currentBins.splice(index, 1);
        setBinsByFace({ ...binsByFace, [faceId]: currentBins });
    };

    const handleBinChange = (faceId: string, index: number, field: string, value: number) => {
        const currentBins = [...(binsByFace[faceId] || [])];
        currentBins[index] = { ...currentBins[index], [field]: value };
        setBinsByFace({ ...binsByFace, [faceId]: currentBins });
    };

    const handleAutoPack = () => {
        if (!selectedItem) return;
        const quantity = selectedItem.quantity || 1;
        const newResults: Record<string, any> = {};
        let hasUnpacked = false;

        faces.forEach(face => {
            const rects: Rect[] = [];
            for (let i = 0; i < quantity; i++) {
                rects.push({
                    id: `P-${face.id}-${i}`,
                    w: face.pieceSize.w,
                    h: face.pieceSize.h,
                    data: { color: face.bgColor, logoUrl: face.logoUrl, logoConfig: face.logoConfig }
                });
            }

            const bins = binsByFace[face.id] || [];
            const result = packMultipleBins(bins, rects, padding, allowRotation);
            newResults[face.id] = result;
            if (result.unpacked.length > 0) hasUnpacked = true;
        });

        setResultsByFace(newResults);

        if (hasUnpacked) {
            message.warning(`Cảnh báo: Có mảnh chưa xếp được do thiếu diện tích vải. Vui lòng kiểm tra các mặt!`);
        } else {
            message.success('Xếp sơ đồ cho tất cả các mặt hoàn tất!');
        }
    };

    const exportToPNG = () => {
        Object.keys(stageRefs.current).forEach(faceId => {
            const faceName = faces.find(f => f.id === faceId)?.name || faceId;
            const stages = stageRefs.current[faceId] || [];
            stages.forEach((stage, idx) => {
                if (stage) {
                    const uri = stage.toDataURL({ pixelRatio: 2 });
                    const link = document.createElement('a');
                    link.download = `Sodo_${faceName}_Tam_${idx + 1}.png`;
                    link.href = uri;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
        });
    };

    const exportToPDF = () => {
        const pdf = new jsPDF('l', 'px', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        let isFirstPage = true;

        Object.keys(stageRefs.current).forEach(faceId => {
            const faceName = faces.find(f => f.id === faceId)?.name || faceId;
            const stages = stageRefs.current[faceId] || [];
            
            stages.forEach((stage, idx) => {
                if (stage) {
                    if (!isFirstPage) pdf.addPage();
                    isFirstPage = false;
                    
                    const canvas = stage.toCanvas();
                    const imgData = canvas.toDataURL('image/png');
                    
                    const canvasW = canvas.width;
                    const canvasH = canvas.height;
                    const ratio = Math.min(pdfWidth / canvasW, pdfHeight / canvasH);
                    
                    const w = canvasW * ratio;
                    const h = canvasH * ratio;
                    const x = (pdfWidth - w) / 2;
                    const y = (pdfHeight - h) / 2;

                    pdf.addImage(imgData, 'PNG', x, y, w, h);
                    pdf.text(`Sơ đồ: ${faceName} - Tấm ${idx + 1}`, 20, 20);
                }
            });
        });

        pdf.save(`SoDo_PO_${selectedPo?.po_code || 'Export'}.pdf`);
    };

    // --- RENDER STEPS ---
    const renderStep1 = () => {
        const expandedRowRender = (po: any) => {
            const items = po.items.filter((item: any) => {
                const name = (item.description || item.product?.name || item.material?.name || '').toLowerCase();
                return name.includes('gia công in') || name.includes('gia công may') || name.includes('gia công thêu') || name.includes('gia công cắt');
            });
            
            const columns = [
                { title: 'Tên Sản phẩm / Mã hàng', dataIndex: 'description', render: (t: any, r: any) => r.product?.name || r.material?.name || t },
                { title: 'Số lượng yêu cầu', dataIndex: 'quantity', render: (v: any) => <b>{v}</b> },
                { title: 'Trạng thái', render: (r: any) => {
                     const name = (r.description || r.product?.name || r.material?.name || '').toLowerCase();
                     if (name.includes('gia công may')) return <Tag color="default">Không cần Sơ đồ</Tag>;
                     return r.print_design ? <Tag color="success">Đã làm Sơ đồ</Tag> : <Tag color="warning">Chưa làm</Tag>;
                }},
                { title: 'Ghi chú', dataIndex: 'note' },
                {
                    title: 'Thao tác', render: (r: any) => {
                        const name = (r.description || r.product?.name || r.material?.name || '').toLowerCase();
                        const isMay = name.includes('gia công may');
                        return (
                            <Button
                                type={selectedItem?.id === r.id ? 'primary' : 'default'}
                                onClick={() => {
                                    setSelectedPo(po);
                                    setSelectedItem(r);
                                }}
                                disabled={isMay}
                            >
                                Chọn để làm Sơ đồ
                            </Button>
                        )
                    }
                }
            ];
            return <Table columns={columns} dataSource={items} pagination={false} rowKey="id" size="small" />;
        };

        const poColumns = [
            { title: 'Mã PO', dataIndex: 'po_code', render: (t: any, r: any) => <b>{t}</b> },
            { title: 'Khách hàng', render: (r: any) => {
                const customerName = r.plan?.sales_orders?.length > 0 
                    ? Array.from(new Set(r.plan.sales_orders.map((so: any) => so?.customer?.name || so?.customer_name).filter(Boolean))).join(', ') 
                    : '';
                return customerName || '-';
            }},
            { title: 'Nhà GC', dataIndex: ['supplier', 'name'] },
            { title: 'Trạng thái', dataIndex: 'status', render: (t: string) => <Tag color="blue">{t}</Tag> },
            { title: 'Tiến độ Sơ đồ', render: (r: any) => {
                const items = r.items || [];
                let total = 0;
                let done = 0;
                items.forEach((item: any) => {
                     const name = (item.description || item.product?.name || item.material?.name || '').toLowerCase();
                     if (name.includes('gia công in') || name.includes('gia công thêu') || name.includes('gia công cắt')) {
                         total++;
                         if (item.print_design) done++;
                     }
                });
                if (total === 0) return <span style={{ color: '#aaa' }}>-</span>;
                return <span style={{ fontWeight: 'bold', color: done === total ? '#52c41a' : '#fa8c16' }}>{done}/{total}</span>;
            }}
        ];

        return (
            <div>
                <Table 
                    columns={poColumns} 
                    dataSource={poList} 
                    rowKey="id" 
                    expandable={{ expandedRowRender, defaultExpandAllRows: false }}
                    loading={loadingPo}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        );
    };

    const renderStep2 = () => {
        const SCALE = 5;

        return (
            <div>
                {selectedItem && (
                    <Alert 
                        message={<b>Sản phẩm: {selectedItem.product?.name || selectedItem.material?.name || selectedItem.description}</b>} 
                        description={<span>Mã SKU / Mã hàng: <b>{selectedItem.product?.sku || selectedItem.material?.code || '-'}</b></span>} 
                        type="info" 
                        showIcon 
                        style={{ marginBottom: 16 }} 
                    />
                )}
                <div style={{ marginBottom: 16 }}>
                    <Space>
                        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddFace}>Thêm Mặt Vải / Chi tiết</Button>
                        <Button type="primary" ghost icon={<CopyOutlined />} onClick={() => setIsCopyModalVisible(true)}>Sao chép từ Sơ đồ mẫu</Button>
                    </Space>
                </div>
                <Tabs type="card" activeKey={activeFaceKey} onChange={setActiveFaceKey}>
                    {faces.map(face => (
                        <Tabs.TabPane tab={face.name} key={face.id}>
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Card title="Thông số (1 mảnh)" extra={faces.length > 1 && <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveFace(face.id)} />}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                                <label>Tên Mặt/Vải:</label>
                                                <input className="ant-input" value={face.name} onChange={e => updateFace(face.id, { name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label>Kích thước Dài (cm):</label>
                                                <InputNumber style={{ width: '100%' }} value={face.pieceSize.w} onChange={v => updateFace(face.id, { pieceSize: { ...face.pieceSize, w: v || 50 } })} />
                                            </div>
                                            <div>
                                                <label>Kích thước Rộng/Cao (cm):</label>
                                                <InputNumber style={{ width: '100%' }} value={face.pieceSize.h} onChange={v => updateFace(face.id, { pieceSize: { ...face.pieceSize, h: v || 40 } })} />
                                            </div>
                                            <div>
                                                <label>Màu nền (Branding/Hex):</label>
                                                <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                                                    <input type="color" style={{ width: 40, height: 32, cursor: 'pointer', border: '1px solid #d9d9d9', borderRight: 0, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, padding: 0 }} value={face.bgColor} onChange={e => updateFace(face.id, { bgColor: e.target.value })} />
                                                    <Input placeholder="#FFFFFF" value={face.bgColor} onChange={e => updateFace(face.id, { bgColor: e.target.value })} style={{ width: 'calc(100% - 40px)' }} />
                                                </Space.Compact>
                                            </div>
                                            <Upload
                                                customRequest={(options) => handleUpload(options, face.id)}
                                                showUploadList={false}
                                                accept="image/*"
                                            >
                                                <Button icon={<UploadOutlined />} type={face.logoUrl ? 'default' : 'primary'}>
                                                    {face.logoUrl ? 'Đổi Logo' : 'Tải Logo Lên'}
                                                </Button>
                                            </Upload>
                                            {face.logoUrl && (
                                                <>
                                                    <Divider style={{ margin: '12px 0' }} />
                                                    <div>
                                                        <label>Tách nền trắng (Tolerance):</label>
                                                        <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                                                            <InputNumber min={0} max={255} value={face.removeTolerance || 240} onChange={v => updateFace(face.id, { removeTolerance: v })} style={{ width: '100%' }} />
                                                        </Space.Compact>
                                                    </div>
                                                    <div style={{ marginTop: 12 }}>
                                                        <label>Màu Logo:</label>
                                                        <Select value={face.logoColor || 'original'} onChange={v => updateFace(face.id, { logoColor: v })} style={{ width: '100%', marginTop: 4 }}>
                                                            <Select.Option value="original">Giữ Nguyên Bản</Select.Option>
                                                            <Select.Option value="white">Chuyển sang Trắng</Select.Option>
                                                            <Select.Option value="black">Chuyển sang Đen</Select.Option>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}
                                        </Space>
                                    </Card>
                                </Col>
                                <Col span={16}>
                                    <Card title="Căn chỉnh Logo trên mảnh">
                                        <div style={{ background: '#f0f2f5', padding: 20, display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: 'white' }}>
                                                <Stage width={face.pieceSize.w * SCALE} height={face.pieceSize.h * SCALE} onMouseDown={(e) => {
                                                    if (e.target === e.target.getStage()) updateFace(face.id, { selectedId: null });
                                                }}>
                                                    <Layer>
                                                        <KonvaRect width={face.pieceSize.w * SCALE} height={face.pieceSize.h * SCALE} fill={face.bgColor} />
                                                    </Layer>
                                                    <Layer>
                                                        {(face.processedLogoUrl || face.logoUrl) && (
                                                            <URLImage
                                                                image={face.processedLogoUrl || face.logoUrl}
                                                                x={face.logoConfig.x * SCALE}
                                                                y={face.logoConfig.y * SCALE}
                                                                width={face.logoConfig.width * SCALE}
                                                                height={face.logoConfig.height * SCALE}
                                                                isSelected={face.selectedId === 'logo'}
                                                                onSelect={() => updateFace(face.id, { selectedId: 'logo' })}
                                                                onChange={(newAttrs: any) => {
                                                                    updateFace(face.id, {
                                                                        logoConfig: {
                                                                            x: newAttrs.x / SCALE,
                                                                            y: newAttrs.y / SCALE,
                                                                            width: newAttrs.width / SCALE,
                                                                            height: newAttrs.height / SCALE,
                                                                        }
                                                                    });
                                                                }}
                                                            />
                                                        )}
                                                    </Layer>
                                                </Stage>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </Tabs.TabPane>
                    ))}
                </Tabs>
            </div>
        );
    }

    const renderStep3 = () => {
        const CANVAS_DISPLAY_WIDTH = 800;

        return (
            <Row gutter={16}>
                <Col span={6}>
                    <Card title="Cấu hình Khổ Vải (Bins)" size="small">
                        <Tabs type="card" size="small" style={{ marginBottom: 16 }}>
                            {faces.map(face => {
                                const bins = binsByFace[face.id] || [];
                                return (
                                    <Tabs.TabPane tab={face.name} key={face.id}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            {bins.map((bin, index) => (
                                                <Card size="small" key={index} title={`Tấm vải ${index + 1}`} extra={bins.length > 1 && <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveBin(face.id, index)} />}>
                                                    <div>Dài (cm): <InputNumber size="small" value={bin.w} onChange={v => handleBinChange(face.id, index, 'w', v || 400)} /></div>
                                                    <div style={{ marginTop: 4 }}>Rộng (cm): <InputNumber size="small" value={bin.h} onChange={v => handleBinChange(face.id, index, 'h', v || 120)} /></div>
                                                </Card>
                                            ))}
                                            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => handleAddBin(face.id)}>Thêm tấm vải mới</Button>
                                        </Space>
                                    </Tabs.TabPane>
                                );
                            })}
                        </Tabs>

                        <Divider />
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>Padding (cm): <InputNumber size="small" value={padding} onChange={v => setPadding(v || 0)} /></div>
                            <div>Tự động xoay: <Switch checked={allowRotation} onChange={setAllowRotation} size="small" /></div>
                            <Button type="primary" block style={{ background: '#52c41a' }} onClick={handleAutoPack}>Chạy Tự Động Xếp Tất Cả</Button>
                        </Space>
                    </Card>
                    
                    {Object.keys(resultsByFace).length > 0 && (
                        <Card title="Xuất File & Lưu Sơ Đồ" size="small" style={{ marginTop: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button block icon={<SaveOutlined />} type="primary" onClick={handleSaveDesign}>Lưu Sơ Đồ</Button>
                                <Button block icon={<FilePdfOutlined />} onClick={exportToPDF} style={{ color: '#cf1322', borderColor: '#cf1322' }}>Xuất PDF Gộp</Button>
                                <Button block icon={<FileImageOutlined />} onClick={exportToPNG}>Xuất PNG Rời</Button>
                            </Space>
                        </Card>
                    )}

                    {Object.keys(resultsByFace).length > 0 && (
                        <Card title="Thêm Chi Tiết Phụ" size="small" style={{ marginTop: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div><label>Tên chi tiết:</label> <Input size="small" value={customPiece.name} onChange={e => setCustomPiece({...customPiece, name: e.target.value})} /></div>
                                <div><label>Dài (cm):</label> <InputNumber size="small" style={{width: '100%'}} value={customPiece.w} onChange={v => setCustomPiece({...customPiece, w: v || 10})} /></div>
                                <div><label>Rộng (cm):</label> <InputNumber size="small" style={{width: '100%'}} value={customPiece.h} onChange={v => setCustomPiece({...customPiece, h: v || 10})} /></div>
                                <div><label>Màu:</label> <input type="color" value={customPiece.color} onChange={e => setCustomPiece({...customPiece, color: e.target.value})} style={{width: '100%'}} /></div>
                            </Space>
                            <div style={{fontSize: 11, color: '#888', marginTop: 8}}>* Thêm chi tiết phụ vào các tấm vải bên phải bằng nút [Thêm chi tiết phụ] tương ứng.</div>
                        </Card>
                    )}
                </Col>
                <Col span={18}>
                    {faces.map(face => {
                        const resultObj = resultsByFace[face.id];
                        if (!resultObj) return null;
                        
                        return (
                            <div key={face.id} style={{ marginBottom: 24 }}>
                                <Divider orientation="left">{face.name}</Divider>
                                
                                {resultObj.unpacked.length > 0 && (
                                    <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', borderRadius: 4 }}>
                                        <b>{face.name} - Thiếu diện tích!</b> Có {resultObj.unpacked.length} mảnh chưa thể xếp vào vải. Vui lòng thêm tấm vải.
                                    </div>
                                )}

                                {resultObj.binResults.map((result, idx) => {
                                    const scale = CANVAS_DISPLAY_WIDTH / result.w;
                                    const displayHeight = result.h * scale;
                                    
                                    if (!stageRefs.current[face.id]) stageRefs.current[face.id] = [];

                                    return (
                                        <Card 
                                            title={`Sơ đồ: ${face.name} - Tấm ${idx + 1} (${result.w}x${result.h} cm) - Đã xếp: ${result.packed.length} mảnh`} 
                                            size="small" style={{ marginBottom: 16 }} key={idx}
                                            extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => handleAddCustomPiece(face.id, idx)}>Thêm chi tiết phụ</Button>}
                                        >
                                            <div style={{ overflowX: 'auto', background: '#f0f2f5', padding: 10 }}>
                                                <div style={{ width: CANVAS_DISPLAY_WIDTH, height: displayHeight, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                                    <Stage width={CANVAS_DISPLAY_WIDTH} height={displayHeight} ref={(node) => { stageRefs.current[face.id][idx] = node; }} onMouseDown={(e) => {
                                                        if (e.target === e.target.getStage()) setSelectedPiece(null);
                                                    }}>
                                                        <RulerLayer width={result.w} height={result.h} scale={scale} />
                                                        <Layer>
                                                            {result.packed.map((rect) => {
                                                                const isSelected = selectedPiece?.faceId === face.id && selectedPiece?.binIdx === idx && selectedPiece?.rectId === rect.id;
                                                                return (
                                                                    <DraggableRect
                                                                        key={rect.id}
                                                                        rect={rect}
                                                                        scale={scale}
                                                                        face={face}
                                                                        isSelected={isSelected}
                                                                        onSelect={() => setSelectedPiece({ faceId: face.id, binIdx: idx, rectId: rect.id })}
                                                                        onChange={(newAttrs: any) => {
                                                                            const newResults = {...resultsByFace};
                                                                            const packed = newResults[face.id].binResults[idx].packed;
                                                                            const rectIdx = packed.findIndex(r => r.id === rect.id);
                                                                            if (rectIdx !== -1) {
                                                                                packed[rectIdx] = { ...packed[rectIdx], ...newAttrs };
                                                                                setResultsByFace(newResults);
                                                                            }
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </Layer>
                                                    </Stage>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        );
                    })}
                </Col>
            </Row>
        );
    }

    const steps = [
        { title: 'Chọn Đơn Hàng (PO_GC)', content: renderStep1() },
        { title: 'Thiết Kế Sản Phẩm (Đa Mặt)', content: renderStep2() },
        { title: 'Xếp Sơ Đồ Đa Mặt', content: renderStep3() },
    ];

    return (
        <Card title="Quy Trình Xếp Sơ Đồ & Thiết Kế In/Thêu">
            <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 24 }} />
            
            <div style={{ minHeight: 400 }}>
                {steps[currentStep].content}
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
                {currentStep > 0 && <Button style={{ margin: '0 8px' }} onClick={handlePrev}>Quay Lại</Button>}
                {currentStep < steps.length - 1 && <Button type="primary" onClick={handleNext}>Tiếp Tục</Button>}
                {currentStep === steps.length - 1 && <Button type="primary" style={{ background: '#52c41a' }} onClick={() => message.success('Hoàn thành!')}>Hoàn Thành</Button>}
            </div>

            <Modal title="Chọn Sơ đồ mẫu để Sao chép" open={isCopyModalVisible} onCancel={() => setIsCopyModalVisible(false)} footer={null} width={600}>
                <List
                    dataSource={savedDesigns}
                    renderItem={(item: any) => (
                        <List.Item
                            actions={[<Button type="primary" size="small" onClick={() => handleCopyDesign(item)}>Sao chép</Button>]}
                        >
                            <List.Item.Meta
                                title={<b>{item.name}</b>}
                                description={`Mã: ${item.code} | Khách hàng: ${item.customer?.name || '-'} | Sản phẩm: ${item.product?.name || '-'}`}
                            />
                        </List.Item>
                    )}
                />
            </Modal>
        </Card>
    );
};

export default UnifiedDesignWorkflow;
