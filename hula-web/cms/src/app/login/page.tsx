"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

export default function LoginPage() {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await login(values);
        } catch (error) {
            // Error managed in useAuth
        }
        setLoading(false);
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#667eea',
                    fontFamily: "'Inter', sans-serif",
                }
            }}
        >
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 20
            }}>
                <Card
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 16,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 15px',
                            color: 'white',
                            fontSize: 24
                        }}>
                            <LoginOutlined />
                        </div>
                        <Title level={3} style={{ marginBottom: 5 }}>Đăng nhập CMS</Title>
                        <Text type="secondary">Hula ERP - Content Management System</Text>
                    </div>

                    <Form
                        name="login_form"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{
                                    height: 45,
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none'
                                }}
                            >
                                ĐĂNG NHẬP
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </ConfigProvider>
    );
}
