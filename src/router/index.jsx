import { Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Landing from '../pages/Landing'

// 管理员
import DutySchedule from '../pages/admin/DutySchedule'
import TimeConfig from '../pages/admin/TimeConfig'
import CounselorInfo from '../pages/admin/CounselorInfo'
import AppointmentReview from '../pages/admin/AppointmentReview'
import AppointmentRecords from '../pages/admin/AppointmentRecords'
import ExtensionApproval from '../pages/admin/ExtensionApproval'
import Statistics from '../pages/admin/Statistics'

// 学生（占位）
import FirstVisitForm from '../pages/student/FirstVisitForm'
import StudentAppointment from '../pages/student/Appointment'
import MyRecords from '../pages/student/MyRecords'

// 初访员（占位）
import FirstVisitManage from '../pages/visitor/FirstVisitManage'

// 心理助理
import ConsultationReview from '../pages/assistant/ConsultationReview'
import ConsultationRecords from '../pages/assistant/ConsultationRecords'

// 咨询师（占位）
import CounselorRecords from '../pages/counselor/CounselorRecords'
import ExtensionApply from '../pages/counselor/ExtensionApply'
import ClosingReport from '../pages/counselor/ClosingReport'

/**
 * 路由守卫：未登录 → 跳转登录页
 */
function AuthGuard({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

/**
 * 角色守卫：角色不匹配 → 403
 */
function RoleGuard({ roles, children }) {
  const roleCode = Number(localStorage.getItem('roleCode'))
  if (!roles.includes(roleCode)) {
    return (
      <div className="app-forbidden">
        <h2>暂无访问权限</h2>
        <p>当前角色无法打开此页面，请从侧栏选择你有权限的功能。</p>
      </div>
    )
  }
  return children
}

const routes = [
  { path: '/login', element: <Landing /> },

  // 所有已登录用户共用 MainLayout，路由守卫 + 角色守卫在内部
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      // ---- 管理员（roleCode=5）----
      {
        path: 'admin/duty-schedule',
        element: <RoleGuard roles={[5]}><DutySchedule /></RoleGuard>,
      },
      {
        path: 'admin/time-config',
        element: <RoleGuard roles={[5]}><TimeConfig /></RoleGuard>,
      },
      {
        path: 'admin/counselor-info',
        element: <RoleGuard roles={[5]}><CounselorInfo /></RoleGuard>,
      },
      {
        path: 'admin/appointment-review',
        element: <RoleGuard roles={[5]}><AppointmentReview /></RoleGuard>,
      },
      {
        path: 'admin/appointment-records',
        element: <RoleGuard roles={[5]}><AppointmentRecords /></RoleGuard>,
      },
      {
        path: 'admin/extension-approval',
        element: <RoleGuard roles={[5]}><ExtensionApproval /></RoleGuard>,
      },
      {
        path: 'admin/statistics',
        element: <RoleGuard roles={[5]}><Statistics /></RoleGuard>,
      },

      // ---- 学生（roleCode=1）----
      { path: 'student/form', element: <RoleGuard roles={[1]}><FirstVisitForm /></RoleGuard> },
      { path: 'student/appointment', element: <RoleGuard roles={[1]}><StudentAppointment /></RoleGuard> },
      { path: 'student/my-records', element: <RoleGuard roles={[1]}><MyRecords /></RoleGuard> },

      // ---- 初访员（roleCode=2）----
      { path: 'visitor/manage', element: <RoleGuard roles={[2]}><FirstVisitManage /></RoleGuard> },

      // ---- 心理助理（roleCode=3）----
      { path: 'assistant/consultation-review', element: <RoleGuard roles={[3]}><ConsultationReview /></RoleGuard> },
      { path: 'assistant/consultation-records', element: <RoleGuard roles={[3]}><ConsultationRecords /></RoleGuard> },

      // ---- 咨询师（roleCode=4）----
      { path: 'counselor/records', element: <RoleGuard roles={[4]}><CounselorRecords /></RoleGuard> },
      { path: 'counselor/extension', element: <RoleGuard roles={[4]}><ExtensionApply /></RoleGuard> },
      { path: 'counselor/closing-report', element: <RoleGuard roles={[4]}><ClosingReport /></RoleGuard> },

      // 默认：按角色跳转首页
      { path: '/', element: <DashboardRedirect /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]

/** 按角色重定向到各自首页 */
function DashboardRedirect() {
  const roleCode = Number(localStorage.getItem('roleCode'))
  const map = {
    5: '/admin/duty-schedule',
    3: '/assistant/consultation-review',
    1: '/student/form',
    2: '/visitor/manage',
    4: '/counselor/records',
  }
  return <Navigate to={map[roleCode] || '/login'} replace />
}

export default routes
