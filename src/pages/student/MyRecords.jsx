import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, message, Popconfirm, Empty } from 'antd'
import request from '../../api/request'

const statusMap = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销' }
const statusColors = { 1: 'processing', 2: 'success', 3: 'error', 4: 'default' }

export default function MyRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/appointment/first-visit/my')
      setData(res.data?.records || [])
    } catch { setData([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCancel = async (id) => {
    try {
      await request.put(`/v1/appointment/first-visit/cancel/${id}`)
      message.success('预约已撤销')
      fetchData()
    } catch { /* ignore */ }
  }

  const columns = [
    { title: '登记表ID', dataIndex: 'formId', key: 'formId', width: 100 },
    { title: '预约日期', dataIndex: 'appointmentDate', key: 'date', width: 120 },
    { title: '时段', dataIndex: 'timeSlotName', key: 'slot', width: 140 },
    { title: '地点', dataIndex: 'location', key: 'location', width: 120,
      render: (v) => v || <span style={{ color: '#ccc' }}>待定</span> },
    { title: '初访员', dataIndex: 'visitorName', key: 'visitor', width: 100,
      render: (v) => v || <Tag>待分配</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => <Tag color={statusColors[v]}>{statusMap[v] || v}</Tag> },
    { title: '总分', dataIndex: 'totalScore', key: 'score', width: 60 },
    { title: '紧急', dataIndex: 'isUrgent', key: 'urgent', width: 60,
      render: (v) => v === 1 ? <Tag color="red">是</Tag> : <Tag>否</Tag> },
    { title: '提交时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, r) => r.status === 1 ? (
        <Popconfirm title="确认撤销此预约？" onConfirm={() => handleCancel(r.id)}>
          <Button type="link" danger>撤销</Button>
        </Popconfirm>
      ) : null,
    },
  ]

  return (
    <Card title="我的预约记录">
      {data.length === 0 ? (
        <Empty description="暂无预约记录" />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
          pagination={false} scroll={{ x: 1100 }} />
      )}
    </Card>
  )
}
