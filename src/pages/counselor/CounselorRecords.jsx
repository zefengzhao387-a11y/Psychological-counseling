import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Drawer, Form, Select, DatePicker, Input, message, Tag, Timeline, Empty } from 'antd'
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'

const { TextArea } = Input

/** 咨询记录状态选项 */
const STATUS_OPTIONS = [
  { value: 1, label: '完成咨询', color: 'green' },
  { value: 2, label: '旷约', color: 'orange' },
  { value: 3, label: '请假', color: 'blue' },
  { value: 4, label: '脱落', color: 'red' },
  { value: 5, label: '结案', color: 'purple' },
]

const statusTag = (v) => {
  const opt = STATUS_OPTIONS.find((o) => o.value === v)
  if (!opt) return <Tag>{v}</Tag>
  return <Tag color={opt.color}>{opt.label}</Tag>
}

const statusLabel = (v) => {
  const opt = STATUS_OPTIONS.find((o) => o.value === v)
  return opt?.label || v
}

/**
 * 咨询师端 — 咨询记录
 * 咨询师查看分配给自己的咨询安排，录入每次咨询的状态和内容
 */
export default function CounselorRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // 查看记录抽屉
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentApp, setCurrentApp] = useState(null)
  const [records, setRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)

  // 录入表单
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const counselorId = Number(localStorage.getItem('userId'))

  /** 加载我的咨询安排 */
  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/records', {
        params: { page, size: 10, counselorId },
      })
      setData(res.data?.records || [])
      setTotal(res.data?.total || 0)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [page, counselorId])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  /** 打开查看记录抽屉 */
  const openRecords = async (item) => {
    setCurrentApp(item)
    setRecordsLoading(true)
    try {
      const res = await request.get(`/v1/consultation/record/${item.id}`)
      setRecords(res.data || [])
    } catch {
      setRecords([])
    } finally {
      setRecordsLoading(false)
    }
    // 预填表单
    const nextSession = (item.remainingWeeks != null)
      ? (item.occupiedWeeks || 8) - (item.remainingWeeks || 0) + 1
      : 1
    form.setFieldsValue({
      appointmentId: item.id,
      sessionNumber: nextSession,
      consultDate: dayjs(),
      status: undefined,
    })
    setDrawerOpen(true)
  }

  /** 提交咨询记录 */
  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await request.post('/v1/consultation/record', {
        appointmentId: values.appointmentId,
        sessionNumber: values.sessionNumber,
        consultDate: values.consultDate.format('YYYY-MM-DD'),
        status: values.status,
        content: values.content || '',
        counselorNote: values.counselorNote || '',
      })
      message.success('咨询记录已录入')
      form.resetFields()
      // 重新加载记录和安排列表
      if (currentApp) openRecords(currentApp)
      fetchAppointments()
    } catch {
      // 拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: '安排ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '学生ID', dataIndex: 'studentId', key: 'studentId', width: 80 },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 110 },
    { title: '地点', dataIndex: 'location', key: 'location', width: 130, ellipsis: true },
    {
      title: '周数', key: 'weeks', width: 80,
      render: (_, r) => `${r.remainingWeeks || 0}/${r.occupiedWeeks || 8}`,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => {
        const map = { 1: '进行中', 2: '已结案', 3: '已脱落' }
        const color = { 1: 'blue', 2: 'green', 3: 'red' }
        return <Tag color={color[v]}>{map[v] || v}</Tag>
      },
    },
    {
      title: '操作', key: 'action', fixed: 'right', width: 120,
      render: (_, record) => (
        <Button type="primary" size="small" icon={<UnorderedListOutlined />}
          onClick={() => openRecords(record)}>
          查看记录
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        scroll={{ x: 750 }}
        pagination={{ current: page, total, pageSize: 10, onChange: setPage }} />

      {/* 咨询记录抽屉 */}
      <Drawer title={`咨询记录 — 安排 #${currentApp?.id || ''}`} open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setCurrentApp(null) }}
        width={600}>
        {currentApp && (
          <div style={{ marginBottom: 24 }}>
            <p>学生ID：{currentApp.studentId}　开始日期：{currentApp.startDate}　地点：{currentApp.location}</p>
            <p>剩余周数：{currentApp.remainingWeeks}/{currentApp.occupiedWeeks || 8}
              {currentApp.status === 2 && <Tag color="green" style={{ marginLeft: 8 }}>已结案</Tag>}
              {currentApp.status === 3 && <Tag color="red" style={{ marginLeft: 8 }}>已脱落</Tag>}
            </p>
          </div>
        )}

        {/* 录入新记录 */}
        {currentApp && currentApp.status === 1 && (
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16, marginBottom: 24, background: '#fafafa' }}>
            <h4><PlusOutlined /> 录入本次咨询</h4>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="appointmentId" hidden><Input /></Form.Item>

              <Form.Item name="sessionNumber" label="第几次咨询"
                rules={[{ required: true, message: '请输入次数' }]}>
                <Input type="number" min={1} placeholder="如：3" />
              </Form.Item>

              <Form.Item name="consultDate" label="咨询日期"
                rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="status" label="本次状态"
                rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择" options={STATUS_OPTIONS} />
              </Form.Item>

              <Form.Item name="content" label="咨询内容">
                <TextArea rows={3} placeholder="本次咨询的主要内容" maxLength={1000} showCount />
              </Form.Item>

              <Form.Item name="counselorNote" label="咨询师备注">
                <TextArea rows={2} placeholder="咨询师的观察与备注" maxLength={500} showCount />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={submitting} block>
                提交记录
              </Button>
            </Form>
          </div>
        )}

        {/* 已有记录 */}
        {recordsLoading ? (
          <p>加载中...</p>
        ) : records.length === 0 ? (
          <Empty description="暂无咨询记录" />
        ) : (
          <Timeline items={records.map((r, i) => ({
            key: r.id || i,
            color: STATUS_OPTIONS.find(o => o.value === r.status)?.color || 'gray',
            children: (
              <div>
                <p><strong>第{r.sessionNumber}次</strong> — {r.consultDate} — {statusTag(r.status)}</p>
                {r.content && <p style={{ color: '#666' }}>{r.content}</p>}
                {r.counselorNote && <p style={{ color: '#999', fontSize: 13 }}>备注：{r.counselorNote}</p>}
              </div>
            ),
          }))} />
        )}
      </Drawer>
    </div>
  )
}
