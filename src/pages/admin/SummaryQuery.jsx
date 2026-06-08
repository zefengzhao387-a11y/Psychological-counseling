import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Button, Table, Form, Select, Input, DatePicker, message,
  Statistic, Space, Collapse, Tag,
} from 'antd'
import {
  SearchOutlined, ReloadOutlined, FilterOutlined,
} from '@ant-design/icons'
import request from '../../api/request'
import CountUp from '../../components/CountUp'

const PROBLEM_TYPE_MAP = {
  1: '学业问题', 2: '情绪问题', 3: '人际关系', 4: '恋爱问题',
  5: '职业发展', 6: '自我成长', 7: '家庭问题', 8: '其他',
}

const STATUS_OPTIONS = ['草稿', '已提交', '已审核', '已驳回']
const RISK_LEVEL_OPTIONS = ['低', '中', '高']
const CLOSING_REASON_OPTIONS = ['目标达成', '来访者主动结束', '失约终止', '转介', '其他']
const GENDER_OPTIONS = ['男', '女']
const CONSULTATION_METHOD_OPTIONS = ['面对面', '线上视频', '电话']

export default function SummaryQuery() {
  const [summary, setSummary] = useState({
    totalReports: 0, approvedCount: 0, draftCount: 0,
    rejectedCount: 0, totalSessions: 0, totalHours: '0.00',
  })
  const [queryResult, setQueryResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [queryForm] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  /** 加载概览统计 */
  const loadSummary = async () => {
    try {
      const res = await request.get('/v1/statistics/summary')
      const d = res.data || {}
      setSummary({
        totalReports: Number(d.totalReports || 0),
        approvedCount: Number(d.approvedCount || 0),
        draftCount: Number(d.draftCount || 0),
        rejectedCount: Number(d.rejectedCount || 0),
        totalSessions: Number(d.totalSessions || 0),
        totalHours: d.totalHours != null ? String(d.totalHours) : '0.00',
      })
    } catch {
      setSummary({
        totalReports: 0, approvedCount: 0, draftCount: 0,
        rejectedCount: 0, totalSessions: 0, totalHours: '0.00',
      })
    }
  }

  useEffect(() => { loadSummary() }, [])

  /** 格式化日期字段 */
  const formatDateParams = (params) => {
    const dateFields = ['closingDateStart', 'closingDateEnd', 'firstConsultationStart', 'firstConsultationEnd']
    const result = { ...params }
    dateFields.forEach((key) => {
      if (result[key] && typeof result[key].format === 'function') {
        result[key] = result[key].format('YYYY-MM-DD HH:mm:ss')
      }
    })
    return result
  }

  /** 提交筛选查询 */
  const handleQuery = async (values, pageOverride, sizeOverride) => {
    setLoading(true)
    const page = pageOverride || 1
    const size = sizeOverride || pagination.pageSize
    try {
      const params = formatDateParams({ ...values, page, size })
      const res = await request.get('/v1/statistics/list', { params })
      const pageData = res.data || {}
      setQueryResult(pageData.records || [])
      setPagination({
        current: pageData.current || 1,
        pageSize: size,
        total: pageData.total || 0,
      })
    } catch {
      setQueryResult([])
    } finally { setLoading(false) }
  }

  /** 分页变化 */
  const handleTableChange = (pag) => {
    const values = searchForm.getFieldsValue()
    handleQuery(values, pag.current, pag.pageSize)
  }

  /** 重置筛选 */
  const handleReset = () => {
    searchForm.resetFields()
    setPagination({ current: 1, pageSize: 10, total: 0 })
    setQueryResult([])
  }

  const statCards = [
    { title: '报告总数', key: 'totalReports', delay: 0, color: '#1677ff' },
    { title: '已审核', key: 'approvedCount', delay: 0.08, color: '#52c41a' },
    { title: '草稿', key: 'draftCount', delay: 0.16, color: '#faad14' },
    { title: '已驳回', key: 'rejectedCount', delay: 0.24, color: '#ff4d4f' },
    { title: '总咨询次数', key: 'totalSessions', delay: 0.32, color: '#722ed1' },
    { title: '总时长(h)', key: 'totalHours', delay: 0.40, color: '#13c2c2' },
  ]

  const reportColumns = [
    { title: '序号', key: 'index', width: 60,
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1 },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 120 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
    { title: '院系', dataIndex: 'department', key: 'department', width: 120, ellipsis: true },
    { title: '年级', dataIndex: 'studentGrade', key: 'studentGrade', width: 80 },
    { title: '咨询师ID', dataIndex: 'counselorId', key: 'counselorId', width: 90 },
    { title: '问题类型', dataIndex: 'problemType', key: 'problemType', width: 100,
      render: (v) => PROBLEM_TYPE_MAP[v] ? <Tag>{PROBLEM_TYPE_MAP[v]}</Tag> : v },
    { title: '咨询方式', dataIndex: 'consultationMethod', key: 'consultationMethod', width: 100 },
    { title: '咨询次数', dataIndex: 'totalSessions', key: 'totalSessions', width: 90 },
    { title: '总时长(h)', dataIndex: 'totalHours', key: 'totalHours', width: 90 },
    { title: '首次咨询', dataIndex: 'firstConsultationDate', key: 'firstConsultationDate', width: 110,
      render: (v) => v ? v.substring(0, 10) : '-' },
    { title: '结案日期', dataIndex: 'closingDate', key: 'closingDate', width: 110,
      render: (v) => v ? v.substring(0, 10) : '-' },
    { title: '结案原因', dataIndex: 'closingReason', key: 'closingReason', width: 120, ellipsis: true },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 80,
      render: (v) => {
        const colorMap = { '低': 'green', '中': 'orange', '高': 'red' }
        return v ? <Tag color={colorMap[v] || 'default'}>{v}</Tag> : '-'
      }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => {
        const colorMap = { '草稿': 'default', '已提交': 'processing', '已审核': 'success', '已驳回': 'error' }
        return v ? <Tag color={colorMap[v] || 'default'}>{v}</Tag> : '-'
      }},
  ]

  return (
    <div>
      {/* 统计概览卡片 */}
      <Row gutter={[16, 16]}>
        {statCards.map((item) => (
          <Col xs={12} sm={8} md={4} key={item.title}>
            <Card className="stat-card" style={{ borderTop: `3px solid ${item.color}` }}>
              <Statistic
                title={item.title}
                value={summary[item.key]}
                formatter={() => (
                  <CountUp
                    to={typeof summary[item.key] === 'string'
                      ? parseFloat(summary[item.key])
                      : summary[item.key]}
                    duration={1.2}
                    delay={item.delay}
                    decimals={item.key === 'totalHours' ? 2 : 0}
                    className="stat-card__value"
                  />
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 多条件筛选表单 */}
      <Card
        title={
          <Space>
            <FilterOutlined />
            <span>多条件筛选查询</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        }
        style={{ marginTop: 16 }}
      >
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleQuery}
          initialValues={{ page: 1, size: 10 }}
        >
          {/* 常用筛选行 */}
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="studentNo" label="学号">
                <Input placeholder="学号（模糊）" allowClear />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="studentName" label="学生姓名">
                <Input placeholder="姓名（模糊）" allowClear />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="problemType" label="问题类型">
                <Select placeholder="全部类型" allowClear
                  options={Object.entries(PROBLEM_TYPE_MAP).map(([v, l]) => ({ value: Number(v), label: l }))} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Form.Item name="status" label="报告状态">
                <Select placeholder="全部状态" allowClear
                  options={STATUS_OPTIONS.map(v => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
          </Row>

          {/* 高级筛选（可折叠） */}
          <Collapse
            activeKey={filtersExpanded ? ['advanced'] : []}
            onChange={(keys) => setFiltersExpanded(keys.includes('advanced'))}
            ghost
            items={[{
              key: 'advanced',
              label: <span style={{ color: '#1677ff', fontSize: 13 }}>高级筛选（展开更多条件）</span>,
              showArrow: false,
              extra: <FilterOutlined style={{ color: filtersExpanded ? '#1677ff' : '#999' }} />,
              children: (
                <>
                  <Row gutter={16}>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="gender" label="性别">
                        <Select placeholder="全部" allowClear
                          options={GENDER_OPTIONS.map(v => ({ value: v, label: v }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="department" label="院系">
                        <Input placeholder="院系" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="studentGrade" label="年级">
                        <Input placeholder="年级（模糊）" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="counselorId" label="咨询师ID">
                        <Input placeholder="咨询师ID" allowClear type="number" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="consultationMethod" label="咨询方式">
                        <Select placeholder="全部方式" allowClear
                          options={CONSULTATION_METHOD_OPTIONS.map(v => ({ value: v, label: v }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="riskLevel" label="风险等级">
                        <Select placeholder="全部等级" allowClear
                          options={RISK_LEVEL_OPTIONS.map(v => ({ value: v, label: v }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="closingReason" label="结案原因">
                        <Select placeholder="全部原因" allowClear
                          options={CLOSING_REASON_OPTIONS.map(v => ({ value: v, label: v }))} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="firstConsultationStart" label="首次咨询（起）">
                        <DatePicker style={{ width: '100%' }} placeholder="起始日期" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="firstConsultationEnd" label="首次咨询（止）">
                        <DatePicker style={{ width: '100%' }} placeholder="结束日期" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="closingDateStart" label="结案日期（起）">
                        <DatePicker style={{ width: '100%' }} placeholder="起始日期" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} md={6}>
                      <Form.Item name="closingDateEnd" label="结案日期（止）">
                        <DatePicker style={{ width: '100%' }} placeholder="结束日期" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            }]}
          />

          <div style={{ marginTop: 12 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                查询
              </Button>
            </Space>
          </div>
        </Form>

        {/* 查询结果表格 */}
        <Table
          rowKey="id"
          columns={reportColumns}
          dataSource={queryResult}
          loading={loading}
          scroll={{ x: 1500 }}
          style={{ marginTop: 16 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: '请设置筛选条件后点击查询' }}
        />
      </Card>
    </div>
  )
}
