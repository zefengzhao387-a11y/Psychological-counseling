import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import request from '../api/request'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      message.success(`欢迎，${username}（${roleName}）`)

      // 按角色跳转
      const roleMap = {
        5: '/admin/duty-schedule',
        3: '/assistant/consultation-review',
        1: '/student/form',
        2: '/visitor/manage',
        4: '/counselor/records',
      }
      navigate(roleMap[roleCode] || '/')
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          高校心理预约系统
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          学生 · 初访员 · 心理助理 · 咨询师 · 管理员
        </Text>

        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item name="userNo" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号（学号/工号）" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
          初始密码均为 123456
        </Text>
      </div>
    </div>
  )
}
