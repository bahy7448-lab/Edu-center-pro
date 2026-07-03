import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, TrendingUp, TrendingDown, Award } from 'lucide-react'
import { PageHeader, DataTable, Badge, LoadingSpinner } from '../../components/ui'
import api from '../../services/api'

const gradesService = {
  getAll: async (params: any) => (await api.get('/exams', { params })).data,
  getResults: async (examId: string) => (await api.get(`/exams/${examId}/results`)).data,
}

function GradeBar({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100)
  const color = pct >= 85 ? 'var(--green)' : pct >= 65 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function GradesPage() {
  const [page, setPage] = useState(1)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams-grades', page],
    queryFn: () => gradesService.getAll({ page, pageSize: 10 }),
  })
  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['exam-results', selectedExam],
    queryFn: () => gradesService.getResults(selectedExam!),
    enabled: !!selectedExam,
  })

  const examList = exams?.items || []
  const resultList = results || []
  const avgScore = resultList.length ? Math.round(resultList.reduce((s: number, r: any) => s + (r.score / r.totalMarks * 100), 0) / resultList.length) : 0
  const passed = resultList.filter((r: any) => r.score / r.totalMarks >= 0.5).length

  const examCols = [
    { key: 'title', header: 'الامتحان', render: (v: string, row: any) => (
      <button onClick={() => setSelectedExam(selectedExam === row.id ? null : row.id)}
        className="text-sm font-medium text-right transition"
        style={{ color: selectedExam === row.id ? 'var(--purple-l)' : 'var(--text-1)' }}>
        {v}
      </button>
    )},
    { key: 'groupName', header: 'المجموعة', render: (v: string) => <span style={{ color: 'var(--text-3)' }}>{v}</span> },
    { key: 'examDate', header: 'التاريخ', render: (v: string) => <span style={{ color: 'var(--text-3)' }}>{new Date(v).toLocaleDateString('ar-EG')}</span> },
    { key: 'totalMarks', header: 'الدرجة الكاملة', render: (v: number) => <span style={{ color: 'var(--text-2)' }}>{v}</span> },
    { key: 'id', header: 'النتائج', render: (_: any, row: any) => (
      <button onClick={() => setSelectedExam(selectedExam === row.id ? null : row.id)}
        className="text-xs px-3 py-1 rounded-lg transition"
        style={{ background: selectedExam === row.id ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)', color: selectedExam === row.id ? 'var(--purple-l)' : 'var(--text-3)' }}>
        {selectedExam === row.id ? 'إخفاء' : 'عرض النتائج'}
      </button>
    )},
  ]

  const resultCols = [
    { key: 'studentName', header: 'الطالب', render: (v: string) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--purple-l)' }}>
          {v?.charAt(0)}
        </div>
        <span style={{ color: 'var(--text-1)' }}>{v}</span>
      </div>
    )},
    { key: 'score', header: 'الدرجة', render: (v: number, row: any) => (
      <div className="w-32">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-2)' }}>{v}</span>
          <span style={{ color: 'var(--text-3)' }}>/ {row.totalMarks}</span>
        </div>
        <GradeBar score={v} total={row.totalMarks} />
      </div>
    )},
    { key: 'grade', header: 'التقدير', render: (v: string, row: any) => {
      const pct = Math.round((row.score / row.totalMarks) * 100)
      const variant = pct >= 85 ? 'success' : pct >= 65 ? 'warning' : 'danger'
      const label = pct >= 85 ? 'ممتاز' : pct >= 75 ? 'جيد جداً' : pct >= 65 ? 'جيد' : pct >= 50 ? 'مقبول' : 'راسب'
      return <Badge variant={variant as any}>{label}</Badge>
    }},
    { key: 'notes', header: 'ملاحظات', render: (v: string) => <span className="text-xs" style={{ color: 'var(--text-3)' }}>{v || '—'}</span> },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="الدرجات والنتائج" subtitle="عرض وتحليل نتائج الامتحانات" icon={GraduationCap} />

      {selectedExam && resultList.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'متوسط الدرجات', value: `${avgScore}%`, icon: TrendingUp, color: 'var(--purple-l)' },
            { label: 'الناجحون', value: `${passed} / ${resultList.length}`, icon: Award, color: 'var(--green)' },
            { label: 'الراسبون', value: `${resultList.length - passed}`, icon: TrendingDown, color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>قائمة الامتحانات</h3>
        </div>
        <DataTable columns={examCols} data={examList} isLoading={isLoading}
          page={page} totalPages={exams?.totalPages || 1} onPageChange={setPage} />
      </div>

      {selectedExam && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>نتائج الطلاب</h3>
          </div>
          {loadingResults ? <LoadingSpinner /> : (
            <DataTable columns={resultCols} data={resultList.map((r: any, i: number) => ({ ...r, id: r.studentId || String(i) }))}
              page={1} totalPages={1} onPageChange={() => {}} emptyMessage="لا توجد نتائج لهذا الامتحان" />
          )}
        </div>
      )}
    </div>
  )
}
