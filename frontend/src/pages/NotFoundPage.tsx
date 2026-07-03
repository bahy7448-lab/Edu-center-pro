// ── 404 Page ──────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
      <p className="text-8xl font-bold text-indigo-200 dark:text-indigo-900">404</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">الصفحة غير موجودة</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">لا توجد الصفحة التي تبحث عنها</p>
      <button onClick={() => navigate(-1)} className="btn btn-primary mt-6">العودة للخلف</button>
    </div>
  )
}
