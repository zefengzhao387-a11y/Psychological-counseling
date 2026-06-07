import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Drawer, Form, Input, Select, InputNumber, DatePicker,
  message, Tag, Popconfirm, Space, Row, Col, Divider, Empty,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FileWordOutlined,
  SendOutlined, SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../api/request'

const { TextArea } = Input

/** 问题类型 */
const PROBLEM_TYPES = [
  { value: 1, label: '学业' },
  { value: 2, label: '情绪' },
  { value: 3, label: '人际' },
  { value: 4, label: '恋爱' },
  { value: 5, label: '职业' },
  { value: 6, label: '成长' },
  { value: 7, label: '家庭' },
  { value: 8, label: '其他' },
]

/** 结案原因 */
const CLOSING_REASONS = ['目标达成', '来访者主动结束', '转介', '失约终止', '其他']

/** 咨询方式 */
const CONSULT_METHODS = ['面对面', '线上视频', '电话咨询']

/** 风险评估等级 */
const RISK_LEVELS = ['低', '中', '高']

/** 状态颜色 */
const statusColor = (v) => {
  const map = { '草稿': 'default', '已提交': 'blue', '已审核': 'green', '已驳回': 'red' }
  return map[v] || 'default'
}

/** 咨询师端 — 结案报告 */
export default function ClosingReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchNo, setSearchNo] = useState('')
  const [searchName, setSearchName] = useState('')

  // 抽屉
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const counselorId = Number(localStorage.getItem('userId'))

  /** 加载列表 */
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/report/list', {
        params: {
          page, size: 10,
          counselorId,
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

  /** 打开新增 */
  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      status: '草稿',
      counselorId,
    })
    setDrawerOpen(true)
  }

  /** 打开编辑 */
  const openEdit = async (record) => {
    setEditingId(record.id)
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
    setDrawerOpen(true)
  }

  /** 保存（新增或修改） */
  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const payload = {
        ...values,
        counselorId,
        firstConsultationDate: values.firstConsultationDate?.format('YYYY-MM-DD HH:mm:ss'),
        closingDate: values.closingDate?.format('YYYY-MM-DD HH:mm:ss'),
      }
      if (editingId) {
        await request.put(`/v1/consultation/report/${editingId}`, payload)
        message.success('修改成功')
      } else {
        await request.post('/v1/consultation/report', payload)
        message.success('新增成功')
      }
      setDrawerOpen(false)
      fetchList()
    } catch {
      // 拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  /** 提交（含Word生成） */
  const handleSubmit = async (record) => {
    try {
      await request.post('/v1/consultation/report/submit', { ...record })
      message.success('提交成功，Word已生成')
      fetchList()
    } catch {
      // 拦截器统一处理
    }
  }

  /** 生成Word */
  const handleWord = async (id) => {
    try {
      const res = await request.post(`/v1/consultation/report/${id}/word`)
      message.success(res.message || 'Word已生成')
      fetchList()
    } catch {
      // 拦截器统一处理
    }
  }

  /** 删除 */
  const handleDelete = async (id) => {
    try {
      await request.delete(`/v1/consultation/report/${id}`)
      message.success('已删除')
      fetchList()
    } catch {
      // 拦截器统一处理
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 110 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 80 },
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
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>
            编辑
          </Button>
          {record.status === '草稿' && (
            <Button type="link" size="small" icon={<SendOutlined />}
              onClick={() => handleSubmit(record)}>
              提交
            </Button>
          )}
          {record.status === '已提交' && (
            <Button type="link" size="small" icon={<FileWordOutlined />}
              onClick={() => handleWord(record.id)}>
              Word
            </Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 搜索栏 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col>
          <Input
            placeholder="学号"
            value={searchNo}
            onChange={(e) => { setSearchNo(e.target.value); setPage(1) }}
            style={{ width: 140 }}
            allowClear
          />
        </Col>
        <Col>
          <Input
            placeholder="学生姓名"
            value={searchName}
            onChange={(e) => { setSearchName(e.target.value); setPage(1) }}
            style={{ width: 140 }}
            allowClear
          />
        </Col>
        <Col>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>
            查询
          </Button>
        </Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增报告
          </Button>
        </Col>
      </Row>

      {/* 列表 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1100 }}
        locale={{ emptyText: <Empty description="暂无结案报告" /> }}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={editingId ? '编辑结案报告' : '新增结案报告'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        extra={
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
          {/* ===== 学生信息 ===== */}
          <Divider orientation="left" plain>学生信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="studentNo" label="学号"
                rules={[{ required: true, message: '请输入学号' }]}>
                <Input placeholder="请输入学号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="studentName" label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择" options={[
                  { value: '男', label: '男' },
                  { value: '女', label: '女' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="studentGrade" label="年级">
                <Input placeholder="如：2024级" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="studentMajor" label="专业">
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="院系">
                <Input placeholder="请输入院系" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="studentEmail" label="电子邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          {/* ===== 咨询基本信息 ===== */}
          <Divider orientation="left" plain>咨询基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="problemType" label="问题类型"
                rules={[{ required: true, message: '请选择问题类型' }]}>
                <Select placeholder="请选择" options={PROBLEM_TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="consultationMethod" label="咨询方式"
                rules={[{ required: true, message: '请选择咨询方式' }]}>
                <Select placeholder="请选择"
                  options={CONSULT_METHODS.map((m) => ({ value: m, label: m }))} />
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
              <Form.Item name="closingDate" label="结案日期"
                rules={[{ required: true, message: '请选择结案日期' }]}>
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
          </Row>

          {/* ===== 咨询统计 ===== */}
          <Divider orientation="left" plain>咨询统计</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalSessions" label="咨询总次数"
                rules={[{ required: true, message: '请输入次数' }]}>
                <InputNumber min={1} placeholder="如：8" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalHours" label="总咨询时长（小时）">
                <InputNumber min={0} step={0.5} placeholder="如：8"
                  style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* ===== 结案核心内容 ===== */}
          <Divider orientation="left" plain>结案核心内容</Divider>
          <Form.Item name="closingReason" label="结案原因"
            rules={[{ required: true, message: '请选择结案原因' }]}>
            <Select placeholder="请选择"
              options={CLOSING_REASONS.map((r) => ({ value: r, label: r }))} />
          </Form.Item>

          <Form.Item name="closingReasonDetail" label="结案原因详细说明">
            <TextArea rows={3} placeholder="请详细描述结案原因" maxLength={1000} showCount />
          </Form.Item>

          <Form.Item name="caseSummary" label="个案摘要"
            rules={[{ required: true, message: '请填写个案摘要' }]}>
            <TextArea rows={4} placeholder="简述来访原因、咨询过程概述等"
              maxLength={2000} showCount />
          </Form.Item>

          <Form.Item name="selfEvaluation" label="咨询效果自评（来访者）">
            <TextArea rows={3} placeholder="来访者对咨询效果的评价"
              maxLength={1000} showCount />
          </Form.Item>

          <Form.Item name="counselingOutcome" label="咨询效果评估（咨询师）"
            rules={[{ required: true, message: '请填写咨询效果评估' }]}>
            <TextArea rows={3} placeholder="咨询师对咨询效果的专业评估"
              maxLength={1000} showCount />
          </Form.Item>

          <Form.Item name="followUpPlan" label="后续跟进计划">
            <TextArea rows={2} placeholder="结案后的跟进计划" maxLength={500} showCount />
          </Form.Item>

          <Form.Item name="referralInfo" label="转介信息">
            <TextArea rows={2} placeholder="如有转介，请填写转介原因及机构"
              maxLength={500} showCount />
          </Form.Item>

          {/* ===== 风险评估 ===== */}
          <Divider orientation="left" plain>风险评估</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="riskLevel" label="风险评估等级"
                rules={[{ required: true, message: '请选择风险等级' }]}>
                <Select placeholder="请选择"
                  options={RISK_LEVELS.map((l) => ({ value: l, label: l }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="riskNote" label="风险备注">
            <TextArea rows={2} placeholder="风险评估补充说明" maxLength={500} showCount />
          </Form.Item>

          {/* ===== 状态 ===== */}
          <Divider orientation="left" plain>状态</Divider>
          <Form.Item name="status" label="状态">
            <Select options={[
              { value: '草稿', label: '草稿' },
              { value: '已提交', label: '已提交' },
            ]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
