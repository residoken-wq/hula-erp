import React, { useState, useEffect, useRef } from 'react';
import { Steps, Card, Table, Button, Select, InputNumber, Row, Col, Space, message, Upload, Spin, Divider, Switch } from 'antd';
import { UploadOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import { Stage, Layer, Rect as KonvaRect, Image as KonvaImage, Transformer, Group, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import jsPDF from 'jspdf';
import api from '../../utils/api';
import { packMultipleBins, Bin, Rect, BinResult } from '../../utils/binPacking';

const { Step } = Steps;

// A custom component to handle image loading in Konva
const URLImage = ({ image, x, y, width, height, isSelected, onSelect, onChange }: any) => {
    const [img] = useImage(image);
    const shapeRef = useRef<any>();
    const trRef = useRef<any>();

    useEffect(() => {
        if (isSelected && trRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

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

const UnifiedDesignWorkflow: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);

    // --- Step 1 Data ---
    const [poList, setPoList] = useState<any[]>([]);
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loadingPo, setLoadingPo] = useState(false);

    // --- Step 2 Data ---
    const [pieceSize, setPieceSize] = useState({ w: 50, h: 40 });
    const [bgColor, setBgColor] = useState('#e6f7ff');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoConfig, setLogoConfig] = useState({ x: 10, y: 10, width: 20, height: 20 });
    const [selectedId, selectShape] = useState<string | null>(null);

    // --- Step 3 Data ---
    const [bins, setBins] = useState<Bin[]>([{ w: 400, h: 120 }]);
    const [padding, setPadding] = useState(2);
    const [allowRotation, setAllowRotation] = useState(true);
    const [binResults, setBinResults] = useState<BinResult[]>([]);
    const [unpacked, setUnpacked] = useState<Rect[]>([]);
    const stageRefs = useRef<(any)[]>([]); // Refs for multiple canvases

    useEffect(() => {
        fetchPOs();
    }, []);

    const fetchPOs = async () => {
        setLoadingPo(true);
        try {
            const res = await api.get('/purchasing');
            const data = Array.isArray(res.data) ? res.data : [];
            // Filter PO_GC (OUTSOURCING) and status DRAFT or ORDERED
            const filtered = data.filter((po: any) => 
                po.po_type === 'OUTSOURCING' && 
                ['DRAFT', 'ORDERED', 'SENT', 'CONFIRMED'].includes(po.status)
            );
            setPoList(filtered);
        } catch (e) {
            message.error('Lỗi tải danh sách PO');
        }
        setLoadingPo(false);
    };

    const handleUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setLogoUrl(res.data.url);
            onSuccess(res.data.url);
            message.success('Tải logo thành công');
        } catch (e) {
            onError(e);
            message.error('Lỗi tải logo');
        }
    };

    const handleNext = () => {
        if (currentStep === 0 && !selectedItem) {
            message.warning('Vui lòng chọn 1 sản phẩm trong đơn gia công!');
            return;
        }
        if (currentStep === 1 && !logoUrl) {
            message.warning('Vui lòng tải lên Logo khách hàng để căn chỉnh!');
            // Cho phép đi tiếp nếu ko có logo? Tùy nghiệp vụ, nhưng tốt nhất nên cảnh báo
        }
        setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleAddBin = () => {
        setBins([...bins, { w: 400, h: 120 }]);
    };

    const handleRemoveBin = (index: number) => {
        const newBins = [...bins];
        newBins.splice(index, 1);
        setBins(newBins);
    };

    const handleBinChange = (index: number, field: string, value: number) => {
        const newBins = [...bins];
        newBins[index] = { ...newBins[index], [field]: value };
        setBins(newBins);
    };

    const handleAutoPack = () => {
        if (!selectedItem) return;
        const quantity = selectedItem.quantity || 1;
        const rects: Rect[] = [];

        // Generate N rects based on quantity and piece size
        for (let i = 0; i < quantity; i++) {
            rects.push({
                id: `P-${i}`,
                w: pieceSize.w,
                h: pieceSize.h,
                data: { color: bgColor, logoUrl, logoConfig }
            });
        }

        const result = packMultipleBins(bins, rects, padding, allowRotation);
        setBinResults(result.binResults);
        setUnpacked(result.unpacked);

        if (result.unpacked.length > 0) {
            message.warning(`Cảnh báo: Có ${result.unpacked.length} mảnh không xếp được vào các tấm vải đã cho. Hãy thêm vải!`);
        } else {
            message.success('Xếp sơ đồ hoàn tất!');
        }
    };

    const exportToPNG = () => {
        stageRefs.current.forEach((stage, idx) => {
            if (stage) {
                const uri = stage.toDataURL({ pixelRatio: 2 });
                const link = document.createElement('a');
                link.download = `sodo-vai-${idx + 1}-${Date.now()}.png`;
                link.href = uri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    };

    const exportToPDF = () => {
        // PDF default A4 is 210x297mm.
        // We will create a landscape PDF to fit long fabric rolls better
        const pdf = new jsPDF('l', 'px', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        stageRefs.current.forEach((stage, idx) => {
            if (stage) {
                if (idx > 0) pdf.addPage();
                
                const canvas = stage.toCanvas();
                const imgData = canvas.toDataURL('image/png');
                
                // Scale canvas to fit inside A4 landscape
                const canvasW = canvas.width;
                const canvasH = canvas.height;
                const ratio = Math.min(pdfWidth / canvasW, pdfHeight / canvasH);
                
                const w = canvasW * ratio;
                const h = canvasH * ratio;
                const x = (pdfWidth - w) / 2;
                const y = (pdfHeight - h) / 2;

                pdf.addImage(imgData, 'PNG', x, y, w, h);
                pdf.text(`Sơ đồ Vải số ${idx + 1}`, 20, 20);
            }
        });

        pdf.save(`SoDo_PO_${selectedPo?.po_code || 'Export'}.pdf`);
    };

    // --- RENDER STEPS ---
    const renderStep1 = () => (
        <div>
            <Select
                showSearch
                placeholder="Chọn Lệnh Sản Xuất / PO Gia Công..."
                style={{ width: 400, marginBottom: 16 }}
                loading={loadingPo}
                options={poList.map(po => ({ label: `[${po.status}] ${po.po_code} - ${po.supplier?.name || ''}`, value: po.id }))}
                onChange={(val) => {
                    const po = poList.find(p => p.id === val);
                    setSelectedPo(po);
                    setSelectedItem(null);
                }}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
            {selectedPo && (
                <Table
                    dataSource={selectedPo.items}
                    rowKey="id"
                    pagination={false}
                    columns={[
                        { title: 'Tên Sản phẩm / Mã hàng', dataIndex: 'description', render: (t, r: any) => r.product?.name || r.material?.name || t },
                        { title: 'Số lượng yêu cầu', dataIndex: 'quantity', render: (v) => <b>{v}</b> },
                        { title: 'Ghi chú', dataIndex: 'note' },
                        {
                            title: 'Thao tác', render: (r) => (
                                <Button
                                    type={selectedItem?.id === r.id ? 'primary' : 'default'}
                                    onClick={() => setSelectedItem(r)}
                                >
                                    Chọn để làm Sơ đồ
                                </Button>
                            )
                        }
                    ]}
                />
            )}
        </div>
    );

    const renderStep2 = () => {
        const SCALE = 5; // Scale up the 50x40cm to 250x200px for easy viewing
        return (
            <Row gutter={24}>
                <Col span={8}>
                    <Card title="Thông số Sản phẩm (1 mảnh)">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <label>Kích thước Dài (cm):</label>
                                <InputNumber style={{ width: '100%' }} value={pieceSize.w} onChange={v => setPieceSize({ ...pieceSize, w: v || 50 })} />
                            </div>
                            <div>
                                <label>Kích thước Rộng/Cao (cm):</label>
                                <InputNumber style={{ width: '100%' }} value={pieceSize.h} onChange={v => setPieceSize({ ...pieceSize, h: v || 40 })} />
                            </div>
                            <div>
                                <label>Màu nền (Branding):</label>
                                <input type="color" style={{ width: '100%', height: 32, cursor: 'pointer' }} value={bgColor} onChange={e => setBgColor(e.target.value)} />
                            </div>
                            <Divider style={{ margin: '12px 0' }} />
                            <div>
                                <label>Tải Logo / Hình In lên:</label>
                                <Upload customRequest={handleUpload} listType="picture" maxCount={1} showUploadList={false}>
                                    <Button icon={<UploadOutlined />} style={{ width: '100%', marginTop: 8 }}>Chọn ảnh Logo</Button>
                                </Upload>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col span={16}>
                    <Card title="Căn chỉnh Logo trên Sản phẩm">
                        <div style={{ background: '#f0f2f5', padding: 20, display: 'flex', justifyContent: 'center' }}>
                            <div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: 'white' }}>
                                <Stage width={pieceSize.w * SCALE} height={pieceSize.h * SCALE} onMouseDown={(e) => {
                                    if (e.target === e.target.getStage()) selectShape(null);
                                }}>
                                    <Layer>
                                        <KonvaRect width={pieceSize.w * SCALE} height={pieceSize.h * SCALE} fill={bgColor} />
                                        {logoUrl && (
                                            <URLImage
                                                image={logoUrl}
                                                x={logoConfig.x * SCALE}
                                                y={logoConfig.y * SCALE}
                                                width={logoConfig.width * SCALE}
                                                height={logoConfig.height * SCALE}
                                                isSelected={selectedId === 'logo'}
                                                onSelect={() => selectShape('logo')}
                                                onChange={(newAttrs: any) => {
                                                    setLogoConfig({
                                                        x: newAttrs.x / SCALE,
                                                        y: newAttrs.y / SCALE,
                                                        width: newAttrs.width / SCALE,
                                                        height: newAttrs.height / SCALE,
                                                    });
                                                }}
                                            />
                                        )}
                                    </Layer>
                                </Stage>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 10, color: '#888' }}>
                            <i>Click vào logo để thay đổi kích thước và di chuyển</i>
                        </div>
                    </Card>
                </Col>
            </Row>
        );
    }

    const renderStep3 = () => {
        // Multi-bin rendering
        const CANVAS_DISPLAY_WIDTH = 800;

        return (
            <Row gutter={16}>
                <Col span={6}>
                    <Card title="Cấu hình Khổ Vải (Bins)" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {bins.map((bin, index) => (
                                <Card size="small" key={index} title={`Tấm vải ${index + 1}`} extra={bins.length > 1 && <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleRemoveBin(index)} />}>
                                    <div>Dài (cm): <InputNumber size="small" value={bin.w} onChange={v => handleBinChange(index, 'w', v || 400)} /></div>
                                    <div style={{ marginTop: 4 }}>Rộng (cm): <InputNumber size="small" value={bin.h} onChange={v => handleBinChange(index, 'h', v || 120)} /></div>
                                </Card>
                            ))}
                            <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddBin}>Thêm tấm vải mới</Button>
                        </Space>
                        <Divider />
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>Padding (cm): <InputNumber size="small" value={padding} onChange={v => setPadding(v || 0)} /></div>
                            <div>Tự động xoay: <Switch checked={allowRotation} onChange={setAllowRotation} size="small" /></div>
                            <Button type="primary" block style={{ background: '#52c41a' }} onClick={handleAutoPack}>Chạy Tự Động Xếp</Button>
                        </Space>
                    </Card>
                    
                    {binResults.length > 0 && (
                        <Card title="Xuất File" size="small" style={{ marginTop: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button block icon={<FilePdfOutlined />} onClick={exportToPDF} style={{ color: '#cf1322', borderColor: '#cf1322' }}>Xuất PDF (Mỗi tấm 1 trang)</Button>
                                <Button block icon={<FileImageOutlined />} onClick={exportToPNG}>Xuất PNG (Nhiều ảnh)</Button>
                            </Space>
                        </Card>
                    )}
                </Col>
                <Col span={18}>
                    {unpacked.length > 0 && (
                        <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', borderRadius: 4 }}>
                            <b>Thiếu diện tích!</b> Có {unpacked.length} mảnh chưa thể xếp vào vải. Vui lòng thêm tấm vải mới ở cột trái và Chạy lại.
                        </div>
                    )}
                    
                    {binResults.map((result, idx) => {
                        const scale = CANVAS_DISPLAY_WIDTH / result.w;
                        const displayHeight = result.h * scale;

                        return (
                            <Card title={`Sơ đồ: Tấm vải ${idx + 1} (${result.w}x${result.h} cm) - Đã xếp: ${result.packed.length} mảnh`} size="small" style={{ marginBottom: 16 }} key={idx}>
                                <div style={{ overflowX: 'auto', background: '#f0f2f5', padding: 10 }}>
                                    <div style={{ width: CANVAS_DISPLAY_WIDTH, height: displayHeight, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                        <Stage width={CANVAS_DISPLAY_WIDTH} height={displayHeight} ref={(node) => { stageRefs.current[idx] = node; }}>
                                            <Layer>
                                                {result.packed.map((rect, i) => (
                                                    <Group
                                                        key={rect.id}
                                                        x={(rect.x || 0) * scale}
                                                        y={(rect.y || 0) * scale}
                                                        rotation={rect.rotated ? -90 : 0} // Handling rotation display
                                                        offsetX={rect.rotated ? 0 : 0}
                                                        offsetY={rect.rotated ? rect.w * scale : 0} // Adjust offset for rotation
                                                    >
                                                        {/* Product Background */}
                                                        <KonvaRect
                                                            width={(rect.rotated ? rect.h : rect.w) * scale}
                                                            height={(rect.rotated ? rect.w : rect.h) * scale}
                                                            fill={rect.data?.color || '#e6f7ff'}
                                                            stroke="#000"
                                                            strokeWidth={1}
                                                        />
                                                        {/* Scaled Mini Logo inside the piece */}
                                                        {/* We need to apply the same percentage relative to w/h */}
                                                        <Group
                                                            x={rect.data?.logoConfig?.x / pieceSize.w * (rect.rotated ? rect.h : rect.w) * scale || 0}
                                                            y={rect.data?.logoConfig?.y / pieceSize.h * (rect.rotated ? rect.w : rect.h) * scale || 0}
                                                        >
                                                            {/* Just show a placeholder rect for Logo in final marker for performance, or text */}
                                                            <KonvaRect 
                                                                width={rect.data?.logoConfig?.width / pieceSize.w * (rect.rotated ? rect.h : rect.w) * scale || 0}
                                                                height={rect.data?.logoConfig?.height / pieceSize.h * (rect.rotated ? rect.w : rect.h) * scale || 0}
                                                                fill="rgba(255,0,0,0.3)"
                                                                stroke="red"
                                                                strokeWidth={1}
                                                            />
                                                            <KonvaText text="LOGO" fontSize={10} fill="red" />
                                                        </Group>
                                                    </Group>
                                                ))}
                                            </Layer>
                                        </Stage>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </Col>
            </Row>
        );
    }

    const steps = [
        { title: 'Chọn Đơn Hàng (PO_GC)', content: renderStep1() },
        { title: 'Thiết Kế Sản Phẩm', content: renderStep2() },
        { title: 'Xếp Sơ Đồ (Multi-Bin)', content: renderStep3() },
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
        </Card>
    );
};

export default UnifiedDesignWorkflow;
