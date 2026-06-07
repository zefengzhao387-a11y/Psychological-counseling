import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Form, Input, InputNumber, Select, Tabs, Tag, message, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import request from '../../api/request'

const { TextArea } = Input

const STATUS_MAP = {
  1: { label: '待审批', color: 'orange' },
  2: { label: '已通过', color: 'green' },
  3: { label: '已拒绝', color: 'red' },
}

/** 咨询师端 — 追加咨询时段申请 */
export default function ExtensionApply() {
  const [myList, setMyList] = useState([])
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const counselorId = Number(localStorage.getItem('userId'))

  /** 加载我的申请列表 */
  const fetchMyList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/extension/my')
      setMyList(res.data || [])
    } catch {
      setMyList([])
    } finally {
      setLoading(false)
    }
  }, [])

  /** 加载进行中的咨询安排（供选择） */
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await request.get('/v1/consultation/records', {
        params: { page: 1, size: 100, counselorId },
      })
      const records = res.data?.records || []
      setAppointments(records.filter((r) => r.status === 1))
    } catch {
      setAppointments([])
    }
  }, [counselorId])

  useEffect(() => {
    fetchMyList()
    fetchAppointments()
  }, [fetchMyList, fetchAppointments])

  /** 提交追加申请 */
  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await request.post('/v1/consultation/extension', {
        appointmentId: values.appointmentId,
        extendWeeks: values.extendWeeks,
        reason: values.reason || '',
      })
      message.success('追加申请已提交，等待审批')
      form.resetFields()
      fetchMyList()
    } catch {
      // 拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: '申请ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '安排ID', dataIndex: 'appointmentId', key: 'appointmentId', width: 80 },
    {
      title: '追加周数', dataIndex: 'extendWeeks', key: 'extendWeeks', width: 90,
      render: (v) => `${v} 周`,
    },
    { title: '申请原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v) => {
        const cfg = STATUS_MAP[v] || { label: v, color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '审批备注', dataIndex: 'approveRemark', key: 'approveRemark', width: 150, ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '申请时间', dataIndex: 'createTime', key: 'createTime', width: 170,
      render: (v) => v || '-',
    },
  ]

  return (
    <div>
      <Tabs
        defaultActiveKey="list"
        items={[
          {
            key: 'list',
            label: '我的申请',
            children: (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={myList}
                loading={loading}
                scroll={{ x: 800 }}
                locale={{ emptyText: <Empty description="暂无追加申请" /> }}
                pagination={false}
              />
            ),
          },
          {
            key: 'apply',
            label: '提交申请',
            children: (
              <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 16 }}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Form.Item
                    name="appointmentId"
                    label="选择咨询安排"
                    rules={[{ required: true, message: '请选择咨询安排' }]}
                  >
                    <Select
                      placeholder="请选择进行中的咨询安排"
                      options={appointments.map((a) => ({
                        value: a.id,
                        label: `安排 #${a.id} — 学生${a.studentId} — ${a.startDate} — 剩余${a.remainingWeeks}周`,
                      }))}
                      notFoundContent={<Empty description="暂无进行中的咨询安排" />}
                    />
                  </Form.Item>

                  <Form.Item
                    name="extendWeeks"
                    label="追加周数"
                    rules={[
                      { required: true, message: '请输入追加周数' },
                      { type: 'number', min: 1, max: 20, message: '追加周数需在 1-20 之间' },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={20}
                      placeholder="如：4"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item name="reason" label="申请原因">
                    <TextArea
                      rows={4}
                      placeholder="请简要说明追加周数的原因"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" loading={submitting} block>
                    提交申请
                  </Button>
                </Form>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
