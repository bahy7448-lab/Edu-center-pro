import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, TrendingUp, Users, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader, Badge } from '../../components/ui'
import api from '../../services/api'

const teachersService = {
  getAll: async (params: any) => (await api.get('/teachers', { params })).data,
  getIncome: async (id: string, month: string) => (await api.get(`/teachers/${id}/income`, { params: { month } })).data,
}

function TeacherIncomeCard({ teacher }: { teacher: any }) {
  const [open, setOpen] = useState(false)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [month, setMonth] = useState(currentMonth)

  const { data: income, isLoading } = useQuery({
    queryKey: ['teacher-income', teacher.id, month],
    queryFn: () => teachersService.getIncome(teacher.id, month),
    enabled: open,
  })

  const groups = income?.groups || []
  const totalStudents = groups.reduce((s: number, g: any) => s + (g.studentsCount || 0), 0)
  const totalRevenue = groups.reduce((s: number, g: any) => s + (g.revenue || 0), 0)
  const teacherShare = Math.round(totalRevenue * ((teacher.sharePercent || 70) / 100))

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: 'rgba(108,92,231,0.2)', color: 'var(--purple-l)' }}>
          {teacher.fullName?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{teacher.fullName}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{teacher.specialization}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={teacher.isActive ? 'success' : 'danger'}>{teacher.isActive ? 'نشط' : 'غير نشط'}</Badge>
          <button onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition" style={{ color: 'var(--text-3)' }}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick stats always visible */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {[
          { label: 'المجموعات', value: teacher.groupsCount || 0, color: 'var(--purple-l)' },
          { label: 'الطلاب', value: teacher.studentsCount || totalStudents || '—', color: 'var(--green)' },
          { label: 'الراتب الأساسي', value: `${(teacher.salary || 0).toLocaleString()} ج`, color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Expandable income details */}
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Month picker */}
          <div className="flex items-center justify-between pt-3">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>تقرير الدخل</p>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-s)', color: 'var(--text-2)' }} />
          </div>

          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(108,92,231,0.3)', borderTopColor: 'var(--purple)' }} />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-3)' }}>لا توجد مجموعات لهذا الشهر</p>
          ) : (
            <>
              {/* Groups breakdown */}
              <div className="space-y-2">
                {groups.map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{g.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-3)' }}>
                          <Users className="w-3 h-3" />{g.studentsCount} طالب
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>×</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{g.monthlyFee} ج.م</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>{(g.revenue || 0).toLocaleString()} ج.م</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>إيراد المجموعة</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(108,92,231,0.06)', border: '1px solid rgba(108,92,231,0.15)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-3)' }}>إجمالي الإيراد</span>
                  <span style={{ color: 'var(--text-2)' }}>{totalRevenue.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-3)' }}>نسبة المدرس ({teacher.sharePercent || 70}%)</span>
                  <span style={{ color: 'var(--green)' }}>{teacherShare.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-3)' }}>نسبة السنتر ({100 - (teacher.sharePercent || 70)}%)</span>
                  <span style={{ color: 'var(--purple-l)' }}>{(totalRevenue - teacherShare).toLocaleString()} ج.م</span>
                </div>
                <div className="h-px" style={{ background: 'var(--border)' }} />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>صافي دخل المدرس</span>
                  <span className="text-base font-bold" style={{ color: 'var(--green)' }}>{teacherShare.toLocaleString()} ج.م</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function TeachersPage() {
  const [search, setSearch] = useState('')
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersService.getAll({ pageSize: 100 }),
  })

  const teachers = (data?.items || data || []).filter((t: any) =>
    !search || t.fullName?.includes(search) || t.specialization?.includes(search)
  )

  const totalTeacherIncome = teachers.reduce((s: number, t: any) =>
    s + Math.round((t.monthlyRevenue || 0) * ((t.sharePercent || 70) / 100)), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="المدرسون ودخلهم" subtitle="تتبع دخل كل مدرس من مجموعاته الشهرية" icon={GraduationCap} />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي المدرسين', value: teachers.length, color: 'var(--purple-l)' },
          { label: 'المدرسون النشطون', value: teachers.filter((t: any) => t.isActive).length, color: 'var(--green)' },
          { label: 'إجمالي دخل المدرسين', value: `${totalTeacherIncome.toLocaleString()} ج.م`, color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="ابحث باسم المدرس أو التخصص..."
        className="w-full max-w-xs px-3 py-2 text-sm rounded-xl outline-none"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-s)', color: 'var(--text-1)' }} />

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--navy-800)' }} />)}
        </div>
      ) : teachers.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <GraduationCap className="w-12 h-12 opacity-10" style={{ color: 'var(--text-1)' }} />
          <p style={{ color: 'var(--text-3)' }}>لا يوجد مدرسون</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((t: any) => <TeacherIncomeCard key={t.id} teacher={t} />)}
        </div>
      )}
    </div>
  )
}
