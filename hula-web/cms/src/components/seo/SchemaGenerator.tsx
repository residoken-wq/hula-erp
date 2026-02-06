import React from 'react';
import { Card, Form, Select, Input, Alert } from 'antd';

interface SchemaGeneratorProps {
    value?: any;
    onChange?: (value: any) => void;
}

export const SchemaGenerator: React.FC<SchemaGeneratorProps> = ({ value, onChange }) => {
    const startValue = value || { schemaType: 'Article', robots: ['index', 'follow'] };

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if (onChange) {
            onChange(allValues);
        }
    };

    return (
        <Card title="Schema Markup Data" size="small">
            <Form
                layout="vertical"
                initialValues={startValue}
                onValuesChange={handleValuesChange}
            >
                <Alert
                    message="Schema Markup giúp Google hiểu rõ hơn về nội dung của bạn để hiển thị Rich Snippets."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Form.Item name="schemaType" label="Loại Schema">
                    <Select>
                        <Select.Option value="Article">Article (Bài viết chung)</Select.Option>
                        <Select.Option value="NewsArticle">NewsArticle (Tin tức)</Select.Option>
                        <Select.Option value="BlogPosting">BlogPosting (Bài blog cá nhân)</Select.Option>
                        <Select.Option value="Product" disabled>Product (Sản phẩm - Tự động từ ERP)</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="robots" label="Robots Checkbox">
                    <Select mode="multiple" placeholder="Chọn chỉ thị Robots">
                        <Select.Option value="index">Index</Select.Option>
                        <Select.Option value="noindex">No Index</Select.Option>
                        <Select.Option value="follow">Follow</Select.Option>
                        <Select.Option value="nofollow">No Follow</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="canonicalUrl" label="Canonical URL (Optional)">
                    <Input placeholder="https://..." />
                </Form.Item>
            </Form>
        </Card>
    );
};
