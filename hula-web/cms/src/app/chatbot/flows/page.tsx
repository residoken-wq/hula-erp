'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Switch, Modal, Form, Input, Radio, Popconfirm, Typography, message, Alert } from 'antd';
import { PlusOutlined, ApartmentOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { chatbotFlowApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { START_ACTION_OPTIONS, blankGraph, schoolTemplate } from '@/components/chatbot-flow/engine';

const { Text } = Typography;

const errMsg = (err: any) => err?.response?.data?.issues?.[0]?.message || err?.response?.data?.message || err?.message;

export default function FlowsPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.username === 'admin';
  const canCreate = isAdmin || hasPermission('CHATBOT_KB', 'create');
  const canApprove = isAdmin || hasPermission('CHATBOT_KB', 'delete');

  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await chatbotFlowApi.list();
      setFlows(res.data || []);
    } catch (err: any) {
      message.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    const v = await form.validateFields();
    setCreating(true);
    try {
      const graph = v.template === 'school' ? schoolTemplate() : blankGraph();
      const res = await chatbotFlowApi.create({ name: v.name, description: v.description, graph });
      setCreateOpen(false);
      form.resetFields();
      router.push(`/chatbot/flows/${res.data.id}`);
    } catch (err: any) {
      message.error(errMsg(err));
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (row: any, enabled: boolean) => {
    try {
      await chatbotFlowApi.setEnabled(row.id, enabled);
      message.success(enabled ? 'Đã bật kịch bản' : 'Đã tắt kịch bản');
      load();
    } catch (err: any) {
      message.error(errMsg(err));
    }
  };

  const remove = async (row: any) => {
    try {
      await chatbotFlowApi.remove(row.id);
      message.success('Đã xoá');
      load();
    } catch (err: any) {
      message.error(errMsg(err));
    }
  };

  const actionLabel = (a: string) => START_ACTION_OPTIONS.find((o) => o.value === a)?.label || a;

  const columns = [
    {
      title: 'Kịch bản',
      dataIndex: 'name',
      render: (v: string, r: any) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => router.push(`/chatbot/flows/${r.id}`)} style={{ fontWeight: 600 }}>
            {v}
          </a>
          {r.description && <Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text>}
        </Space>
      ),
    },
    {
      title: 'Khởi động khi',
      key: 'triggers',
      render: (_: any, r: any) => (
        <Space size={[4, 4]} wrap>
          {(r.triggers?.start_actions || []).map((a: string) => (
            <Tag key={a} color="green">Nút: {actionLabel(a)}</Tag>
          ))}
          {(r.triggers?.keywords || []).map((k: string) => (
            <Tag key={k}>“{k}”</Tag>
          ))}
          {!r.triggers?.start_actions?.length && !r.triggers?.keywords?.length && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    { title: 'Số bước', dataIndex: 'node_count', width: 90 },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 220,
      render: (_: any, r: any) => (
        <Space size={4} wrap>
          {r.published_version > 0 ? <Tag color="blue">Đã xuất bản v{r.published_version}</Tag> : <Tag>Bản nháp</Tag>}
          {r.published_version > 0 && r.has_unpublished_changes && <Tag color="orange">Có thay đổi chưa xuất bản</Tag>}
        </Space>
      ),
    },
    {
      title: 'Đang chạy',
      key: 'enabled',
      width: 100,
      render: (_: any, r: any) => (
        <Switch
          checked={r.enabled}
          disabled={!canApprove}
          onChange={(v) => toggle(r, v)}
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 170,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<ApartmentOutlined />} onClick={() => router.push(`/chatbot/flows/${r.id}`)}>
            Mở sơ đồ
          </Button>
          {canApprove && (
            <Popconfirm title="Xoá kịch bản này?" description="Khách đang ở giữa kịch bản sẽ quay về trả lời thường." onConfirm={() => remove(r)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card
        title="Sơ đồ kịch bản"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} />
            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                Tạo kịch bản
              </Button>
            )}
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Bot đi theo sơ đồ trước, hết sơ đồ mới dùng Tri thức và AI"
          description="Khách bấm nút hoặc gõ đúng từ khoá thì đi theo nhánh tương ứng. Khiếu nại, trẻ sơ sinh hoặc khách đòi gặp nhân viên luôn được ưu tiên và dừng kịch bản. Chỉ bản đã xuất bản và đang bật mới chạy trên website."
        />
        <Table rowKey="id" loading={loading} dataSource={flows} columns={columns as any} pagination={false} />
      </Card>

      <Modal
        title="Tạo kịch bản mới"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreate}
        okText="Tạo và mở sơ đồ"
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical" initialValues={{ template: 'blank' }}>
          <Form.Item name="name" label="Tên kịch bản" rules={[{ required: true, message: 'Nhập tên' }, { max: 120 }]}>
            <Input placeholder="VD: Tư vấn cho trường mầm non" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ max: 500 }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="template" label="Bắt đầu từ">
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="blank">Sơ đồ trống (1 tin nhắn + 2 nút)</Radio>
                <Radio value="school">Mẫu: Tư vấn cho trường (nút “Tìm cho trường”)</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
