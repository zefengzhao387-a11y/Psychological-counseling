import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Tag } from 'antd'
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
      const res = await request.get('/v1/consultation/records')
      setData(res.data?.records || res.data || [])
    } catch { setData([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editingId) {
      await request.put(`/v1/consultation/records/${editingId}`, values)
    } else {
      await request.post('/v1/consultation/records', values)
    }
    message.success(editingId ? '修改成功' : '新增成功')
    setOpen(false); fetchData()
  }

  const statusTag = (v) => {
    const map = { 1: '进行中', 2: '已结案', 3: '已脱落' }
    const color = { 1: 'blue', 2: 'green', 3: 'default' }
    return <Tag color={color[v]}>{map[v] || v}</Tag>
  }

  const columns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '咨询师', dataIndex: 'counselorName', key: 'counselorName' },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    { title: '时段', dataIndex: 'timeSlotName', key: 'timeSlotName' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '剩余周数', dataIndex: 'remainingWeeks', key: 'remainingWeeks' },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    {
      title: '操作', key: 'action',
      render: (_, r) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
          setEditingId(r.id); form.setFieldsValue(r); setOpen(true)
        }}>编辑</Button>
      ),
    },
  ]

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingId(null); form.resetFields(); setOpen(true)
      }} style={{ marginBottom: 16 }}>新增安排</Button>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ pageSize: 20 }} />

      <Modal title={editingId ? '编辑安排' : '新增安排'} open={open} onOk={handleSave}
        onCancel={() => setOpen(false)} width={480}>
        <Form form={form} layout="vertical">
          <Form.Item name="studentName" label="学生姓名"><Input /></Form.Item>
          <Form.Item name="counselorName" label="咨询师"><Input /></Form.Item>
          <Form.Item name="startDate" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="timeSlotName" label="时段"><Input /></Form.Item>
          <Form.Item name="location" label="地点"><Input /></Form.Item>
          <Form.Item name="remainingWeeks" label="剩余周数"><Input /></Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[
              { value: 1, label: '进行中' }, { value: 2, label: '已结案' }, { value: 3, label: '已脱落' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
