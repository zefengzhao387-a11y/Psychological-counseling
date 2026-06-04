import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown } from 'antd'
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
  CheckCircleOutlined,
  EditOutlined,
  FileAddOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { BRAND } from '../constants/brand'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

/** 各角色菜单配置 */
const menuConfig = {
  5: [
    { key: '/admin/duty-schedule', icon: <ScheduleOutlined />, label: '值班管理' },
    { key: '/admin/time-config', icon: <ClockCircleOutlined />, label: '时间配置' },
    { key: '/admin/counselor-info', icon: <TeamOutlined />, label: '老师信息维护' },
    { key: '/admin/appointment-review', icon: <AuditOutlined />, label: '初访预约审核' },
    { key: '/admin/appointment-records', icon: <FileTextOutlined />, label: '初访预约记录' },
    { key: '/admin/statistics', icon: <BarChartOutlined />, label: '统计分析' },
  ],
  3: [
    { key: '/assistant/consultation-review', icon: <CheckCircleOutlined />, label: '咨询预约审核' },
    { key: '/assistant/consultation-records', icon: <FileTextOutlined />, label: '咨询安排记录' },
  ],
  1: [
    { key: '/student/form', icon: <FormOutlined />, label: '首访登记表' },
    { key: '/student/appointment', icon: <CalendarOutlined />, label: '初访预约' },
    { key: '/student/my-records', icon: <HistoryOutlined />, label: '我的预约' },
  ],
  2: [
    { key: '/visitor/manage', icon: <EditOutlined />, label: '初访管理' },
  ],
  4: [
    { key: '/counselor/records', icon: <EditOutlined />, label: '咨询记录' },
    { key: '/counselor/extension', icon: <FileAddOutlined />, label: '追加时段申请' },
    { key: '/counselor/closing-report', icon: <FileTextOutlined />, label: '结案报告' },
  ],
}

const menuLabels = Object.fromEntries(
  Object.values(menuConfig)
    .flat()
    .map((item) => [item.key, item.label]),
)

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const roleCode = Number(localStorage.getItem('roleCode'))
  const username = localStorage.getItem('username')
  const roleName = localStorage.getItem('roleName')
  const menus = menuConfig[roleCode] || []
  const currentPage = menuLabels[location.pathname]

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <Layout className="app-layout">
      <Sider
        className="app-sider"
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
      >
        <div className="app-brand">
          <span className={`app-brand-name${collapsed ? ' app-brand-name--collapsed' : ''}`}>
            {BRAND.name}
          </span>
          {!collapsed && <span className="app-brand-en">{BRAND.nameEn}</span>}
        </div>
        <Menu
          className="app-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menus.map((m) => ({ key: m.key, icon: m.icon, label: m.label }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout className="app-layout-inner">
        <Header className="app-header">
          <div className="app-header-left">
            <Button
              className="app-header-toggle"
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            {currentPage && (
              <span className="app-header-greeting">
                当前 · <strong>{currentPage}</strong>
              </span>
            )}
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  danger: true,
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Button className="app-header-user" type="text" icon={<UserOutlined />}>
              {username} · {roleName}
            </Button>
          </Dropdown>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
