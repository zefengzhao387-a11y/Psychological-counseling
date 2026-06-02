import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, TimePicker, InputNumber, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'

export default function TimeConfig() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/appointment/time-config')
      setData(res.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    const payload = {
      slotName: values.slotName,
      startTime: values.timeRange[0].format('HH:mm:ss'),
      endTime: values.timeRange[1].format('HH:mm:ss'),
      intervalMinutes: values.intervalMinutes,
    }
    if (editingId) {
      await request.put(`/v1/appointment/time-config/${editingId}`, payload)
    } else {
      await request.post('/v1/appointment/time-config', payload)
    }
    message.success(editingId ? '更新成功' : '新增成功')
    setOpen(false); form.resetFields(); setEditingId(null); fetchData()
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      slotName: record.slotName,
      timeRange: [dayjs(record.startTime, 'HH:mm:ss'), dayjs(record.endTime, 'HH:mm:ss')],
      intervalMinutes: record.intervalMinutes,
    })
    setOpen(true)
  }

  const handleDelete = async (id) => {
    await request.delete(`/v1/appointment/time-config/${id}`)
    message.success('已删除'); fetchData()
  }

  const columns = [
    { title: '时间段', dataIndex: 'slotName', key: 'slotName' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '间隔(分钟)', dataIndex: 'intervalMinutes', key: 'intervalMinutes' },
    {
      title: '操作', key: 'action',
      render: (_, r) => (
        <>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ]

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setOpen(true) }}
        style={{ marginBottom: 16 }}>新增时段</Button>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />

      <Modal title={editingId ? '编辑时段' : '新增时段'} open={open} onOk={handleSave}
        onCancel={() => { setOpen(false); setEditingId(null) }}>
        <Form form={form} layout="vertical">
          <Form.Item name="slotName" label="时段名称" rules={[{ required: true }]}>
            <Input placeholder="如：08:00-08:50" />
          </Form.Item>
          <Form.Item name="timeRange" label="起止时间" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="intervalMinutes" label="来访间隔(分钟)" initialValue={10}>
            <InputNumber min={5} max={60} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
