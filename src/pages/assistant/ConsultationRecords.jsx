import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, InputNumber, Select, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'
import { useTeachers, useTimeSlots } from '../../hooks/useReferenceData'
import { renderPerson } from '../../utils/display'

/**
 * 心理助理 — 咨询安排记录管理
 * 查看/改约/新增 咨询安排
 */
export default function ConsultationRecords() {
  const { options: counselorOptions } = useTeachers(2)
  const { options: timeSlotOptions } = useTimeSlots()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [studentOptions, setStudentOptions] = useState([])
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

  const searchStudents = async (keyword) => {
    if (!keyword?.trim()) {
      setStudentOptions([])
      return
    }
    try {
      const res = await request.get('/v1/appointment/first-visit/search-student', {
        params: { keyword: keyword.trim() },
        silent: true,
      })
      setStudentOptions((res.data || []).map((s) => ({
        value: s.studentId,
        label: `${s.studentName}（${s.studentNo}）`,
      })))
    } catch {
      setStudentOptions([])
    }
  }

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
    {
      title: '学生',
      key: 'student',
      render: (_, r) => renderPerson(r.studentName, r.studentNo, r.studentId),
    },
    {
      title: '咨询师',
      key: 'counselor',
      render: (_, r) => r.counselorName || `用户${r.counselorId}`,
    },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
    {
      title: '时间段',
      key: 'timeSlot',
      render: (_, r) => r.timeSlotName || '-',
    },
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
        {editingId && (
          <p style={{ marginBottom: 12 }}>
            学生：{renderPerson(
              data.find((item) => item.id === editingId)?.studentName,
              data.find((item) => item.id === editingId)?.studentNo,
              data.find((item) => item.id === editingId)?.studentId,
            )}
          </p>
        )}
        <Form form={form} layout="vertical" initialValues={{ occupiedWeeks: 8 }}>
          {!editingId && (
            <Form.Item name="studentId" label="学生" rules={[{ required: true, message: '请选择学生' }]}>
              <Select
                showSearch
                placeholder="输入姓名或学号搜索"
                filterOption={false}
                onSearch={searchStudents}
                options={studentOptions}
                notFoundContent="输入关键字搜索学生"
              />
            </Form.Item>
          )}
          <Form.Item name="counselorId" label="咨询师" rules={[{ required: true, message: '请选择咨询师' }]}>
            <Select showSearch optionFilterProp="label" placeholder="选择咨询师"
              options={counselorOptions} />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotId" label="时间段" rules={[{ required: true, message: '请选择时段' }]}>
            <Select placeholder="选择时间段" options={timeSlotOptions} />
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
