import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Table, Form, Select, Input, message, Statistic } from 'antd'
import { DownloadOutlined, SearchOutlined, FileExcelOutlined } from '@ant-design/icons'
import axios from 'axios'
import CountUp from '../../components/CountUp'
import BlurText from '../../components/BlurText'
import request from '../../api/request'

const PROBLEM_TYPE_MAP = {
  1: '学业问题', 2: '情绪问题', 3: '人际关系', 4: '恋爱问题',
  5: '职业发展', 6: '自我成长', 7: '家庭问题', 8: '其他',
}

export default function Statistics() {
  const [summary, setSummary] = useState({
    totalReports: 0,
    draftCount: 0,
    approvedCount: 0,
    counselorCount: 0,
  })
  const [queryResult, setQueryResult] = useState([])
  const [counselorStats, setCounselorStats] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [queryForm] = Form.useForm()

  const statCards = [
    { title: '结案报告总数', key: 'totalReports', delay: 0 },
    { title: '草稿/进行中', key: 'draftCount', delay: 0.08 },
    { title: '已审核结案', key: 'approvedCount', delay: 0.16 },
    { title: '咨询师数', key: 'counselorCount', delay: 0.24 },
  ]

  const loadOverview = async () => {
    try {
      const [summaryRes, counselorRes] = await Promise.all([
        request.get('/v1/statistics/summary'),
        request.get('/v1/statistics/counselor'),
      ])
      const summaryData = summaryRes.data || {}
      const counselors = counselorRes.data || []
      setSummary({
        totalReports: Number(summaryData.totalReports || 0),
        draftCount: Number(summaryData.draftCount || 0),
        approvedCount: Number(summaryData.approvedCount || 0),
        counselorCount: counselors.length,
      })
      setCounselorStats(counselors)
    } catch {
      setSummary({ totalReports: 0, draftCount: 0, approvedCount: 0, counselorCount: 0 })
      setCounselorStats([])
    }
  }

  useEffect(() => { loadOverview() }, [])

  const handleQuery = async (values) => {
    setLoading(true)
    setSelectedRowKeys([])
    try {
      const res = await request.get('/v1/statistics/list', {
        params: { ...values, page: 1, size: 50 },
      })
      setQueryResult(res.data?.records || [])
    } catch {
      setQueryResult([])
    } finally { setLoading(false) }
  }

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const values = queryForm.getFieldsValue()
      const res = await axios.get('/api/v1/statistics/export', {
        params: { ...values, export: true },
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const blob = res.data
      if (blob.type?.includes('json')) {
        const text = await blob.text()
        const err = JSON.parse(text)
        throw new Error(err.message || '导出失败')
      }
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `statistics-${Date.now()}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('Excel 已导出')
    } catch (e) {
      message.error(e.message || '导出失败，请确认 statistics-service 已启动')
    }
  }

  const handleBatchDownload = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要下载的结案报告')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/v1/statistics/download',
        { ids: selectedRowKeys },
        {
          responseType: 'blob',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `closing-reports-${Date.now()}.zip`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('批量下载已开始')
    } catch {
      message.error('批量下载失败，请确认 statistics-service 已启动')
    }
  }

  const reportColumns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName' },
    { title: '问题类型', dataIndex: 'problemType', key: 'problemType',
      render: (v) => PROBLEM_TYPE_MAP[v] || v },
    { title: '咨询次数', dataIndex: 'totalSessions', key: 'totalSessions' },
    { title: '总时长(h)', dataIndex: 'totalHours', key: 'totalHours' },
    { title: '结案日期', dataIndex: 'closingDate', key: 'closingDate' },
    { title: '状态', dataIndex: 'status', key: 'status' },
  ]

  const counselorColumns = [
    { title: '咨询师ID', dataIndex: 'counselorId', key: 'counselorId' },
    { title: '报告数', dataIndex: 'totalReports', key: 'totalReports' },
    { title: '已结案', dataIndex: 'closedCount', key: 'closedCount' },
    { title: '脱落数', dataIndex: 'dropoutCount', key: 'dropoutCount' },
    { title: '总时长(h)', dataIndex: 'totalHours', key: 'totalHours' },
  ]

  return (
    <div>
      <p className="page-intro">
        <BlurText text="数据概览与汇总查询" animateBy="words" delay={80} />
      </p>
      <Row gutter={[16, 16]}>
        {statCards.map((item) => (
          <Col span={6} key={item.title}>
            <Card className="stat-card">
              <Statistic
                title={item.title}
                value={summary[item.key]}
                formatter={() => (
                  <CountUp
                    to={summary[item.key]}
                    duration={1.4}
                    delay={item.delay}
                    className="stat-card__value"
                  />
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="汇总查询" style={{ marginTop: 16 }}>
        <Form form={queryForm} layout="inline" onFinish={handleQuery} style={{ marginBottom: 16 }}>
          <Form.Item name="studentName"><Input placeholder="学生姓名" /></Form.Item>
          <Form.Item name="studentNo"><Input placeholder="学号" /></Form.Item>
          <Form.Item name="problemType">
            <Select placeholder="问题类型" allowClear style={{ width: 120 }}
              options={Object.entries(PROBLEM_TYPE_MAP).map(([value, label]) => ({ value: Number(value), label }))} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>查询</Button>
          </Form.Item>
        </Form>
        <Table
          rowKey="id"
          columns={reportColumns}
          dataSource={queryResult}
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Card>

      <Card title="咨询师工作量" style={{ marginTop: 16 }}>
        <Table rowKey="counselorId" columns={counselorColumns} dataSource={counselorStats}
          pagination={{ pageSize: 10 }} />
      </Card>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel}>导出 Excel 统计</Button>
        <Button icon={<DownloadOutlined />} onClick={handleBatchDownload}>
          批量下载结案报告{selectedRowKeys.length > 0 ? `（${selectedRowKeys.length}）` : ''}
        </Button>
      </div>
    </div>
  )
}
