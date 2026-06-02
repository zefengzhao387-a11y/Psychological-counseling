import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, theme, Typography, Dropdown } from 'antd'
import {
  ScheduleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  AuditOutlined,
  FileTextOutlined,
  BarChartOutlined,
  FormOutlined,
  CalendarOutlined,
  HistoryOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileAddOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Text } = Typography

/** 各角色菜单配置 */
const menuConfig = {
  5: [ // 中心管理员
    { key: '/admin/duty-schedule', icon: <ScheduleOutlined />, label: '值班管理' },
    { key: '/admin/time-config', icon: <ClockCircleOutlined />, label: '时间配置' },
    { key: '/admin/counselor-info', icon: <TeamOutlined />, label: '老师信息维护' },
    { key: '/admin/appointment-review', icon: <AuditOutlined />, label: '初访预约审核' },
    { key: '/admin/appointment-records', icon: <FileTextOutlined />, label: '初访预约记录' },
    { key: '/admin/statistics', icon: <BarChartOutlined />, label: '统计分析' },
  ],
  3: [ // 心理助理
    { key: '/assistant/consultation-review', icon: <CheckCircleOutlined />, label: '咨询预约审核' },
    { key: '/assistant/consultation-records', icon: <FileTextOutlined />, label: '咨询安排记录' },
  ],
  1: [ // 学生
    { key: '/student/form', icon: <FormOutlined />, label: '首访登记表' },
    { key: '/student/appointment', icon: <CalendarOutlined />, label: '初访预约' },
    { key: '/student/my-records', icon: <HistoryOutlined />, label: '我的预约' },
  ],
  2: [ // 初访员
    { key: '/visitor/manage', icon: <EditOutlined />, label: '初访管理' },
  ],
  4: [ // 咨询师
    { key: '/counselor/records', icon: <EditOutlined />, label: '咨询记录' },
    { key: '/counselor/extension', icon: <FileAddOutlined />, label: '追加时段申请' },
    { key: '/counselor/closing-report', icon: <FileTextOutlined />, label: '结案报告' },
  ],
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const roleCode = Number(localStorage.getItem('roleCode'))
  const username = localStorage.getItem('username')
  const roleName = localStorage.getItem('roleName')
  const menus = menuConfig[roleCode] || []

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{
          height: 48, margin: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: collapsed ? 14 : 16, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {collapsed ? '心理' : '心理预约系统'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menus.map(m => ({ key: m.key, icon: m.icon, label: m.label }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px', background: colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={{
            items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout }],
          }}>
            <Button type="text" icon={<UserOutlined />}>
              {username}（{roleName}）
            </Button>
          </Dropdown>
        </Header>

        <Content style={{
          margin: 16, padding: 24, background: colorBgContainer,
          borderRadius: borderRadiusLG, minHeight: 360,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
