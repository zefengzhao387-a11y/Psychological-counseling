import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, DatePicker, Input, InputNumber, Select, message, Tag } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import request from '../../api/request'
import { useTeachers, useTimeSlots } from '../../hooks/useReferenceData'
import { renderPerson } from '../../utils/display'

export default function ConsultationReview() {
  const { options: counselorOptions } = useTeachers(2)
  const { options: timeSlotOptions } = useTimeSlots()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/v1/consultation/result/assistant-tasks')
      setData(res.data || [])
    } catch {
      setData([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  /** 安排咨询 */
  const handleArrange = async () => {
    const values = await form.validateFields()
    await request.post('/v1/consultation/arrange', {
      resultId: currentItem.id,
      studentId: currentItem.studentId,
      counselorId: values.counselorId,
      startDate: values.startDate.format('YYYY-MM-DD'),
      timeSlotId: values.timeSlotId,
      location: values.location,
      occupiedWeeks: values.occupiedWeeks || 8,
    })
    message.success('安排成功，系统已默认占用 8 周，短信已通知学生')
    setOpen(false); fetchData()
  }

  /** 标记无需安排（预留，待后端支持后启用） */
  const handleSkip = async (id) => {
    await request.put(`/v1/consultation/result/${id}/mark-processed`)
    message.success('已标记为已处理')
    fetchData()
  }

  const conclusionTag = (v) => {
    const map = { 1: '无需咨询', 2: '安排咨询', 3: '转介送诊' }
    const color = { 1: 'default', 2: 'blue', 3: 'orange' }
    return <Tag color={color[v]}>{map[v] || v}</Tag>
  }

  const columns = [
    {
      title: '学生',
      key: 'studentName',
      render: (_, r) => renderPerson(r.studentName, r.studentNo, r.studentId),
    },
    { title: '初访结论', dataIndex: 'conclusion', key: 'conclusion', render: conclusionTag },
    { title: '危机等级', dataIndex: 'crisisLevel', key: 'crisisLevel',
      render: (v) => {
        const map = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
        const color = { 1: 'green', 2: 'blue', 3: 'orange', 4: 'red' }
        return <Tag color={color[v]}>{map[v] || v}</Tag>
      },
    },
    { title: '问题类型', dataIndex: 'problemType', key: 'problemType',
      render: (v) => {
        const map = { 1: '学业', 2: '情绪', 3: '人际', 4: '恋爱', 5: '职业', 6: '成长', 7: '家庭', 8: '其他' }
        return map[v] || v
      },
    },
    {
      title: '操作', key: 'action',
      render: (_, r) => (
        <>
          {r.conclusion === 2 && (
            <Button type="primary" size="small" icon={<CheckOutlined />}
              onClick={() => { setCurrentItem(r); setOpen(true) }}>安排咨询</Button>
          )}
          {r.conclusion !== 2 && (
            <Button type="link" size="small" onClick={() => handleSkip(r.id)}>标记已处理</Button>
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ pageSize: 20 }} />

      <Modal title="安排咨询" open={open} onOk={handleArrange}
        onCancel={() => { setOpen(false); setCurrentItem(null) }} width={480}>
        <p>学生：{renderPerson(currentItem?.studentName, currentItem?.studentNo, currentItem?.studentId)}</p>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="counselorId" label="咨询师" extra="留空则系统自动匹配空闲咨询师">
            <Select allowClear showSearch optionFilterProp="label" placeholder="选择咨询师或留空自动匹配"
              options={counselorOptions} />
          </Form.Item>
          <Form.Item name="startDate" label="咨询开始日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="timeSlotId" label="时间段" rules={[{ required: true, message: '请选择时段' }]}>
            <Select placeholder="选择时间段" options={timeSlotOptions} />
          </Form.Item>
          <Form.Item name="location" label="咨询地点" rules={[{ required: true }]}>
            <Input placeholder="如：心理中心B203" />
          </Form.Item>
          <Form.Item name="occupiedWeeks" label="占用周数" initialValue={8}>
            <InputNumber min={1} max={16} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
