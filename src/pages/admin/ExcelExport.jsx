import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Button, Table, Form, Select, DatePicker, message, Space, Tag,
  Descriptions, Divider, Statistic,
} from 'antd'
import {
  FileExcelOutlined, DownloadOutlined, ReloadOutlined, SearchOutlined,
  TeamOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import request from '../../api/request'
import CountUp from '../../components/CountUp'

const PROBLEM_TYPE_MAP = {
  1: '学业问题', 2: '情绪问题', 3: '人际关系', 4: '恋爱问题',
  5: '职业发展', 6: '自我成长', 7: '家庭问题', 8: '其他',
}

export default function ExcelExport() {
  const [counselorStats, setCounselorStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [exportingType, setExportingType] = useState(null) // 'report' | 'counselor' | null
  const [form] = Form.useForm()
  const [overview, setOverview] = useState({ totalCounselors: 0, totalReports: 0, totalClosed: 0, totalHours: '0.00' })

  /** 加载咨询师统计数据 */
  const loadCounselorStats = async (values = {}) => {
    setLoading(true)
    try {
      const params = { ...values }
      if (params.closingDateStart) params.closingDateStart = params.closingDateStart.format('YYYY-MM-DD HH:mm:ss')
      if (params.closingDateEnd) params.closingDateEnd = params.closingDateEnd.format('YYYY-MM-DD HH:mm:ss')

      const res = await request.get('/v1/statistics/counselor', { params })
      const data = res.data || []
      setCounselorStats(data)

      // 计算概览
      const totalReports = data.reduce((sum, d) => sum + Number(d.totalReports || 0), 0)
      const totalClosed = data.reduce((sum, d) => sum + Number(d.closedCount || 0), 0)
      const totalHours = data.reduce((sum, d) => sum + (Number(d.totalHours) || 0), 0)
      setOverview({
        totalCounselors: data.length,
        totalReports,
        totalClosed,
        totalHours: totalHours.toFixed(2),
      })
    } catch {
      setCounselorStats([])
      setOverview({ totalCounselors: 0, totalReports: 0, totalClosed: 0, totalHours: '0.00' })
    } finally { setLoading(false) }
  }

  useEffect(() => { loadCounselorStats() }, [])

  /** 查询 */
  const handleSearch = () => {
    const values = form.getFieldsValue()
    loadCounselorStats(values)
  }

  /** 重置 */
  const handleReset = () => {
    form.resetFields()
    loadCounselorStats()
  }

  /** 下载 Blob 文件 */
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /** 导出结案报告 Excel */
  const handleExportReports = async () => {
    setExportingType('report')
    try {
      const token = localStorage.getItem('token')
      const values = form.getFieldsValue()
      const params = { ...values, export: true }
      if (params.closingDateStart) params.closingDateStart = params.closingDateStart.format('YYYY-MM-DD HH:mm:ss')
      if (params.closingDateEnd) params.closingDateEnd = params.closingDateEnd.format('YYYY-MM-DD HH:mm:ss')

      const res = await axios.get('/api/v1/statistics/export', {
        params,
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      // 检查是否返回了 JSON 错误
      if (res.data.type?.includes('json')) {
        const text = await res.data.text()
        const err = JSON.parse(text)
        throw new Error(err.message || '导出失败')
      }

      const filename = `结案报告导出_${new Date().toISOString().slice(0, 10)}.xlsx`
      downloadBlob(res.data, filename)
      message.success(`结案报告 Excel 导出成功`)
    } catch (e) {
      message.error(e.message || '导出失败，请确认 statistics-service 已启动')
    } finally { setExportingType(null) }
  }

  /** 导出咨询师统计 Excel */
  const handleExportCounselor = async () => {
    if (counselorStats.length === 0) {
      message.warning('当前无咨询师统计数据，请先查询')
      return
    }
    setExportingType('counselor')
    try {
      const token = localStorage.getItem('token')
      const values = form.getFieldsValue()
      const params = { ...values }
      if (params.closingDateStart) params.closingDateStart = params.closingDateStart.format('YYYY-MM-DD HH:mm:ss')
      if (params.closingDateEnd) params.closingDateEnd = params.closingDateEnd.format('YYYY-MM-DD HH:mm:ss')

      const res = await axios.get('/api/v1/statistics/export/counselor', {
        params,
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (res.data.type?.includes('json')) {
        const text = await res.data.text()
        const err = JSON.parse(text)
        throw new Error(err.message || '导出失败')
      }

      const filename = `咨询师工作量统计_${new Date().toISOString().slice(0, 10)}.xlsx`
      downloadBlob(res.data, filename)
      message.success(`咨询师统计 Excel 导出成功`)
    } catch (e) {
      message.error(e.message || '导出失败，请确认 statistics-service 已启动')
    } finally { setExportingType(null) }
  }

  /** 解析问题类型分布 JSON 为可读文本 */
  const parseProblemBreakdown = (jsonStr) => {
    if (!jsonStr) return '-'
    try {
      const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')
    } catch { return jsonStr }
  }

  const overviewCards = [
    { title: '咨询师人数', key: 'totalCounselors', icon: <TeamOutlined />, color: '#1677ff' },
    { title: '报告总数', key: 'totalReports', icon: <FileExcelOutlined />, color: '#52c41a' },
    { title: '已结案数', key: 'totalClosed', icon: <DownloadOutlined />, color: '#722ed1' },
    { title: '总时长(h)', key: 'totalHours', icon: <ClockCircleOutlined />, color: '#13c2c2' },
  ]

  const counselorColumns = [
    { title: '序号', key: 'index', width: 60, render: (_, __, i) => i + 1 },
    { title: '咨询师ID', dataIndex: 'counselorId', key: 'counselorId', width: 100 },
    { title: '报告总数（人次）', dataIndex: 'totalReports', key: 'totalReports', width: 140,
      sorter: (a, b) => Number(a.totalReports) - Number(b.totalReports),
      render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '已结案数', dataIndex: 'closedCount', key: 'closedCount', width: 100,
      render: (v) => <Tag color="green">{v}</Tag> },
    { title: '脱落数', dataIndex: 'dropoutCount', key: 'dropoutCount', width: 90,
      render: (v) => <Tag color="orange">{v}</Tag> },
    { title: '总咨询时长（小时）', dataIndex: 'totalHours', key: 'totalHours', width: 150,
      sorter: (a, b) => Number(a.totalHours) - Number(b.totalHours),
      render: (v) => {
        const num = Number(v)
        return <span style={{ fontWeight: 600, color: '#1677ff' }}>{num.toFixed(2)}</span>
      }},
    { title: '人均时长（小时）', key: 'avgHours', width: 130,
      render: (_, r) => {
        const total = Number(r.totalReports) || 1
        const hours = Number(r.totalHours) || 0
        return (hours / total).toFixed(2)
      }},
    { title: '问题类型分布', dataIndex: 'problemTypeBreakdown', key: 'problemTypeBreakdown',
      ellipsis: true, width: 300,
      render: (v) => <span style={{ fontSize: 12 }}>{parseProblemBreakdown(v)}</span> },
  ]

  return (
    <div>
      {/* 概览卡片 */}
      <Row gutter={[16, 16]}>
        {overviewCards.map((item) => (
          <Col xs={12} sm={6} key={item.title}>
            <Card className="stat-card" style={{ borderTop: `3px solid ${item.color}` }}>
              <Statistic
                title={item.title}
                value={overview[item.key]}
                prefix={item.icon}
                formatter={() => (
                  <CountUp
                    to={typeof overview[item.key] === 'string'
                      ? parseFloat(overview[item.key])
                      : overview[item.key]}
                    duration={1.2}
                    delay={0}
                    decimals={item.key === 'totalHours' ? 2 : 0}
                    className="stat-card__value"
                  />
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选 & 导出操作区 */}
      <Card
        title="咨询师工作量统计导出"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <Button icon={<SearchOutlined />} type="primary" ghost onClick={handleSearch} loading={loading}>
              查询刷新
            </Button>
          </Space>
        }
      >
        {/* 时间范围筛选 */}
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="closingDateStart" label="结案日期（起）">
            <DatePicker placeholder="起始日期" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="closingDateEnd" label="结案日期（止）">
            <DatePicker placeholder="结束日期" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="status" label="报告状态">
            <Select placeholder="全部状态" allowClear style={{ width: 120 }}
              options={['草稿', '已提交', '已审核', '已驳回'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
        </Form>

        <Descriptions size="small" column={4} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="咨询师人数">{overview.totalCounselors}</Descriptions.Item>
          <Descriptions.Item label="报告总人次">{overview.totalReports}</Descriptions.Item>
          <Descriptions.Item label="总时长(h)">{overview.totalHours}</Descriptions.Item>
          <Descriptions.Item label="提示">
            <span style={{ color: '#999' }}>设置时间范围可限定统计区间</span>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 咨询师统计表格 */}
        <Table
          rowKey="counselorId"
          columns={counselorColumns}
          dataSource={counselorStats}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位咨询师` }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <strong>合计</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Tag color="blue">{overview.totalReports}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Tag color="green">{overview.totalClosed}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <Tag color="orange">{counselorStats.reduce((s, d) => s + Number(d.dropoutCount || 0), 0)}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <strong style={{ color: '#1677ff' }}>{overview.totalHours}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={3} />
            </Table.Summary.Row>
          )}
        />

        {/* 导出按钮 */}
        <Divider />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportReports}
            loading={exportingType === 'report'}
            size="large"
          >
            导出结案报告 Excel（全部数据）
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCounselor}
            loading={exportingType === 'counselor'}
            size="large"
          >
            导出咨询师统计 Excel（{counselorStats.length} 位咨询师）
          </Button>
        </div>
      </Card>
    </div>
  )
}
