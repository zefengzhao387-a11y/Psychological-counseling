import { useState, useEffect } from 'react'
import { Table, Button, Modal, Select, Input, message, Tag, Tabs } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined, ArrowUpOutlined } from '@ant-design/icons'
import request from '../../api/request'

export default function AppointmentReview() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState('1') // 默认看待审核
  const [reviewOpen, setReviewOpen] = useState(false)
  const [currentApp, setCurrentApp] = useState(null)
  const [visitorId, setVisitorId] = useState(null)
  const [location, setLocation] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const status = activeTab === 'all' ? undefined : Number(activeTab)
      const res = await request.get('/v1/appointment/first-visit/review-list', {
        params: { page, size: 10, status },
      })
      setData(res.data?.records || [])
      setTotal(res.data?.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, activeTab])

  /** 审核通过 */
  const handleApprove = async () => {
    if (!visitorId || !location) { message.warning('请选择初访员和填写地点'); return }
    try {
      await request.post('/v1/appointment/first-visit/review', {
        appointmentId: currentApp.id,
        status: 2, // 通过
        visitorId, location,
      })
      message.success('已通过，短信已通知学生')
      setReviewOpen(false); setCurrentApp(null); fetchData()
    } catch { }
  }

  /** 审核拒绝 */
  const handleReject = async (id) => {
    await request.post('/v1/appointment/first-visit/review', { appointmentId: id, status: 3 })
    message.success('已拒绝')
    fetchData()
  }

  /** 切换优先排队 */
  const togglePriority = async (id) => {
    await request.put(`/v1/appointment/first-visit/toggle-priority/${id}`)
    message.success('已切换优先状态')
    fetchData()
  }

  const statusTag = (s) => {
    const map = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销' }
    const color = { 1: 'orange', 2: 'green', 3: 'red', 4: 'default' }
    return <Tag color={color[s]}>{map[s] || s}</Tag>
  }

  const columns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 80 },
    { title: '预约日期', dataIndex: 'appointmentDate', key: 'appointmentDate', width: 110 },
    { title: '时段', dataIndex: 'timeSlotName', key: 'timeSlotName', width: 100 },
    { title: '总分', dataIndex: 'totalScore', key: 'totalScore', width: 60 },
    {
      title: '报警', dataIndex: 'isUrgent', key: 'isUrgent', width: 70,
      render: (v) => v === 1 ? <Tag color="red">紧急</Tag> : <Tag>正常</Tag>,
    },
    {
      title: '优先', dataIndex: 'isPriority', key: 'isPriority', width: 70,
      render: (v) => v === 1 ? <Tag color="volcano">优先</Tag> : null,
    },
    { title: '初访员', dataIndex: 'visitorName', key: 'visitorName', width: 80 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: statusTag },
    {
      title: '操作', key: 'action', fixed: 'right', width: 220,
      render: (_, record) => (
        <>
          {record.status === 1 && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />}
                onClick={() => { setCurrentApp(record); setReviewOpen(true) }}>审核</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}>拒绝</Button>
              <Button type="link" size="small" icon={<ArrowUpOutlined />}
                onClick={() => togglePriority(record.id)}>
                {record.isPriority === 1 ? '取消优先' : '优先'}
              </Button>
            </>
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: '1', label: '待审核' },
        { key: '2', label: '已通过' },
        { key: '3', label: '已拒绝' },
        { key: 'all', label: '全部' },
      ]} />

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ current: page, total, pageSize: 10, onChange: setPage }} />

      <Modal title="审核预约" open={reviewOpen} onOk={handleApprove}
        onCancel={() => { setReviewOpen(false); setCurrentApp(null) }}>
        <p>学生：{currentApp?.studentName}（{currentApp?.studentNo}）</p>
        <p>日期：{currentApp?.appointmentDate}　时段：{currentApp?.timeSlotName}</p>
        <p>问卷总分：{currentApp?.totalScore}
          {currentApp?.isUrgent === 1 && <Tag color="red" style={{ marginLeft: 8 }}>紧急报警</Tag>}
        </p>
        <div style={{ marginTop: 16 }}>
          <label>分配初访员ID：</label>
          <Select style={{ width: '100%' }} placeholder="输入初访员ID"
            onChange={setVisitorId} value={visitorId} showSearch />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>咨询地点：</label>
          <Input placeholder="如：心理中心A101" onChange={(e) => setLocation(e.target.value)} value={location} />
        </div>
      </Modal>
    </div>
  )
}
