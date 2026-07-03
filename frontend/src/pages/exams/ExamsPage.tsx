import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ClipboardList, BarChart2 } from 'lucide-react'
import { examsService } from '../../services'
import { PageHeader, Badge, DataTable, Modal, toast } from '../../components/ui'
import { useForm } from 'react-hook-form'
import type { Exam } from '../../types'

export function ExamsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [resultsExam, setResultsExam] = useState<Exam | null>(null)
  const { register, handleSubmit, reset } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['exams', page],
    queryFn: () => examsService.getAll({ page }),
  })

  const { data: examResults } = useQuery({
    queryKey: ['exam-results', resultsExam?.id],
    queryFn: () => examsService.getResults(resultsExam!.id),
    enabled: !!resultsExam,
  })

  const createMutation = useMutation({
    mutationFn: (d: object) => examsService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); setShowCreate(false); reset(); toast.success('تم إضافة الامتحان') },
  })

  const statusMap: Record<string, { label: string; variant: any }> = {
    Scheduled: { label: 'مجدول', variant: 'info' },
    InProgress: { label: 'جارٍ', variant: 'warning' },
    Completed: { label: 'منتهي', variant: 'success' },
    Cancelled: { label: 'ملغي', variant: 'danger' },
  }

  const columns = [
    { key: 'title', header: 'الامتحان' },
    { key: 'groupName', header: 'المجموعة' },
    { key: 'examDate', header: 'التاريخ', render: (v: string) => new Date(v).toLocaleDateString('ar-EG') },
    { key: 'maxScore', header: 'الدرجة الكاملة' },
    { key: 'resultsCount', header: 'النتائج', render: (v: number) => <span className="font-medium">{v}</span> },
    { key: 'avgScore', header: 'متوسط الدرجات', render: (v: number) => v != null ? `${v.toFixed(1)}` : '—' },
    { key: 'status', header: 'الحالة', render: (v: string) => <Badge variant={statusMap[v]?.variant}>{statusMap[v]?.label ?? v}</Badge> },
    {
      key: 'actions', header: '',
      render: (_: any, row: Exam) => (
        <button onClick={() => setResultsExam(row)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
          <BarChart2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="الامتحانات" subtitle={`${data?.total ?? 0} امتحان`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />إضافة امتحان
          </button>
        }
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading}
          page={page} totalPages={Math.ceil((data?.total ?? 0) / 20)} onPageChange={setPage}
          emptyMessage="لا توجد امتحانات" />
      </div>

      {/* Create Exam Modal */}
      <Modal open={showCreate} title="إضافة امتحان جديد" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">اسم الامتحان</label>
            <input {...register('title', { required: true })} className="input w-full" placeholder="مثال: امتحان منتصف الفصل" />
          </div>
          <div>
            <label className="label">معرف المجموعة</label>
            <input {...register('groupId', { required: true })} className="input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الدرجة الكاملة</label>
              <input type="number" {...register('maxScore', { required: true })} defaultValue={100} className="input w-full" />
            </div>
            <div>
              <label className="label">درجة النجاح</label>
              <input type="number" {...register('passScore', { required: true })} defaultValue={50} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="label">تاريخ الامتحان</label>
            <input type="datetime-local" {...register('examDate', { required: true })} className="input w-full" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline">إلغاء</button>
            <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Results Modal */}
      <Modal open={!!resultsExam} title={`نتائج: ${resultsExam?.title}`} onClose={() => setResultsExam(null)} size="xl">
        {examResults && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-indigo-600 dark:text-indigo-400">المتوسط</p>
                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{(examResults.reduce((s: number, r: any) => s + r.score, 0) / examResults.length || 0).toFixed(1)}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">ناجح</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{examResults.filter((r: any) => r.grade !== 'F').length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-red-600 dark:text-red-400">راسب</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">{examResults.filter((r: any) => r.grade === 'F').length}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-3 py-2 text-right">الطالب</th>
                    <th className="px-3 py-2 text-right">الدرجة</th>
                    <th className="px-3 py-2 text-right">التقدير</th>
                    <th className="px-3 py-2 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {examResults.map((r: any) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-gray-900 dark:text-white">{r.studentName}</td>
                      <td className="px-3 py-2 font-medium">{r.isAbsent ? '—' : r.score}</td>
                      <td className="px-3 py-2"><Badge variant={r.grade === 'F' ? 'danger' : r.grade?.startsWith('A') ? 'success' : 'warning'}>{r.isAbsent ? 'غائب' : r.grade}</Badge></td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{r.feedback ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
