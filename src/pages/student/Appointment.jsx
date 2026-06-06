import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Select, DatePicker, Modal, message, Tag, Empty, Result } from 'antd'
import dayjs from 'dayjs'
import request from '../../api/request'

const statusMap = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销' }
const statusColors = { 1: 'processing', 2: 'success', 3: 'error', 4: 'default' }

export default function StudentAppointment() {
  const [timeSlots, setTimeSlots] = useState([])
  const [available, setAvailable] = useState([])
  const [myAppointments, setMyAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [latestForm, setLatestForm] = useState(null)
  const [noForm, setNoForm] = useState(false)

  const fetchTimeSlots = async () => {
    try {
      const res = await request.get('/v1/appointment/time-config')
      setTimeSlots(res.data || [])
    } catch { /* ignore */ }
  }

  const fetchLatestForm = async () => {
    try {
      const res = await request.get('/v1/appointment/form/latest')
      if (res.data) {
        setLatestForm(res.data)
        setNoForm(false)
      } else {
        setNoForm(true)
      }
    } catch { /* ignore */ }
  }

  const fetchAvailable = useCallback(async (date, slotId) => {
    if (!slotId) { setAvailable([]); return }
    setLoading(true)
    try {
      const d = date || selectedDate
      const dateStr = dayjs.isDayjs(d) ? d.format('YYYY-MM-DD') : d
      const res = await request.get('/v1/appointment/duty-schedule/available', {
        params: { date: dateStr, timeSlotId: slotId },
      })
      setAvailable(res.data || [])
    } catch { setAvailable([]) } finally { setLoading(false) }
  }, [selectedDate])

  const fetchMyAppointments = async () => {
    try {
      const res = await request.get('/v1/appointment/first-visit/my')
      setMyAppointments(res.data?.records || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchTimeSlots(); fetchLatestForm(); fetchMyAppointments() }, [])

  const handleDateChange = (d) => {
    setSelectedDate(d)
    if (selectedSlot) fetchAvailable(d, selectedSlot)
  }

  const handleSlotChange = (slotId) => {
    setSelectedSlot(slotId)
    if (selectedDate) fetchAvailable(selectedDate, slotId)
  }

  const handleBook = (record) => {
    setSelectedSchedule(record)
    setShowModal(true)
  }

  const handleSubmitBooking = async () => {
    if (!latestForm?.id) {
      message.warning('请先填写首访登记表')
      return
    }
    setSubmitting(true)
    try {
      await request.post('/v1/appointment/first-visit/submit', {
        formId: latestForm.id,
        dutyScheduleId: selectedSchedule.id,
        appointmentDate: selectedDate.format('YYYY-MM-DD'),
        timeSlotId: selectedSlot,
      })
      message.success('预约提交成功，等待管理员审核')
      setShowModal(false)
      fetchMyAppointments()
      fetchAvailable(selectedDate, selectedSlot)
    } catch { /* ignore */ } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    try {
      await request.put(`/v1/appointment/first-visit/cancel/${id}`)
      message.success('已撤销')
      fetchMyAppointments()
      fetchAvailable(selectedDate, selectedSlot)
    } catch { /* ignore */ }
  }

  const availableColumns = [
    { title: '老师ID', dataIndex: 'counselorId', key: 'counselorId', width: 100 },
    { title: '已约/上限', key: 'capacity', width: 100,
      render: (_, r) => <span>{r.bookedCount} / {r.maxAppointments}</span> },
    { title: '状态', key: 'status', width: 80,
      render: (_, r) => r.bookedCount >= r.maxAppointments
        ? <Tag color="red">已满</Tag>
        : <Tag color="green">可预约</Tag> },
    { title: '操作', key: 'action', width: 80,
      render: (_, r) => (
        <Button type="primary" size="small" disabled={r.bookedCount >= r.maxAppointments}
          onClick={() => handleBook(r)}>
          预约
        </Button>
      ),
    },
  ]

  const myColumns = [
    { title: '日期', dataIndex: 'appointmentDate', key: 'date' },
    { title: '时段', dataIndex: 'timeSlotName', key: 'slot' },
    { title: '初访员', dataIndex: 'visitorName', key: 'visitor',
      render: (v) => v || <Tag>待分配</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (v) => <Tag color={statusColors[v]}>{statusMap[v] || v}</Tag> },
    { title: '提交时间', dataIndex: 'createTime', key: 'createTime' },
    {
      title: '操作', key: 'action',
      render: (_, r) => r.status === 1 ? (
        <Button type="link" danger onClick={() => handleCancel(r.id)}>撤销</Button>
      ) : null,
    },
  ]

  if (noForm) {
    return (
      <Result
        status="warning"
        title="请先填写首访登记表"
        subTitle="您需要先完成首访登记表和知情同意书确认，才能进行初访预约。"
        extra={
          <Button type="primary" onClick={() => window.location.href = '/student/form'}>
            前往填写
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <Card title="选择时间" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <DatePicker value={selectedDate} onChange={handleDateChange}
            disabledDate={(d) => d && d.isBefore(dayjs(), 'day')} />
          <Select
            placeholder="选择时间段"
            style={{ minWidth: 180 }}
            value={selectedSlot}
            onChange={handleSlotChange}
            allowClear
            options={timeSlots.map((t) => ({ value: t.id, label: t.slotName }))}
          />
          {latestForm && (
            <Tag color="blue">登记表ID: {latestForm.id}</Tag>
          )}
        </div>

        <Table
          rowKey="id"
          columns={availableColumns}
          dataSource={available}
          loading={loading}
          pagination={false}
          locale={{ emptyText: selectedSlot ? '该时段暂无空闲老师' : '请先选择时间段' }}
          size="small"
        />
      </Card>

      <Card title="我的预约记录">
        {myAppointments.length === 0 ? (
          <Empty description="暂无预约记录" />
        ) : (
          <Table rowKey="id" columns={myColumns} dataSource={myAppointments}
            pagination={false} size="small" />
        )}
      </Card>

      <Modal title="确认预约信息" open={showModal}
        onOk={handleSubmitBooking} confirmLoading={submitting}
        onCancel={() => setShowModal(false)}>
        <div style={{ color: '#666', marginBottom: 16, lineHeight: 2 }}>
          <div>登记表ID：<strong>{latestForm?.id}</strong></div>
          <div>预约日期：<strong>{selectedDate?.format('YYYY-MM-DD')}</strong></div>
          <div>时间段：<strong>{timeSlots.find((t) => t.id === selectedSlot)?.slotName || '未选择'}</strong></div>
          <div>老师ID：<strong>{selectedSchedule?.counselorId}</strong></div>
        </div>
      </Modal>
    </div>
  )
}
