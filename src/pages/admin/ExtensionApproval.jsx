import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Select, Input, message, Tag, Popconfirm } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import request from '../../api/request'

/**
 * 管理员 — 追加咨询时段审批
 */
export default function ExtensionApproval() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/extension/pending')
      setData(res.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleApprove = async (approved) => {
    const values = await form.validateFields()
    await request.post('/v1/consultation/extension/approve', {
      extensionId: current.id,
      status: approved ? 2 : 3,
      remark: values.reviewComment,
    })
    message.success(approved ? '已通过' : '已驳回')
    setOpen(false)
    setCurrent(null)
    form.resetFields()
    fetchData()
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '咨询安排ID', dataIndex: 'appointmentId', width: 100 },
    { title: '咨询师ID', dataIndex: 'counselorId', width: 90 },
    { title: '申请追加周数', dataIndex: 'extendWeeks', width: 110 },
    { title: '申请理由', dataIndex: 'reason', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v) => <Tag color="orange">{v === 0 ? '待审批' : v}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => { setCurrent(r); setOpen(true) }}>
          审批
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ pageSize: 20 }} />

      <Modal title="追加时段审批" open={open}
        onCancel={() => { setOpen(false); setCurrent(null) }}
        footer={[
          <Button key="reject" danger icon={<CloseOutlined />}
            onClick={() => handleApprove(false)}>驳回</Button>,
          <Button key="approve" type="primary" icon={<CheckOutlined />}
            onClick={() => handleApprove(true)}>通过</Button>,
        ]}>
        <p>咨询安排 ID：{current?.appointmentId}</p>
        <p>申请追加：{current?.extendWeeks} 周</p>
        <p>理由：{current?.reason}</p>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="reviewComment" label="审批意见">
            <Input.TextArea rows={3} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
