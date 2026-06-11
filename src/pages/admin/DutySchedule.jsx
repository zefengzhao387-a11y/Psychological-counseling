import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Select, DatePicker, InputNumber, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'
import { useTeachers } from '../../hooks/useReferenceData'

const { RangePicker } = DatePicker

const typeLabel = (type) => (type === 1 ? '初访员' : '咨询师')

export default function DutySchedule() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [timeSlots, setTimeSlots] = useState([])
  const { teachers, options: teacherOptions } = useTeachers()
  const [form] = Form.useForm()

  const fetchData = async (date) => {
    setLoading(true)
    try {
      const res = await request.get('/v1/appointment/duty-schedule', {
        params: { date: date || dayjs().format('YYYY-MM-DD') },
      })
      setData(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeSlots = async () => {
    const res = await request.get('/v1/appointment/time-config')
    setTimeSlots(res.data || [])
  }

  useEffect(() => { fetchData(); fetchTimeSlots() }, [])

  const handleTeacherChange = (userId) => {
    const teacher = teachers.find((t) => t.userId === userId)
    if (teacher) {
      form.setFieldsValue({ counselorType: teacher.type })
    }
  }

  const handleBatch = async () => {
    try {
      const values = await form.validateFields()
      const [startDate, endDate] = values.dateRange
      await request.post('/v1/appointment/duty-schedule/batch', {
        counselorId: values.counselorId,
        counselorType: values.counselorType,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        timeSlotIds: values.timeSlotIds,
        maxAppointments: values.maxAppointments || 4,
      })
      message.success('排班成功')
      setOpen(false)
      form.resetFields()
      fetchData()
    } catch { /* 表单校验失败 */ }
  }

  const handleDelete = async (id) => {
    await request.delete(`/v1/appointment/duty-schedule/${id}`)
    message.success('已删除')
    fetchData()
  }

  const columns = [
    { title: '日期', dataIndex: 'dutyDate', key: 'dutyDate' },
    { title: '老师ID', dataIndex: 'counselorId', key: 'counselorId' },
    { title: '类型', dataIndex: 'counselorType', key: 'counselorType',
      render: (v) => v === 1 ? <Tag color="blue">初访员</Tag> : <Tag color="green">咨询师</Tag> },
    { title: '时段ID', dataIndex: 'timeSlotId', key: 'timeSlotId' },
    { title: '最大预约', dataIndex: 'maxAppointments', key: 'maxAppointments' },
    { title: '已约', dataIndex: 'bookedCount', key: 'bookedCount' },
    {
      title: '操作', key: 'action',
      render: (_, record) => (
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <DatePicker onChange={(d) => fetchData(d ? d.format('YYYY-MM-DD') : undefined)} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>批量排班</Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ pageSize: 20 }} />

      <Modal title="批量排班" open={open} onOk={handleBatch} onCancel={() => setOpen(false)} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="counselorId" label="选择老师" rules={[{ required: true, message: '请选择老师' }]}>
            <Select
              showSearch
              placeholder="输入 ID 或姓名搜索"
              options={teacherOptions}
              optionFilterProp="label"
              onChange={handleTeacherChange}
              notFoundContent={teachers.length === 0 ? '暂无老师数据，请先在「老师信息」中维护' : '未找到匹配老师'}
            />
          </Form.Item>
          <Form.Item name="counselorType" label="老师类型" rules={[{ required: true }]}>
            <Select options={[{ value: 1, label: '初访员' }, { value: 2, label: '咨询师' }]} />
          </Form.Item>
          <Form.Item name="dateRange" label="排班日期范围" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotIds" label="时段" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择时间段"
              options={timeSlots.map(t => ({ value: t.id, label: t.slotName }))} />
          </Form.Item>
          <Form.Item name="maxAppointments" label="每时段最大预约数" initialValue={4}>
            <InputNumber min={1} max={10} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
