import { useState } from 'react'
import { Form, Input, Button } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import request from '../api/request'
import { ROLE_HOME_MAP } from '../constants/brand'

export default function LoginForm({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await request.post('/v1/user/auth/login', values)
      const { token, userId, username, roleCode, roleName } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('userId', userId)
      localStorage.setItem('username', username)
      localStorage.setItem('roleCode', roleCode)
      localStorage.setItem('roleName', roleName)
      form.resetFields()
      onSuccess?.({ username, roleName, roleCode, redirectTo: ROLE_HOME_MAP[roleCode] || '/' })
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} name="login" onFinish={onFinish} size="large" layout="vertical">
      <Form.Item name="userNo" rules={[{ required: true, message: '请输入账号' }]}>
        <Input prefix={<UserOutlined />} placeholder="账号（学号/工号）" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Form.Item>
        <Button className="login-btn-primary" htmlType="submit" loading={loading} block>
          登 录
        </Button>
      </Form.Item>
      <p className="login-modal-hint">初始密码均为 123456</p>
    </Form>
  )
}
