import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Button, Modal, Form, Select, Input, message, Tag, Tabs, Descriptions, Alert } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import request from '../../api/request'

const { TextArea } = Input

/** 危机等级选项 */
const CRISIS_LEVEL_OPTIONS = [
  { value: 1, label: '低', color: 'green' },
  { value: 2, label: '中', color: 'blue' },
  { value: 3, label: '高', color: 'orange' },
  { value: 4, label: '紧急', color: 'red' },
]

/** 问题类型选项 */
const PROBLEM_TYPE_OPTIONS = [
  { value: 1, label: '学业问题' },
  { value: 2, label: '情绪问题' },
  { value: 3, label: '人际关系' },
  { value: 4, label: '恋爱问题' },
  { value: 5, label: '职业发展' },
  { value: 6, label: '自我成长' },
  { value: 7, label: '家庭问题' },
  { value: 8, label: '其他' },
]

/** 初访结论选项 */
const CONCLUSION_OPTIONS = [
  { value: 1, label: '无需咨询', color: 'default' },
  { value: 2, label: '安排咨询', color: 'blue' },
  { value: 3, label: '转介送诊', color: 'orange' },
]

/**
 * 初访员端 — 初访管理
 */
export default function FirstVisitManage() {
  const [pendingList, setPendingList] = useState([])
  const [evaluatedList, setEvaluatedList] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')

  const [modalOpen, setModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  /** 待评估：后端仅返回 status=已通过 的预约 */
  const fetchPending = useCallback(async () => {
    try {
      const res = await request.get('/v1/appointment/first-visit/visitor')
      setPendingList(res.data || [])
    } catch {
      setPendingList([])
    }
  }, [])

  const fetchEvaluated = useCallback(async () => {
    try {
      const res = await request.get('/v1/consultation/result/my')
      setEvaluatedList(res.data || [])
    } catch {
      setEvaluatedList([])
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchPending(), fetchEvaluated()])
    } finally {
      setLoading(false)
    }
  }, [fetchPending, fetchEvaluated])

  useEffect(() => { refreshAll() }, [refreshAll])

  /** 已评估的 appointmentId，用于前端兜底过滤 */
  const evaluatedAppointmentIds = useMemo(
    () => new Set(evaluatedList.map((r) => r.appointmentId)),
    [evaluatedList],
  )

  const displayPending = useMemo(
    () => pendingList.filter((item) => !evaluatedAppointmentIds.has(item.id)),
    [pendingList, evaluatedAppointmentIds],
  )

  const openModal = (item) => {
    setCurrentItem(item)
    form.resetFields()
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await request.post('/v1/consultation/result', {
        appointmentId: currentItem.id,
        studentId: currentItem.studentId,
        crisisLevel: values.crisisLevel,
        problemType: values.problemType,
        conclusion: values.conclusion,
        remark: values.remark || '',
      })
      message.success('评估结果已录入')
      setModalOpen(false)
      setCurrentItem(null)
      await refreshAll()
      setActiveTab('evaluated')
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false)
    }
  }

  const crisisTag = (v) => {
    const opt = CRISIS_LEVEL_OPTIONS.find((o) => o.value === v)
    return <Tag color={opt?.color}>{opt?.label || v}</Tag>
  }

  const problemLabel = (v) => PROBLEM_TYPE_OPTIONS.find((o) => o.value === v)?.label || v

  const conclusionTag = (v) => {
    const opt = CONCLUSION_OPTIONS.find((o) => o.value === v)
    return <Tag color={opt?.color}>{opt?.label || v}</Tag>
  }

  const pendingColumns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 80 },
    { title: '预约日期', dataIndex: 'appointmentDate', key: 'appointmentDate', width: 110 },
    { title: '时段', dataIndex: 'timeSlotName', key: 'timeSlotName', width: 100 },
    {
      title: '咨询地点', dataIndex: 'location', key: 'location', width: 120, ellipsis: true,
      render: (v) => v || <span style={{ color: 'rgba(255,255,255,0.35)' }}>待定</span>,
    },
    { title: '问卷总分', dataIndex: 'totalScore', key: 'totalScore', width: 80 },
    {
      title: '报警', dataIndex: 'isUrgent', key: 'isUrgent', width: 70,
      render: (v) => (v === 1 ? <Tag color="red">紧急</Tag> : <Tag>正常</Tag>),
    },
    {
      title: '操作', key: 'action', fixed: 'right', width: 120,
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EditOutlined />}
          onClick={() => openModal(record)}>
          录入评估
        </Button>
      ),
    },
  ]

  const evaluatedColumns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 80 },
    { title: '初访时间', dataIndex: 'visitTime', key: 'visitTime', width: 170 },
    { title: '危机等级', dataIndex: 'crisisLevel', key: 'crisisLevel', width: 90, render: crisisTag },
    { title: '问题类型', dataIndex: 'problemType', key: 'problemType', width: 100, render: problemLabel },
    { title: '初访结论', dataIndex: 'conclusion', key: 'conclusion', width: 100, render: conclusionTag },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'pending', label: `待评估${displayPending.length ? ` (${displayPending.length})` : ''}` },
        { key: 'evaluated', label: `已评估${evaluatedList.length ? ` (${evaluatedList.length})` : ''}` },
      ]} />

      {activeTab === 'pending' && (
        <>
          {displayPending.length === 0 && !loading && (
            <Alert
              message="暂无待评估预约"
              description="学生提交预约后，需管理员在「初访预约审核」中审核通过，才会出现在此处。已完成评估的记录请查看「已评估」标签页。"
              type="info" showIcon style={{ marginBottom: 16 }}
            />
          )}
          <Table
            rowKey="id" columns={pendingColumns} dataSource={displayPending}
            loading={loading} scroll={{ x: 920 }}
            pagination={{ pageSize: 10 }}
          />
        </>
      )}

      {activeTab === 'evaluated' && (
        <>
          {evaluatedList.length === 0 && !loading && (
            <Alert
              message="暂无已评估记录"
              description="结论为「安排咨询」的记录会出现在心理助理的咨询预约审核中。"
              type="info" showIcon style={{ marginBottom: 16 }}
            />
          )}
          <Table
            rowKey="id" columns={evaluatedColumns} dataSource={evaluatedList}
            loading={loading} scroll={{ x: 720 }}
            pagination={{ pageSize: 10 }}
          />
        </>
      )}

      <Modal
        title="录入初访评估结果"
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => { setModalOpen(false); setCurrentItem(null) }}
        width={520}
        destroyOnClose
      >
        {currentItem && (
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
            <Descriptions.Item label="学生">{currentItem.studentName}</Descriptions.Item>
            <Descriptions.Item label="学号">{currentItem.studentNo}</Descriptions.Item>
            <Descriptions.Item label="预约日期">{currentItem.appointmentDate}</Descriptions.Item>
            <Descriptions.Item label="时段">{currentItem.timeSlotName}</Descriptions.Item>
            <Descriptions.Item label="咨询地点" span={2}>
              {currentItem.location || '待定（请联系管理员确认）'}
            </Descriptions.Item>
            <Descriptions.Item label="问卷总分" span={2}>
              {currentItem.totalScore}
              {currentItem.isUrgent === 1 && (
                <Tag color="red" style={{ marginLeft: 8 }}>紧急报警</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="crisisLevel" label="危机等级" rules={[{ required: true, message: '请选择危机等级' }]}>
            <Select placeholder="请选择危机等级" options={CRISIS_LEVEL_OPTIONS} />
          </Form.Item>
          <Form.Item name="problemType" label="问题类型" rules={[{ required: true, message: '请选择问题类型' }]}>
            <Select placeholder="请选择问题类型" options={PROBLEM_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="conclusion" label="初访结论" rules={[{ required: true, message: '请选择初访结论' }]}>
            <Select placeholder="请选择初访结论" options={CONCLUSION_OPTIONS} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="选填，补充说明初访情况" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
