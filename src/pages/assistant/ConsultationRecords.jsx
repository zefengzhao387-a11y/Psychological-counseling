import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, InputNumber, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'

/**
 * 心理助理 — 咨询安排记录管理
 * 查看/改约/新增 咨询安排
 */
export default function ConsultationRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/records', { params: { page: 1, size: 100 } })
      setData(res.data?.records || [])
    } catch {
      setData([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const buildPayload = (values) => ({
    studentId: values.studentId,
    counselorId: values.counselorId,
    startDate: values.startDate?.format('YYYY-MM-DD'),
    timeSlotId: values.timeSlotId,
    location: values.location,
    occupiedWeeks: values.occupiedWeeks || 8,
  })

  const handleSave = async () => {
    const values = await form.validateFields()
    const payload = buildPayload(values)
    if (editingId) {
      await request.put(`/v1/consultation/records/${editingId}`, payload)
      message.success('修改成功')
    } else {
      await request.post('/v1/consultation/records', payload)
      message.success('新增成功')
    }
    setOpen(false)
    setEditingId(null)
    form.resetFields()
    fetchData()
  }

  const statusTag = (v) => {
    const map = { 1: '进行中', 2: '已结案', 3: '已脱落' }
    const color = { 1: 'blue', 2: 'green', 3: 'default' }
    return <Tag color={color[v]}>{map[v] || v}</Tag>
  }

  const openEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      studentId: record.studentId,
      counselorId: record.counselorId,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      timeSlotId: record.timeSlotId,
      location: record.location,
      occupiedWeeks: record.occupiedWeeks,
    })
    setOpen(true)
  }

  const columns = [
    { title: '学生ID', dataIndex: 'studentId', key: 'studentId' },
    { title: '咨询师ID', dataIndex: 'counselorId', key: 'counselorId' },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '时段ID', dataIndex: 'timeSlotId', key: 'timeSlotId' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '剩余周数', dataIndex: 'remainingWeeks', key: 'remainingWeeks' },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    {
      title: '操作', key: 'action',
      render: (_, r) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
          改约
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingId(null)
        form.resetFields()
        setOpen(true)
      }} style={{ marginBottom: 16 }}>新增安排</Button>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ pageSize: 20 }} scroll={{ x: 900 }} />

      <Modal title={editingId ? '改约' : '新增安排'} open={open} onOk={handleSave}
        onCancel={() => { setOpen(false); setEditingId(null) }} width={480}>
        <Form form={form} layout="vertical" initialValues={{ occupiedWeeks: 8 }}>
          {!editingId && (
            <Form.Item name="studentId" label="学生ID" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="学生用户ID" />
            </Form.Item>
          )}
          <Form.Item name="counselorId" label="咨询师ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="咨询师用户ID" />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotId" label="时间段ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="地点" rules={[{ required: true }]}>
            <Input placeholder="如：心理中心B203" />
          </Form.Item>
          {!editingId && (
            <Form.Item name="occupiedWeeks" label="占用周数">
              <InputNumber min={1} max={16} style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
