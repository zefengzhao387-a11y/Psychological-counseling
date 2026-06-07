import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Modal, Form, Select, Input, message, Tag, Tabs, Descriptions, Alert } from 'antd'
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons'
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
 * 初访员查看分配给自己的预约，录入危机等级、问题类型、初访结论
 */
export default function FirstVisitManage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [evaluatedIds, setEvaluatedIds] = useState(new Set())
  const [evaluatedList, setEvaluatedList] = useState([])

  // 录入弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  /** 加载分配给我的已审核通过的预约 */
  const fetchApproved = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/appointment/first-visit/visitor')
      const list = res.data || []
      setData(list)
      setTotal(list.length)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  /** 加载我的已评估记录 */
  const fetchEvaluated = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/result/my')
      const list = res.data || []
      setEvaluatedList(list)
    } catch {
      setEvaluatedList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchApproved()
    } else {
      fetchEvaluated()
    }
  }, [activeTab, fetchApproved, fetchEvaluated])

  /** 打开录入弹窗 */
  const openModal = (item) => {
    setCurrentItem(item)
    form.resetFields()
    setModalOpen(true)
  }

  /** 提交评估结果 */
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
      // 标记为已评估
      setEvaluatedIds((prev) => new Set([...prev, currentItem.id]))
      setModalOpen(false)
      setCurrentItem(null)
    } catch {
      // 错误由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  // ---- 状态/等级标签渲染 ----
  const crisisTag = (v) => {
    const opt = CRISIS_LEVEL_OPTIONS.find((o) => o.value === v)
    return <Tag color={opt?.color}>{opt?.label || v}</Tag>
  }

  const problemLabel = (v) => {
    const opt = PROBLEM_TYPE_OPTIONS.find((o) => o.value === v)
    return opt?.label || v
  }

  const conclusionTag = (v) => {
    const opt = CONCLUSION_OPTIONS.find((o) => o.value === v)
    return <Tag color={opt?.color}>{opt?.label || v}</Tag>
  }

  // ---- 待评估表格列 ----
  const pendingColumns = [
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 80 },
    { title: '预约日期', dataIndex: 'appointmentDate', key: 'appointmentDate', width: 110 },
    { title: '时段', dataIndex: 'timeSlotName', key: 'timeSlotName', width: 100 },
    {
      title: '问卷总分', dataIndex: 'totalScore', key: 'totalScore', width: 80,
    },
    {
      title: '报警', dataIndex: 'isUrgent', key: 'isUrgent', width: 70,
      render: (v) => (v === 1 ? <Tag color="red">紧急</Tag> : <Tag>正常</Tag>),
    },
    {
      title: '操作', key: 'action', fixed: 'right', width: 120,
      render: (_, record) => {
        const done = evaluatedIds.has(record.id)
        if (done) {
          return <Tag icon={<CheckCircleOutlined />} color="success">已评估</Tag>
        }
        return (
          <Button type="primary" size="small" icon={<EditOutlined />}
            onClick={() => openModal(record)}>
            录入评估
          </Button>
        )
      },
    },
  ]

  // ---- 已评估表格列 ----
  const evaluatedColumns = [
    { title: '预约ID', dataIndex: 'appointmentId', key: 'appointmentId', width: 80 },
    { title: '学生ID', dataIndex: 'studentId', key: 'studentId', width: 80 },
    {
      title: '危机等级', dataIndex: 'crisisLevel', key: 'crisisLevel', width: 90,
      render: crisisTag,
    },
    {
      title: '问题类型', dataIndex: 'problemType', key: 'problemType', width: 100,
      render: problemLabel,
    },
    {
      title: '初访结论', dataIndex: 'conclusion', key: 'conclusion', width: 100,
      render: conclusionTag,
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '录入时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'pending', label: '待评估' },
        { key: 'evaluated', label: '已评估' },
      ]} />

      {activeTab === 'pending' && (
        <>
          {data.length === 0 && !loading && (
            <Alert
              message="暂无待评估预约"
              description="当管理员审核通过初访预约后，您可以在本页面看到分配给您的预约并进行评估录入。"
              type="info" showIcon style={{ marginBottom: 16 }}
            />
          )}
          <Table
            rowKey="id" columns={pendingColumns} dataSource={data}
            loading={loading} scroll={{ x: 800 }}
            pagination={{ pageSize: 10 }}
          />
        </>
      )}

      {activeTab === 'evaluated' && (
        <>
          {evaluatedList.length === 0 && !loading && (
            <Alert
              message="暂无已评估记录"
              description="已完成评估的记录将显示在咨询预约审核列表中，供心理助理安排正式咨询。"
              type="info" showIcon style={{ marginBottom: 16 }}
            />
          )}
          <Table
            rowKey="id" columns={evaluatedColumns} dataSource={evaluatedList}
            loading={loading} scroll={{ x: 720 }}
          />
        </>
      )}

      {/* 录入评估弹窗 */}
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
            <Descriptions.Item label="问卷总分">
              {currentItem.totalScore}
              {currentItem.isUrgent === 1 && (
                <Tag color="red" style={{ marginLeft: 8 }}>紧急报警</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="crisisLevel" label="危机等级"
            rules={[{ required: true, message: '请选择危机等级' }]}
          >
            <Select placeholder="请选择危机等级" options={CRISIS_LEVEL_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="problemType" label="问题类型"
            rules={[{ required: true, message: '请选择问题类型' }]}
          >
            <Select placeholder="请选择问题类型" options={PROBLEM_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="conclusion" label="初访结论"
            rules={[{ required: true, message: '请选择初访结论' }]}
          >
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
