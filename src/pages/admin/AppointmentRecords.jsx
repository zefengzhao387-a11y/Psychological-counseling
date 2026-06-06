import { useState, useEffect } from 'react'
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, message, Tag, AutoComplete, Space,
} from 'antd'
import { PlusOutlined, EditOutlined, FileAddOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'

export default function AppointmentRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [mode, setMode] = useState('add') // add | edit
  const [editingId, setEditingId] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [form] = Form.useForm()
  const [backupForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/appointment/first-visit/review-list', {
        params: { page: 1, size: 100 },
      })
      setData(res.data?.records || [])
    } finally { setLoading(false) }
  }

  const fetchTimeSlots = async () => {
    try {
      const res = await request.get('/v1/appointment/time-config')
      setTimeSlots(res.data || [])
    } catch {
      setTimeSlots([])
    }
  }

  useEffect(() => {
    fetchData()
    fetchTimeSlots()
  }, [])

  const searchStudent = async (keyword) => {
    if (!keyword?.trim()) {
      setStudentOptions([])
      return
    }
    try {
      const res = await request.get('/v1/appointment/first-visit/search-student', {
        params: { keyword: keyword.trim() },
      })
      const list = res.data || []
      setStudentOptions(list.map((s) => ({
        value: `${s.studentNo} ${s.studentName}`,
        label: `${s.studentNo} · ${s.studentName}${s.hasForm ? '' : '（无登记表）'}`,
        student: s,
      })))
    } catch {
      setStudentOptions([])
    }
  }

  const parseOptionalId = (value) => {
    if (value === undefined || value === null || value === '') return undefined
    const n = Number(value)
    return Number.isNaN(n) ? undefined : n
  }

  const handleReschedule = async () => {
    const values = await form.validateFields()
    await request.put('/v1/appointment/first-visit/reschedule', {
      appointmentId: editingId,
      visitorId: parseOptionalId(values.visitorId),
      appointmentDate: values.appointmentDate?.format('YYYY-MM-DD'),
      timeSlotId: values.timeSlotId,
      location: values.location,
    })
    message.success('改约成功')
    setOpen(false)
    setEditingId(null)
    fetchData()
  }

  const handleAdd = async () => {
    const values = await form.validateFields()
    if (!selectedStudent && !values.keyword?.trim()) {
      message.warning('请从下拉列表中选择学生')
      return
    }
    const payload = {
      keyword: selectedStudent ? undefined : values.keyword?.trim(),
      studentId: selectedStudent?.studentId,
      formId: selectedStudent?.formId,
      visitorId: parseOptionalId(values.visitorId),
      appointmentDate: values.appointmentDate?.format('YYYY-MM-DD'),
      timeSlotId: values.timeSlotId,
      location: values.location,
    }
    await request.post('/v1/appointment/first-visit/add', payload)
    message.success('新增成功，已自动匹配空闲初访员')
    setOpen(false)
    setSelectedStudent(null)
    form.resetFields()
    fetchData()
  }

  const handleBackup = async () => {
    const values = await backupForm.validateFields()
    await request.post('/v1/appointment/first-visit/backup', {
      keyword: values.keyword,
      studentId: selectedStudent?.studentId,
      studentName: values.studentName,
      studentNo: values.studentNo,
      visitorId: values.visitorId,
      appointmentDate: values.appointmentDate?.format('YYYY-MM-DD'),
      timeSlotId: values.timeSlotId,
      location: values.location,
      remark: values.remark,
    })
    message.success('补录备班成功')
    setBackupOpen(false)
    setSelectedStudent(null)
    backupForm.resetFields()
    fetchData()
  }

  const statusTag = (s) => {
    const map = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销' }
    const color = { 1: 'orange', 2: 'green', 3: 'red', 4: 'default' }
    return <Tag color={color[s]}>{map[s] || s}</Tag>
  }

  const timeSlotSelect = (
    <Select
      placeholder="选择时间段"
      options={timeSlots.map((t) => ({
        value: t.id,
        label: t.slotName || `时段 ${t.id}`,
      }))}
    />
  )

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
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
          setMode('edit')
          setEditingId(r.id)
          form.setFieldsValue({
            visitorId: r.visitorId,
            appointmentDate: r.appointmentDate ? dayjs(r.appointmentDate) : null,
            timeSlotId: r.timeSlotId,
            location: r.location,
          })
          setOpen(true)
        }}>改约</Button>
      ),
    },
  ]

  const onStudentSelect = (value, option) => {
    setSelectedStudent(option.student)
    if (mode === 'add') {
      form.setFieldsValue({ keyword: value })
    }
    if (backupOpen) {
      backupForm.setFieldsValue({
        keyword: value,
        studentName: option.student.studentName,
        studentNo: option.student.studentNo,
      })
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setMode('add')
          setEditingId(null)
          setSelectedStudent(null)
          form.resetFields()
          setOpen(true)
        }}>新增预约</Button>
        <Button icon={<FileAddOutlined />} onClick={() => {
          setSelectedStudent(null)
          backupForm.resetFields()
          setBackupOpen(true)
        }}>补录备班</Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        scroll={{ x: 900 }} pagination={{ pageSize: 20 }} />

      <Modal
        title={mode === 'edit' ? '改约' : '新增预约'}
        open={open}
        onOk={mode === 'edit' ? handleReschedule : handleAdd}
        onCancel={() => { setOpen(false); setEditingId(null); setSelectedStudent(null) }}
        width={520}
      >
        <Form form={form} layout="vertical">
          {mode === 'add' && (
            <Form.Item name="keyword" label="搜索学生（学号/姓名）" rules={[{ required: true }]}>
              <AutoComplete
                options={studentOptions}
                onSearch={searchStudent}
                onSelect={onStudentSelect}
                placeholder="输入学号或姓名搜索"
              />
            </Form.Item>
          )}
          <Form.Item name="visitorId" label="初访员ID（留空则自动匹配）">
            <Input placeholder="可选，指定初访员用户ID" />
          </Form.Item>
          <Form.Item name="appointmentDate" label="预约日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotId" label="时间段" rules={[{ required: true }]}>
            {timeSlotSelect}
          </Form.Item>
          <Form.Item name="location" label="咨询地点" rules={[{ required: true }]}>
            <Input placeholder="如：心理中心A101" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="补录备班"
        open={backupOpen}
        onOk={handleBackup}
        onCancel={() => { setBackupOpen(false); setSelectedStudent(null) }}
        width={520}
      >
        <Form form={backupForm} layout="vertical">
          <Form.Item name="keyword" label="搜索学生（学号/姓名）">
            <AutoComplete
              options={studentOptions}
              onSearch={searchStudent}
              onSelect={onStudentSelect}
              placeholder="已有学生可搜索；新来访者可手动填写下方信息"
            />
          </Form.Item>
          <Form.Item name="studentName" label="学生姓名（无档案时填写）">
            <Input />
          </Form.Item>
          <Form.Item name="studentNo" label="学号（无档案时填写）">
            <Input />
          </Form.Item>
          <Form.Item name="visitorId" label="初访员ID（留空则自动匹配）">
            <Input />
          </Form.Item>
          <Form.Item name="appointmentDate" label="预约日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotId" label="时间段" rules={[{ required: true }]}>
            {timeSlotSelect}
          </Form.Item>
          <Form.Item name="location" label="咨询地点" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
