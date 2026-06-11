import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Select, DatePicker, Modal, message, Tag, Empty, Result } from 'antd'
import dayjs from 'dayjs'
import request from '../../api/request'

const statusMap = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销', 5: '已完成' }
const statusColors = { 1: 'processing', 2: 'success', 3: 'error', 4: 'default', 5: 'default' }

const renderStatus = (r) => (
  <Tag color={statusColors[r.status]}>{r.statusDesc || statusMap[r.status] || r.status}</Tag>
)

const renderAction = (r, onCancel) => {
  if (r.status === 1) {
    return <Button type="link" danger onClick={() => onCancel(r.id)}>撤销</Button>
  }
  if (r.status === 2) {
    return <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>请按时赴约，初访员录入评估后自动完成</span>
  }
  if (r.status === 5) {
    return <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>初访已结束</span>
  }
  return null
}

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
  const [noConsent, setNoConsent] = useState(false)

  const silent = { silent: true }

  const fetchAvailable = useCallback(async (date, slotId) => {
    if (!slotId) { setAvailable([]); return }
    setLoading(true)
    try {
      const d = date || selectedDate
      const dateStr = dayjs.isDayjs(d) ? d.format('YYYY-MM-DD') : d
      const res = await request.get('/v1/appointment/duty-schedule/available', {
        ...silent,
        params: { date: dateStr, timeSlotId: slotId, counselorType: 1 },
      })
      setAvailable(res.data || [])
    } catch { setAvailable([]) } finally { setLoading(false) }
  }, [selectedDate])

  const fetchMyAppointments = async () => {
    try {
      const res = await request.get('/v1/appointment/first-visit/my', silent)
      setMyAppointments(res.data?.records || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      request.get('/v1/appointment/time-config', silent),
      request.get('/v1/appointment/form/latest', silent),
      request.get('/v1/appointment/first-visit/my', silent),
    ]).then(([slots, form, mine]) => {
      if (cancelled) return
      setTimeSlots(slots.data || [])
      if (form.data) {
        setLatestForm(form.data)
        setNoForm(false)
        setNoConsent(form.data.hasReadConsent !== 1)
      } else {
        setNoForm(true)
      }
      setMyAppointments(mine.data?.records || [])
    }).catch(() => {
      if (!cancelled) {
        message.error('预约服务暂不可用，请确认 appointment-service (8082) 已启动')
      }
    })
    return () => { cancelled = true }
  }, [])

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

  const closeBookingModal = () => {
    setShowModal(false)
    setSelectedSchedule(null)
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
      closeBookingModal()
      fetchMyAppointments()
      fetchAvailable(selectedDate, selectedSlot)
    } catch { /* ignore */ } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (id) => {
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
    { title: '状态', dataIndex: 'status', key: 'status', render: (_, r) => renderStatus(r) },
    { title: '提交时间', dataIndex: 'createTime', key: 'createTime' },
    {
      title: '操作', key: 'action', width: 220,
      render: (_, r) => renderAction(r, handleRevoke),
    },
  ]

  if (noForm || noConsent) {
    return (
      <Result
        status="warning"
        title={noForm ? '请先填写首访登记表' : '请先确认知情同意书'}
        subTitle={noForm
          ? '您需要先完成首访登记表和知情同意书确认，才能进行初访预约。'
          : '请返回首访登记表页面，阅读并确认知情同意书后再预约。'}
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
        onCancel={closeBookingModal}
        destroyOnClose
        maskClosable={!submitting}
        closable={!submitting}
        cancelButtonProps={{ disabled: submitting }}>
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
