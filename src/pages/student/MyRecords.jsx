import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, message, Popconfirm, Empty, Tabs } from 'antd'
import request from '../../api/request'

const statusMap = { 1: '待审核', 2: '已通过', 3: '已拒绝', 4: '已撤销', 5: '初访已完成' }
const statusColors = { 1: 'processing', 2: 'success', 3: 'error', 4: 'default', 5: 'default' }

const crisisMap = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
const problemMap = { 1: '学业', 2: '情绪', 3: '人际', 4: '恋爱', 5: '职业', 6: '成长', 7: '家庭', 8: '其他' }
const conclusionMap = { 1: '无需咨询', 2: '安排咨询', 3: '转介送诊' }

export default function MyRecords() {
  const [data, setData] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('appointments')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [apptRes, evalRes] = await Promise.allSettled([
        request.get('/v1/appointment/first-visit/my'),
        request.get('/v1/consultation/result/student/my', { silent: true }),
      ])
      if (apptRes.status === 'fulfilled') {
        setData(apptRes.value.data?.records || [])
      } else {
        setData([])
      }
      if (evalRes.status === 'fulfilled') {
        setEvaluations(evalRes.value.data || [])
      } else {
        setEvaluations([])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCancel = async (id) => {
    try {
      await request.put(`/v1/appointment/first-visit/cancel/${id}`)
      message.success('预约已撤销')
      fetchData()
    } catch { /* ignore */ }
  }

  const appointmentColumns = [
    { title: '预约日期', dataIndex: 'appointmentDate', key: 'date', width: 120 },
    { title: '时段', dataIndex: 'timeSlotName', key: 'slot', width: 140 },
    { title: '地点', dataIndex: 'location', key: 'location', width: 120,
      render: (v) => v || <span style={{ color: '#ccc' }}>待定</span> },
    { title: '初访员', dataIndex: 'visitorName', key: 'visitor', width: 100,
      render: (v) => v || <Tag>待分配</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (_, r) => <Tag color={statusColors[r.status]}>{r.statusDesc || statusMap[r.status] || r.status}</Tag> },
    { title: '总分', dataIndex: 'totalScore', key: 'score', width: 60 },
    { title: '紧急', dataIndex: 'isUrgent', key: 'urgent', width: 60,
      render: (v) => v === 1 ? <Tag color="red">是</Tag> : <Tag>否</Tag> },
    { title: '提交时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    {
      title: '操作', key: 'action', width: 220,
      render: (_, r) => {
        if (r.status === 1) {
          return (
            <Popconfirm title="确认撤销此预约？" onConfirm={() => handleCancel(r.id)}>
              <Button type="link" danger>撤销</Button>
            </Popconfirm>
          )
        }
        if (r.status === 2) {
          return <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>请按时赴约，初访员录入评估后自动完成</span>
        }
        if (r.status === 5) {
          return <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>初访评估已录入，可在「评估结果」查看</span>
        }
        return null
      },
    },
  ]

  const evaluationColumns = [
    { title: '初访时间', dataIndex: 'visitTime', key: 'visitTime', width: 170 },
    { title: '危机等级', dataIndex: 'crisisLevel', key: 'crisisLevel', width: 90,
      render: (v) => crisisMap[v] || v },
    { title: '问题类型', dataIndex: 'problemType', key: 'problemType', width: 100,
      render: (v) => problemMap[v] || v },
    { title: '初访结论', dataIndex: 'conclusion', key: 'conclusion', width: 110,
      render: (v) => {
        const color = { 1: 'default', 2: 'blue', 3: 'orange' }
        return <Tag color={color[v]}>{conclusionMap[v] || v}</Tag>
      } },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ]

  return (
    <Card title="我的预约记录">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'appointments', label: `初访预约 (${data.length})` },
        { key: 'evaluations', label: `评估结果 (${evaluations.length})` },
      ]} />

      {activeTab === 'appointments' && (
        data.length === 0 && !loading ? (
          <Empty description="暂无预约记录" />
        ) : (
          <Table rowKey="id" columns={appointmentColumns} dataSource={data} loading={loading}
            pagination={false} scroll={{ x: 1000 }} />
        )
      )}

      {activeTab === 'evaluations' && (
        evaluations.length === 0 && !loading ? (
          <Empty description="初访评估完成后会在此显示结论（不含详细咨询记录）" />
        ) : (
          <Table rowKey="id" columns={evaluationColumns} dataSource={evaluations} loading={loading}
            pagination={false} scroll={{ x: 800 }} />
        )
      )}
    </Card>
  )
}
