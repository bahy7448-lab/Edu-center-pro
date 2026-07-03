import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '../store'
import { MainLayout } from '../components/layout/MainLayout'
import { AuthLayout } from '../components/layout/AuthLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { SuperAdminDashboard } from '../pages/dashboard/SuperAdminDashboard'
import { CenterAdminDashboard } from '../pages/dashboard/CenterAdminDashboard'
import { StudentsPage } from '../pages/students/StudentsPage'
import { StudentDetailPage } from '../pages/students/StudentDetailPage'
import { TeachersPage } from '../pages/teachers/TeachersPage'
import { ParentsPage } from '../pages/parents/ParentsPage'
import { GroupsPage } from '../pages/groups/GroupsPage'
import { AttendancePage } from '../pages/attendance/AttendancePage'
import { QRCodesPage } from '../pages/qrcodes/QRCodesPage'
import { PaymentsPage } from '../pages/payments/PaymentsPage'
import { ExpensesPage } from '../pages/expenses/ExpensesPage'
import { ExamsPage } from '../pages/exams/ExamsPage'
import { GradesPage } from '../pages/grades/GradesPage'
import { ReportsPage } from '../pages/reports/ReportsPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { NotificationsPage } from '../pages/notifications/NotificationsPage'
import { CentersPage } from '../pages/superadmin/CentersPage'
import { SubscriptionsPage } from '../pages/superadmin/SubscriptionsPage'
import { AuditLogsPage } from '../pages/superadmin/AuditLogsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAppSelector(s => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function AppRouter() {
  const { user } = useAppSelector(s => s.auth)
  const defaultDashboard = user?.role === 'SuperAdmin' ? '/super-admin/dashboard' : '/dashboard'

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route path="/super-admin" element={
        <ProtectedRoute roles={['SuperAdmin']}><MainLayout /></ProtectedRoute>
      }>
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="centers" element={<CentersPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={
        <ProtectedRoute><MainLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to={defaultDashboard} replace />} />
        <Route path="dashboard" element={<CenterAdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="parents" element={<ParentsPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="qr-codes" element={<QRCodesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
