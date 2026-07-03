export interface Student {
  id: string; fullName: string; phone?: string; email?: string
  studentCode?: string; qrCode: string; photoUrl?: string
  enrollDate: string; isActive: boolean; centerId: string; branchId?: string
  groupsCount: number; totalPaid: number; totalDue: number
}

export interface Teacher {
  id: string; fullName: string; phone: string; email?: string
  specialization?: string; photoUrl?: string; salary?: number
  hireDate: string; isActive: boolean; groupsCount: number
}

export interface Group {
  id: string; name: string; subjectId: string; subjectName: string
  teacherId: string; teacherName: string; schedule?: string
  maxCapacity: number; enrolledCount: number; monthlyFee?: number; isActive: boolean
}

export interface Subject {
  id: string; name: string; description?: string; color?: string; isActive: boolean; groupsCount: number
}

export interface Attendance {
  id: string; studentId: string; studentName: string; groupId: string; groupName: string
  date: string; status: string; method: string; checkInTime?: string
}

export interface Payment {
  id: string; studentId: string; studentName: string; groupId?: string; groupName?: string
  amount: number; discount?: number; netAmount: number; method: string; status: string
  description?: string; dueDate: string; paidDate?: string; receiptNumber?: string
}

export interface Exam {
  id: string; groupId: string; groupName: string; title: string; description?: string
  maxScore: number; passScore: number; examDate: string; status: string
  resultsCount: number; avgScore?: number
}

export interface ExamResult {
  id: string; examId: string; examTitle: string; studentId: string; studentName: string
  score: number; grade?: string; feedback?: string; isAbsent: boolean
}

export interface Branch {
  id: string; name: string; address?: string; phone?: string; isActive: boolean
}

export interface Center {
  id: string; name: string; slug: string; logoUrl?: string; phone?: string; email?: string
  isActive: boolean; studentsCount: number; teachersCount: number
  activePlan?: string; subscriptionExpiry?: string; createdAt: string
}

export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }

export interface AuthUser { id: string; fullName: string; email: string; role: string; centerId?: string; avatarUrl?: string }
