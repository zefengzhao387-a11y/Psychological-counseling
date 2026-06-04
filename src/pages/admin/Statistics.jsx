import { useState } from 'react'
import { Card, Row, Col, Button, Table, Form, Select, Input, message, Statistic } from 'antd'
import { DownloadOutlined, SearchOutlined, FileExcelOutlined } from '@ant-design/icons'
import CountUp from '../../components/CountUp'
import BlurText from '../../components/BlurText'
import request from '../../api/request'

const statCards = [
  { title: '总预约数', value: 0, delay: 0 },
  { title: '咨询中', value: 0, delay: 0.08 },
  { title: '已结案', value: 0, delay: 0.16 },
  { title: '咨询师数', value: 0, delay: 0.24 },
]

export default function Statistics() {
  const [queryResult, setQueryResult] = useState([])
  const [loading, setLoading] = useState(false)

  /** 汇总查询 */
  const handleQuery = async (values) => {
    setLoading(true)
    try {
      const res = await request.get('/v1/statistics/query', { params: values })
      setQueryResult(res.data?.records || res.data || [])
    } catch {
      setQueryResult([])
    } finally { setLoading(false) }
  }

  /** 导出 Excel */
  const handleExportExcel = async () => {
    message.info('Excel 导出功能待接入 statistics-service /export 接口')
    // window.open('/api/v1/statistics/export/excel')
  }

  /** 批量下载结案报告 */
  const handleBatchDownload = async () => {
    message.info('批量下载功能待接入 statistics-service /download 接口')
  }

  const columns = [
    { title: '咨询师', dataIndex: 'counselorName', key: 'counselorName' },
    { title: '咨询人次', dataIndex: 'totalSessions', key: 'totalSessions' },
    { title: '总时长(小时)', dataIndex: 'totalHours', key: 'totalHours' },
    { title: '结案数', dataIndex: 'closedCount', key: 'closedCount' },
    { title: '进行中', dataIndex: 'activeCount', key: 'activeCount' },
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
                value={item.value}
                formatter={() => (
                  <CountUp to={item.value} duration={1.4} delay={item.delay} className="stat-card__value" />
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="汇总查询" style={{ marginTop: 16 }}>
        <Form layout="inline" onFinish={handleQuery} style={{ marginBottom: 16 }}>
          <Form.Item name="studentName"><Input placeholder="学生姓名" /></Form.Item>
          <Form.Item name="studentNo"><Input placeholder="学号" /></Form.Item>
          <Form.Item name="counselorName"><Input placeholder="咨询师姓名" /></Form.Item>
          <Form.Item name="problemType">
            <Select placeholder="问题类型" allowClear style={{ width: 120 }}
              options={[
                { value: 1, label: '学业问题' }, { value: 2, label: '情绪问题' },
                { value: 3, label: '人际关系' }, { value: 4, label: '恋爱问题' },
                { value: 8, label: '其他' },
              ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>查询</Button>
          </Form.Item>
        </Form>
        <Table rowKey="id" columns={columns} dataSource={queryResult} pagination={{ pageSize: 10 }} />
      </Card>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel}>导出 Excel 统计</Button>
        <Button icon={<DownloadOutlined />} onClick={handleBatchDownload}>批量下载结案报告</Button>
      </div>
    </div>
  )
}
