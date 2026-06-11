import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Drawer, Form, Input, Select, InputNumber, DatePicker,
  message, Tag, Popconfirm, Space, Row, Col, Card, Alert, Descriptions, Empty, Skeleton,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FileWordOutlined,
  SendOutlined, SearchOutlined, UserOutlined, FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'
import { useClosableAppointments } from '../../hooks/useReferenceData'
import './ClosingReport.css'

const { TextArea } = Input

const PROBLEM_TYPES = [
  { value: 1, label: '学业' }, { value: 2, label: '情绪' }, { value: 3, label: '人际' },
  { value: 4, label: '恋爱' }, { value: 5, label: '职业' }, { value: 6, label: '成长' },
  { value: 7, label: '家庭' }, { value: 8, label: '其他' },
]

const CLOSING_REASONS = ['目标达成', '来访者主动结束', '转介', '失约终止', '其他']
const CONSULT_METHODS = ['面对面', '线上视频', '电话咨询']
const RISK_LEVELS = ['低', '中', '高']

const statusColor = (v) => {
  const map = { '草稿': 'default', '已提交': 'blue', '已审核': 'green', '已驳回': 'red' }
  return map[v] || 'default'
}

const sectionCard = { marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }

async function downloadReportWord(id) {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/v1/consultation/report/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok || contentType.includes('application/json')) {
    let msg = '下载失败'
    if (contentType.includes('json')) {
      const err = await res.json()
      msg = err.message || msg
    }
    throw new Error(msg)
  }
  const blob = await res.blob()
  let filename = '结案报告.docx'
  const cd = res.headers.get('Content-Disposition')
  const match = cd?.match(/filename\*=UTF-8''(.+)/i)
  if (match) filename = decodeURIComponent(match[1])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ClosingReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchNo, setSearchNo] = useState('')
  const [searchName, setSearchName] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerReady, setDrawerReady] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [form] = Form.useForm()

  const counselorId = Number(localStorage.getItem('userId'))
  const { options: appointmentOptions, loading: apptLoading, refresh: refreshAppointments } =
    useClosableAppointments(counselorId)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/report/list', {
        params: {
          page, size: 10, counselorId,
          studentNo: searchNo || undefined,
          studentName: searchName || undefined,
        },
      })
      setData(res.data?.records || [])
      setTotal(res.data?.total || 0)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [page, counselorId, searchNo, searchName])

  useEffect(() => { fetchList() }, [fetchList])

  const applyAppointment = (record) => {
    if (!record) {
      setSelectedApp(null)
      return
    }
    setSelectedApp(record)
    form.setFieldsValue({
      studentNo: record.studentNo,
      studentName: record.studentName,
      firstConsultationDate: record.startDate ? dayjs(record.startDate) : undefined,
      totalSessions: record.occupiedWeeks || undefined,
    })
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerReady(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setSelectedApp(null)
    form.resetFields()
    form.setFieldsValue({ status: '草稿', consultationMethod: '面对面', riskLevel: '低' })
    setDrawerReady(false)
    setDrawerOpen(true)
  }

  const openEdit = async (record) => {
    setEditingId(record.id)
    setSelectedApp(null)
    try {
      const res = await request.get(`/v1/consultation/report/${record.id}`)
      const detail = res.data
      form.setFieldsValue({
        ...detail,
        firstConsultationDate: detail.firstConsultationDate ? dayjs(detail.firstConsultationDate) : undefined,
        closingDate: detail.closingDate ? dayjs(detail.closingDate) : undefined,
      })
    } catch {
      message.error('获取报告详情失败')
      return
    }
    setDrawerReady(false)
    setDrawerOpen(true)
  }

  const buildPayload = (values) => {
    const num = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v))
    return {
      appointmentId: num(values.appointmentId),
      studentNo: values.studentNo,
      studentName: values.studentName,
      gender: values.gender || '男',
      studentGrade: values.studentGrade,
      studentMajor: values.studentMajor,
      department: values.department,
      phone: values.phone,
      studentEmail: values.studentEmail,
      problemType: values.problemType,
      consultationMethod: values.consultationMethod,
      firstConsultationDate: values.firstConsultationDate?.format('YYYY-MM-DD HH:mm:ss'),
      closingDate: values.closingDate?.format('YYYY-MM-DD HH:mm:ss'),
      totalSessions: values.totalSessions,
      totalHours: num(values.totalHours),
      closingReason: values.closingReason,
      closingReasonDetail: values.closingReasonDetail,
      caseSummary: values.caseSummary,
      selfEvaluation: values.selfEvaluation || '暂无',
      counselingOutcome: values.counselingOutcome,
      followUpPlan: values.followUpPlan,
      referralInfo: values.referralInfo,
      riskLevel: values.riskLevel,
      riskNote: values.riskNote,
      status: values.status || '草稿',
    }
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const payload = buildPayload(values)
      if (editingId) {
        await request.put(`/v1/consultation/report/${editingId}`, payload)
        message.success('修改成功')
      } else {
        await request.post('/v1/consultation/report', payload)
        message.success('新增成功')
      }
      setDrawerOpen(false)
      setDrawerReady(false)
      fetchList()
      refreshAppointments()
    } catch { /* 拦截器 */ } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (record) => {
    try {
      await request.post('/v1/consultation/report/submit', { id: record.id })
      message.success('提交成功，Word已生成')
      fetchList()
      refreshAppointments()
    } catch { /* 拦截器 */ }
  }

  const handleWord = async (id) => {
    try {
      await request.post(`/v1/consultation/report/${id}/word`)
      await downloadReportWord(id)
      message.success('Word 已下载')
      fetchList()
    } catch (err) {
      message.error(err.message || 'Word 下载失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/v1/consultation/report/${id}`)
      message.success('已删除')
      fetchList()
      refreshAppointments()
    } catch { /* 拦截器 */ }
  }

  const columns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 120 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 90 },
    {
      title: '问题类型', dataIndex: 'problemType', key: 'problemType', width: 90,
      render: (v) => PROBLEM_TYPES.find((p) => p.value === v)?.label || v || '-',
    },
    { title: '咨询方式', dataIndex: 'consultationMethod', key: 'consultationMethod', width: 100, ellipsis: true },
    { title: '总次数', dataIndex: 'totalSessions', key: 'totalSessions', width: 70 },
    { title: '结案原因', dataIndex: 'closingReason', key: 'closingReason', width: 110, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => <Tag color={statusColor(v)}>{v || '-'}</Tag>,
    },
    {
      title: '操作', key: 'action', fixed: 'right', width: 240,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          {record.status === '草稿' && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmit(record)}>提交</Button>
          )}
          {record.status === '已提交' && (
            <Button type="link" size="small" icon={<FileWordOutlined />} onClick={() => handleWord(record.id)}>下载 Word</Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={12} style={{ marginBottom: 16 }} align="middle">
        <Col><Input placeholder="学号" value={searchNo} onChange={(e) => { setSearchNo(e.target.value); setPage(1) }} style={{ width: 140 }} allowClear /></Col>
        <Col><Input placeholder="学生姓名" value={searchName} onChange={(e) => { setSearchName(e.target.value); setPage(1) }} style={{ width: 140 }} allowClear /></Col>
        <Col><Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button></Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增报告</Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1000 }}
        locale={{ emptyText: <Empty description="暂无结案报告" /> }}
        pagination={{ current: page, total, pageSize: 10, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
      />

      <Drawer
        title={editingId ? '编辑结案报告' : '新增结案报告'}
        open={drawerOpen}
        onClose={closeDrawer}
        width={760}
        rootClassName="closing-report-drawer"
        getContainer={() => document.body}
        forceRender
        destroyOnClose={false}
        afterOpenChange={(open) => setDrawerReady(open)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={closeDrawer}>取消</Button>
              <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <div className={`closing-report-drawer__body${drawerReady ? '' : ' closing-report-drawer__body--pending'}`}>
        <Form form={form} layout="vertical" requiredMark="optional">
          {!editingId && (
            <Card size="small" title={<><FileTextOutlined /> 第一步：选择已结束的咨询</>} style={sectionCard}>
              <div className="closing-report-drawer__pick-section">
                {apptLoading ? (
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                ) : (
                  <>
                    {appointmentOptions.length === 0 && (
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="暂无可写报告的咨询安排"
                        description="请先在「咨询记录」中为来访者录入咨询并标记「结案」或「脱落」，完成后此处会出现可选学生。"
                      />
                    )}
                    <Form.Item name="appointmentId" label="关联咨询安排" rules={[{ required: true, message: '请选择咨询安排' }]}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="选择已结案 / 已脱落且未写报告的学生"
                        options={appointmentOptions}
                        notFoundContent="暂无可用安排"
                        onChange={(id) => {
                          const opt = appointmentOptions.find((o) => o.value === id)
                          applyAppointment(opt?.record)
                        }}
                      />
                    </Form.Item>
                    {selectedApp && (
                      <Descriptions size="small" column={2} bordered>
                        <Descriptions.Item label="姓名">{selectedApp.studentName}</Descriptions.Item>
                        <Descriptions.Item label="学号">{selectedApp.studentNo}</Descriptions.Item>
                        <Descriptions.Item label="开始日期">{selectedApp.startDate}</Descriptions.Item>
                        <Descriptions.Item label="时段">{selectedApp.timeSlotName || '-'}</Descriptions.Item>
                        <Descriptions.Item label="地点" span={2}>{selectedApp.location || '-'}</Descriptions.Item>
                      </Descriptions>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          <Card size="small" title={<><UserOutlined /> 学生信息</>} style={sectionCard}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="studentNo" label="学号" rules={[{ required: true, message: '请选择咨询安排以自动填充' }]}>
                  <Input placeholder="选择咨询安排后自动填充" disabled={!!selectedApp && !editingId} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="studentName" label="姓名" rules={[{ required: true, message: '请选择咨询安排以自动填充' }]}>
                  <Input placeholder="选择咨询安排后自动填充" disabled={!!selectedApp && !editingId} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="gender" label="性别">
                  <Select allowClear placeholder="选填" options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
                </Form.Item>
              </Col>
              <Col span={8}><Form.Item name="studentGrade" label="年级"><Input placeholder="如 2024级" /></Form.Item></Col>
              <Col span={8}><Form.Item name="studentMajor" label="专业"><Input placeholder="选填" /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="department" label="院系"><Input placeholder="选填" /></Form.Item></Col>
              <Col span={12}><Form.Item name="phone" label="联系电话"><Input placeholder="选填" /></Form.Item></Col>
            </Row>
            <Form.Item name="studentEmail" label="电子邮箱"><Input placeholder="选填" /></Form.Item>
          </Card>

          <Card size="small" title="咨询概况" style={sectionCard}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="problemType" label="问题类型" rules={[{ required: true, message: '请选择' }]}>
                  <Select placeholder="请选择" options={PROBLEM_TYPES} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="consultationMethod" label="咨询方式" rules={[{ required: true, message: '请选择' }]}>
                  <Select options={CONSULT_METHODS.map((m) => ({ value: m, label: m }))} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="firstConsultationDate" label="首次咨询日期">
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="closingDate" label="结案日期" rules={[{ required: true, message: '请选择' }]}>
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="totalSessions" label="咨询总次数" rules={[{ required: true, message: '请输入' }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="totalHours" label="总时长（小时）">
                  <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="结案内容" style={sectionCard}>
            <Form.Item name="closingReason" label="结案原因" rules={[{ required: true, message: '请选择' }]}>
              <Select options={CLOSING_REASONS.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
            <Form.Item name="closingReasonDetail" label="结案原因说明">
              <TextArea rows={2} placeholder="选填" maxLength={1000} showCount />
            </Form.Item>
            <Form.Item name="caseSummary" label="个案摘要" rules={[{ required: true, message: '请填写' }]}>
              <TextArea rows={3} placeholder="来访原因、咨询过程概述" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="selfEvaluation" label="来访者自评">
              <TextArea rows={2} placeholder="选填，默认「暂无」" maxLength={1000} showCount />
            </Form.Item>
            <Form.Item name="counselingOutcome" label="咨询师评估" rules={[{ required: true, message: '请填写' }]}>
              <TextArea rows={3} placeholder="专业评估与效果" maxLength={1000} showCount />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="followUpPlan" label="后续跟进"><TextArea rows={2} placeholder="选填" /></Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="referralInfo" label="转介信息"><TextArea rows={2} placeholder="选填" /></Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="风险评估" style={sectionCard}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="riskLevel" label="风险等级" rules={[{ required: true, message: '请选择' }]}>
                  <Select options={RISK_LEVELS.map((l) => ({ value: l, label: l }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="保存状态">
                  <Select options={[{ value: '草稿', label: '草稿' }, { value: '已提交', label: '已提交' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="riskNote" label="风险备注"><TextArea rows={2} placeholder="选填" /></Form.Item>
          </Card>
        </Form>
        </div>
      </Drawer>
    </div>
  )
}
