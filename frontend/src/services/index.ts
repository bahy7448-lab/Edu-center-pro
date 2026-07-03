import api from './api'
import type { PagedResult, Student, Teacher, Group, Attendance, Payment, Exam, ExamResult, Center } from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string) => (await api.post('/auth/login', { email, password })).data,
  refresh: async (accessToken: string, refreshToken: string) => (await api.post('/auth/refresh', { accessToken, refreshToken })).data,
  logout: async () => api.post('/auth/logout'),
  me: async () => (await api.get('/auth/me')).data,
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  getCenterDashboard: async () => (await api.get('/dashboard')).data,
  getSuperAdminDashboard: async () => (await api.get('/super-admin/dashboard')).data,
}

// ── Students ──────────────────────────────────────────────────────────────────
export const studentsService = {
  getAll: async (params: object): Promise<PagedResult<Student>> => (await api.get('/students', { params })).data,
  getById: async (id: string): Promise<Student> => (await api.get(`/students/${id}`)).data,
  create: async (data: object) => (await api.post('/students', data)).data,
  update: async (id: string, data: object) => (await api.put(`/students/${id}`, data)).data,
  delete: async (id: string) => api.delete(`/students/${id}`),
  getCard: async (id: string): Promise<Blob> => (await api.get(`/students/${id}/card`, { responseType: 'blob' })).data,
  getAttendance: async (id: string, params?: object) => (await api.get(`/students/${id}/attendance`, { params })).data,
  getPayments: async (id: string) => (await api.get(`/students/${id}/payments`)).data,
  getExamResults: async (id: string) => (await api.get(`/students/${id}/exam-results`)).data,
  exportExcel: async (params: object): Promise<Blob> => (await api.get('/students/export', { params, responseType: 'blob' })).data,
}

// ── Teachers ──────────────────────────────────────────────────────────────────
export const teachersService = {
  getAll: async (params: object): Promise<PagedResult<Teacher>> => (await api.get('/teachers', { params })).data,
  getById: async (id: string): Promise<Teacher> => (await api.get(`/teachers/${id}`)).data,
  create: async (data: object) => (await api.post('/teachers', data)).data,
  update: async (id: string, data: object) => (await api.put(`/teachers/${id}`, data)).data,
  delete: async (id: string) => api.delete(`/teachers/${id}`),
}

// ── Groups ────────────────────────────────────────────────────────────────────
export const groupsService = {
  getAll: async (params: object): Promise<PagedResult<Group>> => (await api.get('/groups', { params })).data,
  getById: async (id: string): Promise<Group> => (await api.get(`/groups/${id}`)).data,
  create: async (data: object) => (await api.post('/groups', data)).data,
  update: async (id: string, data: object) => (await api.put(`/groups/${id}`, data)).data,
  delete: async (id: string) => api.delete(`/groups/${id}`),
  getStudents: async (id: string) => (await api.get(`/groups/${id}/students`)).data,
  enrollStudent: async (groupId: string, studentId: string) => api.post(`/groups/${groupId}/students/${studentId}`),
  unenrollStudent: async (groupId: string, studentId: string) => api.delete(`/groups/${groupId}/students/${studentId}`),
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceService = {
  getAll: async (params: object): Promise<PagedResult<Attendance>> => (await api.get('/attendance', { params })).data,
  takeManual: async (data: object) => (await api.post('/attendance/manual', data)).data,
  scanQr: async (data: object) => (await api.post('/attendance/qr', data)).data,
  getReport: async (groupId: string, from: string, to: string): Promise<Blob> =>
    (await api.get('/attendance/report', { params: { groupId, from, to }, responseType: 'blob' })).data,
}

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsService = {
  getAll: async (params: object): Promise<PagedResult<Payment>> => (await api.get('/payments', { params })).data,
  create: async (data: object) => (await api.post('/payments', data)).data,
  markPaid: async (id: string, method: string) => (await api.patch(`/payments/${id}/pay`, null, { params: { method } })).data,
  getReceipt: async (id: string): Promise<Blob> => (await api.get(`/payments/${id}/receipt`, { responseType: 'blob' })).data,
  getOverdue: async () => (await api.get('/payments/overdue')).data,
}

// ── Exams ─────────────────────────────────────────────────────────────────────
export const examsService = {
  getAll: async (params: object): Promise<PagedResult<Exam>> => (await api.get('/exams', { params })).data,
  getById: async (id: string): Promise<Exam> => (await api.get(`/exams/${id}`)).data,
  create: async (data: object) => (await api.post('/exams', data)).data,
  update: async (id: string, data: object) => (await api.put(`/exams/${id}`, data)).data,
  delete: async (id: string) => api.delete(`/exams/${id}`),
  enterResults: async (id: string, data: object) => (await api.post(`/exams/${id}/results`, data)).data,
  getResults: async (id: string): Promise<ExamResult[]> => (await api.get(`/exams/${id}/results`)).data,
  exportResults: async (id: string): Promise<Blob> => (await api.get(`/exams/${id}/results/export`, { responseType: 'blob' })).data,
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsService = {
  getAll: async (params: object) => (await api.get('/notifications', { params })).data,
  send: async (data: object) => (await api.post('/notifications', data)).data,
  markRead: async (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: async () => api.patch('/notifications/read-all'),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsService = {
  getRevenue: async () => (await api.get('/reports/revenue')).data,
  getAttendance: async () => (await api.get('/reports/attendance')).data,
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsService = {
  getCenterSettings: async () => (await api.get('/settings')).data,
  updateCenterSettings: async (data: object) => (await api.put('/settings', data)).data,
  updateProfile: async (data: object) => (await api.put('/auth/profile', data)).data,
  changePassword: async (data: object) => (await api.post('/auth/change-password', data)).data,
  getNotificationPrefs: async () => (await api.get('/auth/notifications')).data,
  updateNotificationPrefs: async (data: object) => (await api.put('/auth/notifications', data)).data,
}

export const superAdminService = {
  getCenters: async (params: object): Promise<PagedResult<Center>> => (await api.get('/super-admin/centers', { params })).data,
  createCenter: async (data: object) => (await api.post('/super-admin/centers', data)).data,
  toggleCenter: async (id: string) => (await api.patch(`/super-admin/centers/${id}/toggle`)).data,
  deleteCenter: async (id: string) => api.delete(`/super-admin/centers/${id}`),
  getPlans: async () => (await api.get('/super-admin/plans')).data,
  getAuditLogs: async (params: object) => (await api.get('/super-admin/audit-logs', { params })).data,
  broadcastNotification: async (data: object) => api.post('/super-admin/notifications/broadcast', data),
  getRevenueAnalytics: async (months: number) => (await api.get('/super-admin/analytics/revenue', { params: { months } })).data,
}

