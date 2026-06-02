import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'

export default function AppointmentRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/appointment/first-visit/review-list', {
        params: { page: 1, size: 100, status: undefined },
      })
      setData(res.data?.records || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  /** 改约 */
  const handleReschedule = async () => {
    const values = await form.validateFields()
    await request.put('/v1/appointment/first-visit/reschedule', {
      appointmentId: editingId,
      visitorId: values.visitorId,
      appointmentDate: values.appointmentDate?.format('YYYY-MM-DD'),
      timeSlotId: values.timeSlotId,
      location: values.location,
    })
    message.success('改约成功')
    setOpen(false); setEditingId(null); fetchData()
  }

  /** 新增预约 */
  const handleAdd = async () => {
    const values = await form.validateFields()
    await request.post('/v1/appointment/first-visit/add', {
      studentId: values.studentId,
      visitorId: values.visitorId,
      formId: values.formId,
      appointmentDate: values.appointmentDate?.format('YYYY-MM-DD'),
      timeSlotId: values.timeSlotId,
      location: values.location,
    })
    message.success('新增成功')
    setOpen(false); form.resetFields(); fetchData()
  }

  const statusTag = (s) => {
    const map = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销' }
    const color = { 1: 'orange', 2: 'green', 3: 'red', 4: 'default' }
    return <Tag color={color[s]}>{map[s] || s}</Tag>
  }

  const columns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '日期', dataIndex: 'appointmentDate', key: 'appointmentDate' },
    { title: '时段', dataIndex: 'timeSlotName', key: 'timeSlotName' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '初访员', dataIndex: 'visitorName', key: 'visitorName' },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    {
      title: '操作', key: 'action',
      render: (_, r) => (
        <>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
            setEditingId(r.id); form.setFieldsValue({
              visitorId: r.visitorId, appointmentDate: r.appointmentDate ? dayjs(r.appointmentDate) : null,
              timeSlotId: r.timeSlotId, location: r.location,
            }); setOpen(true)
          }}>改约</Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingId(null); form.resetFields(); setOpen(true)
      }} style={{ marginBottom: 16 }}>新增预约</Button>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        scroll={{ x: 900 }} pagination={{ pageSize: 20 }} />

      <Modal title={editingId ? '改约' : '新增预约'} open={open}
        onOk={editingId ? handleReschedule : handleAdd}
        onCancel={() => { setOpen(false); setEditingId(null); form.resetFields() }} width={480}>
        <Form form={form} layout="vertical">
          {!editingId && (
            <>
              <Form.Item name="studentId" label="学生ID" rules={[{ required: true }]}>
                <Input placeholder="输入学生用户ID" />
              </Form.Item>
              <Form.Item name="formId" label="登记表ID">
                <Input placeholder="如有登记表" />
              </Form.Item>
            </>
          )}
          <Form.Item name="visitorId" label="初访员ID">
            <Input placeholder="输入初访员ID" />
          </Form.Item>
          <Form.Item name="appointmentDate" label="预约日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotId" label="时间段ID">
            <Input placeholder="时间段ID" />
          </Form.Item>
          <Form.Item name="location" label="咨询地点">
            <Input placeholder="如：心理中心A101" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
