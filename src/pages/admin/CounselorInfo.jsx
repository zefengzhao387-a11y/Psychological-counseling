import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import request from '../../api/request'

export default function CounselorInfo() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [staffUsers, setStaffUsers] = useState([])
  const [form] = Form.useForm()

  const fetchStaffUsers = async () => {
    try {
      const [visitors, counselors] = await Promise.all([
        request.get('/v1/user/users', { params: { page: 1, size: 100, roleCode: 2 } }),
        request.get('/v1/user/users', { params: { page: 1, size: 100, roleCode: 4 } }),
      ])
      const list = [
        ...(visitors.data?.records || []),
        ...(counselors.data?.records || []),
      ]
      setStaffUsers(list)
    } catch {
      setStaffUsers([])
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: 接入 user-service 的 counselor_info 接口（目前占位）
      const res = await request.get('/v1/user/counselor/list')
      setData(res.data || [])
    } catch {
      setData([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData(); fetchStaffUsers() }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editingId) {
      await request.put(`/v1/user/counselor/${editingId}`, values)
    } else {
      await request.post('/v1/user/counselor', values)
    }
    message.success(editingId ? '更新成功' : '新增成功')
    setOpen(false); form.resetFields(); setEditingId(null); fetchData()
  }

  const handleDelete = async (id) => {
    await request.delete(`/v1/user/counselor/${id}`)
    message.success('已删除'); fetchData()
  }

  const typeTag = (v) => v === 1 ? <Tag color="blue">初访员</Tag> : <Tag color="green">咨询师</Tag>
  const statusTag = (v) => v === 1 ? <Tag color="green">在职</Tag> : <Tag color="default">离职</Tag>

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '类型', dataIndex: 'type', key: 'type', render: typeTag },
    { title: '资质', dataIndex: 'qualification', key: 'qualification' },
    { title: '擅长', dataIndex: 'specialty', key: 'specialty' },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    {
      title: '操作', key: 'action',
      render: (_, r) => (
        <>
          <Button type="link" icon={<EditOutlined />} onClick={() => {
            setEditingId(r.id); form.setFieldsValue(r); setOpen(true)
          }}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ]

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingId(null); form.resetFields(); setOpen(true)
      }} style={{ marginBottom: 16 }}>新增老师</Button>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1000 }} />

      <Modal title={editingId ? '编辑老师' : '新增老师'} open={open} onOk={handleSave}
        onCancel={() => { setOpen(false); setEditingId(null) }} width={560}>
        <Form form={form} layout="vertical">
          {!editingId && (
            <Form.Item name="userId" label="关联系统用户" rules={[{ required: true, message: '请选择用户' }]}>
              <Select showSearch optionFilterProp="label" placeholder="选择初访员/咨询师账号"
                options={staffUsers.map((u) => ({
                  value: u.id,
                  label: `${u.id} - ${u.username}（${u.userNo}）`,
                }))} />
            </Form.Item>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ value: 1, label: '初访员' }, { value: 2, label: '咨询师' }]} />
          </Form.Item>
          <Form.Item name="qualification" label="资质">
            <Input placeholder="如：国家二级心理咨询师" />
          </Form.Item>
          <Form.Item name="specialty" label="擅长领域">
            <Input placeholder="如：学业压力,情绪管理（逗号分隔）" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select options={[{ value: 1, label: '在职' }, { value: 2, label: '离职' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
