import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Button, Table, Form, Select, Input, DatePicker, message,
  Space, Tag, Alert, Badge, Tooltip, Divider,
} from 'antd'
import {
  DownloadOutlined, SearchOutlined, ReloadOutlined,
  FileZipOutlined, FileTextOutlined, CheckSquareOutlined, InboxOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import request from '../../api/request'

const PROBLEM_TYPE_MAP = {
  1: '学业问题', 2: '情绪问题', 3: '人际关系', 4: '恋爱问题',
  5: '职业发展', 6: '自我成长', 7: '家庭问题', 8: '其他',
}

export default function BatchDownload() {
  const [reports, setReports] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [downloadHistory, setDownloadHistory] = useState([])
  const [form] = Form.useForm()

  /** 格式化日期字段 */
  const formatDateParams = (params) => {
    const dateFields = ['closingDateStart', 'closingDateEnd']
    const result = { ...params }
    dateFields.forEach((key) => {
      if (result[key] && typeof result[key].format === 'function') {
        result[key] = result[key].format('YYYY-MM-DD HH:mm:ss')
      }
    })
    return result
  }

  /** 加载结案报告列表 */
  const loadReports = async (params = {}, pageOverride, sizeOverride) => {
    setLoading(true)
    const page = pageOverride || params.page || pagination.current
    const size = sizeOverride || params.size || pagination.pageSize
    try {
      const payload = formatDateParams({ ...params, page, size })
      const res = await request.get('/v1/statistics/list', { params: payload })
      const pageData = res.data || {}
      setReports(pageData.records || [])
      setPagination({
        current: pageData.current || 1,
        pageSize: size,
        total: pageData.total || 0,
      })
    } catch {
      setReports([])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadReports() }, [])

  /** 查询 */
  const handleSearch = () => {
    setSelectedRowKeys([])
    const values = form.getFieldsValue()
    loadReports({ ...values, page: 1 })
  }

  /** 重置 */
  const handleReset = () => {
    form.resetFields()
    setSelectedRowKeys([])
    loadReports({ page: 1 })
  }

  /** 分页变化 */
  const handleTableChange = (pag) => {
    const values = form.getFieldsValue()
    loadReports(values, pag.current, pag.pageSize)
  }

  /** 全选当前页 */
  const handleSelectAll = () => {
    const currentIds = reports.map(r => r.id)
    setSelectedRowKeys(currentIds)
  }

  /** 取消全选 */
  const handleDeselectAll = () => {
    setSelectedRowKeys([])
  }

  /** 批量下载 */
  const handleBatchDownload = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要下载的结案报告')
      return
    }
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/v1/statistics/download',
        { ids: selectedRowKeys },
        {
          responseType: 'blob',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

      // 检查是否返回了 JSON 错误
      if (res.data.type?.includes('json')) {
        const text = await res.data.text()
        const err = JSON.parse(text)
        throw new Error(err.message || '下载失败')
      }

      // 触发下载
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().slice(0, 10)
      link.download = `结案报告批量下载_${timestamp}_${selectedRowKeys.length}份.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success(`成功下载 ${selectedRowKeys.length} 份结案报告`)
      setDownloadHistory(prev => [{
        key: Date.now(),
        count: selectedRowKeys.length,
        time: new Date().toLocaleString(),
      }, ...prev].slice(0, 5))
    } catch (e) {
      message.error(e.message || '批量下载失败，请确认 statistics-service 已启动')
    } finally { setDownloading(false) }
  }

  const reportColumns = [
    { title: '序号', key: 'index', width: 60,
      render: (_, __, i) => (pagination.current - 1) * pagination.pageSize + i + 1 },
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 110 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 90 },
    { title: '咨询师ID', dataIndex: 'counselorId', key: 'counselorId', width: 90 },
    { title: '问题类型', dataIndex: 'problemType', key: 'problemType', width: 100,
      render: (v) => PROBLEM_TYPE_MAP[v] ? <Tag>{PROBLEM_TYPE_MAP[v]}</Tag> : v },
    { title: '咨询次数', dataIndex: 'totalSessions', key: 'totalSessions', width: 85 },
    { title: '总时长(h)', dataIndex: 'totalHours', key: 'totalHours', width: 90 },
    { title: '结案日期', dataIndex: 'closingDate', key: 'closingDate', width: 105,
      render: (v) => v ? v.substring(0, 10) : '-' },
    { title: '结案原因', dataIndex: 'closingReason', key: 'closingReason', width: 130, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', width: 75,
      render: (v) => {
        const colorMap = { '草稿': 'default', '已提交': 'processing', '已审核': 'success', '已驳回': 'error' }
        return v ? <Tag color={colorMap[v] || 'default'}>{v}</Tag> : '-'
      }},
    { title: '文件状态', key: 'fileStatus', width: 85,
      render: (_, r) => r.filePath
        ? <Tag color="green" icon={<FileTextOutlined />}>有文件</Tag>
        : <Tag color="default">无文件</Tag> },
  ]

  return (
    <div>
      {/* 提示信息 */}
      <Alert
        message="批量下载说明"
        description="勾选需要下载的结案报告（支持跨页多选），点击「批量打包下载」按钮即可生成 Zip 压缩包。存在 Word 文件的报告将直接打包，无文件的报告将以文本占位说明替代。"
        type="info"
        showIcon
        icon={<InboxOutlined />}
        style={{ marginBottom: 16 }}
        closable
      />

      {/* 筛选表单 */}
      <Card
        title={
          <Space>
            <SearchOutlined />
            <span>筛选结案报告</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        }
      >
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="studentNo" label="学号">
            <Input placeholder="学号" allowClear style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="studentName" label="姓名">
            <Input placeholder="姓名" allowClear style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="problemType" label="问题类型">
            <Select placeholder="全部类型" allowClear style={{ width: 130 }}
              options={Object.entries(PROBLEM_TYPE_MAP).map(([v, l]) => ({ value: Number(v), label: l }))} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 110 }}
              options={['草稿', '已提交', '已审核', '已驳回'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="closingDateStart" label="结案（起）">
            <DatePicker placeholder="起始日期" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="closingDateEnd" label="结案（止）">
            <DatePicker placeholder="结束日期" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作栏 */}
      <Card style={{ marginTop: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space size="middle">
              <Badge count={selectedRowKeys.length} overflowCount={999}
                style={{ backgroundColor: '#1677ff' }}>
                <CheckSquareOutlined style={{ fontSize: 18 }} />
              </Badge>
              <span style={{ fontSize: 13, color: '#666' }}>
                已选择 <strong style={{ color: '#1677ff' }}>{selectedRowKeys.length}</strong> 份报告
              </span>
              {selectedRowKeys.length > 0 && (
                <Space size={4}>
                  <Button size="small" type="link" onClick={handleSelectAll}>全选当前页</Button>
                  <Button size="small" type="link" danger onClick={handleDeselectAll}>取消全选</Button>
                </Space>
              )}
            </Space>
          </Col>
          <Col>
            <Tooltip title={selectedRowKeys.length === 0 ? '请先勾选要下载的报告' : `打包下载 ${selectedRowKeys.length} 份报告`}>
              <Button
                type="primary"
                size="large"
                icon={<FileZipOutlined />}
                onClick={handleBatchDownload}
                loading={downloading}
                disabled={selectedRowKeys.length === 0}
              >
                批量打包下载
                {selectedRowKeys.length > 0 && `（${selectedRowKeys.length} 份）`}
              </Button>
            </Tooltip>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* 报告列表 */}
        <Table
          rowKey="id"
          columns={reportColumns}
          dataSource={reports}
          loading={loading}
          scroll={{ x: 1100 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE,
            ],
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 下载历史 */}
      {downloadHistory.length > 0 && (
        <Card title="最近下载记录" size="small" style={{ marginTop: 16 }}>
          {downloadHistory.map((record) => (
            <Tag key={record.key} color="blue" style={{ marginBottom: 8 }}>
              <FileZipOutlined /> {record.time} — 下载 {record.count} 份报告
            </Tag>
          ))}
        </Card>
      )}
    </div>
  )
}
