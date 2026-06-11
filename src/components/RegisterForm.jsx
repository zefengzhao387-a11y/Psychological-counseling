import { useState } from 'react'
import { Form, Input, Button, Select } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons'
import request from '../api/request'

export default function RegisterForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await request.post('/v1/user/auth/register', {
        userNo: values.userNo,
        username: values.username,
        password: values.password,
        phone: values.phone,
        gender: values.gender,
        department: values.department,
      })
      form.resetFields()
      onSuccess?.()
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} name="register" onFinish={onFinish} size="large" layout="vertical"
      initialValues={{ gender: '男' }}>
      <Form.Item name="userNo" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
        <Input prefix={<UserOutlined />} placeholder="学号" />
      </Form.Item>
      <Form.Item name="username" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
        <Input placeholder="真实姓名" />
      </Form.Item>
      <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
        <Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
      </Form.Item>
      <Form.Item name="department" label="院系" rules={[{ required: true, message: '请输入院系' }]}>
        <Input placeholder="如：计算机学院" />
      </Form.Item>
      <Form.Item name="phone" label="手机号" rules={[
        { required: true, message: '请输入手机号' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
      ]}>
        <Input prefix={<PhoneOutlined />} placeholder="11位手机号" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[
        { required: true, message: '请输入密码' },
        { min: 6, message: '密码至少6位' },
      ]}>
        <Input.Password prefix={<LockOutlined />} placeholder="至少6位" />
      </Form.Item>
      <Form.Item name="confirmPassword" label="确认密码" dependencies={['password']} rules={[
        { required: true, message: '请再次输入密码' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue('password') === value) {
              return Promise.resolve()
            }
            return Promise.reject(new Error('两次输入的密码不一致'))
          },
        }),
      ]}>
        <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" />
      </Form.Item>
      <Form.Item>
        <Button className="login-btn-primary" htmlType="submit" loading={loading} block>
          注 册
        </Button>
      </Form.Item>
      <p className="login-modal-hint">注册成功后请使用学号登录，仅学生账号可自助注册</p>
    </Form>
  )
}
