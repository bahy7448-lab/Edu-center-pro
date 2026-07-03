import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studentsService } from '../../services'
import { Badge } from '../../components/ui'
import { ArrowRight } from 'lucide-react'
export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student, isLoading } = useQuery({ queryKey: ['student', id], queryFn: () => studentsService.getById(id!) })
  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
  if (!student) return <div className="p-6 text-gray-500">الطالب غير موجود</div>
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/students')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"><ArrowRight className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{student.fullName}</h1>
          <p className="text-sm text-gray-500">{student.studentCode}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-gray-400">الهاتف</p><p className="font-medium text-gray-900 dark:text-white">{student.phone || '—'}</p></div>
        <div><p className="text-xs text-gray-400">البريد الإلكتروني</p><p className="font-medium text-gray-900 dark:text-white">{student.email || '—'}</p></div>
        <div><p className="text-xs text-gray-400">تاريخ الالتحاق</p><p className="font-medium text-gray-900 dark:text-white">{new Date(student.enrollDate).toLocaleDateString('ar-EG')}</p></div>
        <div><p className="text-xs text-gray-400">الحالة</p><Badge variant={student.isActive ? 'success' : 'danger'}>{student.isActive ? 'نشط' : 'غير نشط'}</Badge></div>
        <div><p className="text-xs text-gray-400">إجمالي المدفوع</p><p className="font-bold text-emerald-600">{student.totalPaid} ج.م</p></div>
        <div><p className="text-xs text-gray-400">إجمالي المستحق</p><p className="font-bold text-red-500">{student.totalDue} ج.م</p></div>
      </div>
    </div>
  )
}
