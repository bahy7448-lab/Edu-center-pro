import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, CalendarCheck, Receipt, Users } from 'lucide-react'
import { PageHeader, StatCard, DataTable, Badge } from '../../components/ui'
import { reportsService } from '../../services'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  Paid: 'success', Pending: 'warning', Overdue: 'danger',
  Present: 'success', Absent: 'danger', Late: 'warning',
}
const STATUS_LABEL: Record<string, string> = {
  Paid: 'مدفوع', Pending: 'معلق', Overdue: 'متأخر',
  Present: 'حاضر', Absent: 'غائب', Late: 'متأخر',
}

export function ReportsPage() {
  const [tab, setTab] = useState<'revenue' | 'attendance'>('revenue')

  const revenueQuery = useQuery({ queryKey: ['reports', 'revenue'], queryFn: reportsService.getRevenue })
  const attendanceQuery = useQuery({ queryKey: ['reports', 'attendance'], queryFn: reportsService.getAttendance })

  const revenueItems = revenueQuery.data?.items ?? []
  const attendanceItems = attendanceQuery.data?.items ?? []
  const presentCount = attendanceItems.filter((a: any) => a.status === 'Present').length
  const attendanceRate = attendanceItems.length ? Math.round((presentCount / attendanceItems.length) * 100) : 0

  return (
    <div className="space-y-5">
      <PageHeader title="التقارير" subtitle="ملخص الإيرادات والحضور" />

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
            ${tab === 'revenue' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'}`}
        >
          <DollarSign className="w-4 h-4" /> تقرير الإيرادات
        </button>
        <button
          onClick={() => setTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
            ${tab === 'attendance' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'}`}
        >
          <CalendarCheck className="w-4 h-4" /> تقرير الحضور
        </button>
      </div>

      {tab === 'revenue' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="إجمالي الإيرادات" value={`${(revenueQuery.data?.total ?? 0).toLocaleString()} ج.م`} icon={DollarSign} color="emerald" />
            <StatCard title="عدد الدفعات" value={revenueItems.length} icon={Receipt} color="indigo" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <DataTable
              isLoading={revenueQuery.isLoading}
              page={1}
              totalPages={1}
              onPageChange={() => {}}
              emptyMessage="لا توجد دفعات مسجلة"
              data={revenueItems}
              columns={[
                { key: 'studentName', header: 'الطالب' },
                { key: 'groupName', header: 'المجموعة' },
                { key: 'netAmount', header: 'المبلغ', render: (v) => `${(v ?? 0).toLocaleString()} ج.م` },
                { key: 'status', header: 'الحالة', render: (v) => <Badge variant={STATUS_VARIANT[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Badge> },
                { key: 'paidDate', header: 'تاريخ الدفع', render: (v) => v || '—' },
              ]}
            />
          </div>
        </>
      )}

      {tab === 'attendance' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="إجمالي السجلات" value={attendanceItems.length} icon={Users} color="indigo" />
            <StatCard title="نسبة الحضور" value={`${attendanceRate}%`} icon={CalendarCheck} color="emerald" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <DataTable
              isLoading={attendanceQuery.isLoading}
              page={1}
              totalPages={1}
              onPageChange={() => {}}
              emptyMessage="لا توجد سجلات حضور"
              data={attendanceItems}
              columns={[
                { key: 'studentName', header: 'الطالب' },
                { key: 'groupName', header: 'المجموعة' },
                { key: 'date', header: 'التاريخ' },
                { key: 'status', header: 'الحالة', render: (v) => <Badge variant={STATUS_VARIANT[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Badge> },
                { key: 'checkInTime', header: 'وقت الحضور', render: (v) => v || '—' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  )
}
