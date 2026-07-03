import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { superAdminService } from '../../services'
import { PageHeader, DataTable, Badge } from '../../components/ui'

// ── Audit Logs ────────────────────────────────────────────────────────────────
export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page],
    queryFn: () => superAdminService.getAuditLogs({ page }),
  })

  const columns = [
    { key: 'timestamp', header: 'الوقت', render: (v: string) => new Date(v).toLocaleString('ar-EG') },
    { key: 'userName', header: 'المستخدم' },
    {
      key: 'action', header: 'الإجراء',
      render: (v: string) => {
        const variant = v.includes('Delete') ? 'danger' : v.includes('Create') ? 'success' : 'info'
        return <Badge variant={variant}>{v}</Badge>
      }
    },
    { key: 'entityName', header: 'الكيان' },
    { key: 'entityId', header: 'المعرف', render: (v: string) => <span className="font-mono text-xs text-gray-500">{v?.slice(0, 8)}...</span> },
    { key: 'ipAddress', header: 'IP', render: (v: string) => <span className="font-mono text-xs">{v ?? '—'}</span> },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="سجلات المراجعة" subtitle="تتبع جميع العمليات على المنصة" />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading}
          page={page} totalPages={Math.ceil((data?.total ?? 0) / 50)} onPageChange={setPage}
          emptyMessage="لا توجد سجلات" />
      </div>
    </div>
  )
}

// ── Subscriptions Page ─────────────────────────────────────────────────────────
export function SubscriptionsPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: superAdminService.getPlans,
  })

  const planColors: Record<string, string> = {
    Basic: 'border-gray-300 dark:border-gray-600',
    Professional: 'border-indigo-400 dark:border-indigo-500',
    Enterprise: 'border-amber-400 dark:border-amber-500',
  }

  return (
    <div className="space-y-5">
      <PageHeader title="خطط الاشتراك" subtitle="إدارة خطط وأسعار الاشتراك" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan: any) => (
            <div key={plan.id} className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${planColors[plan.name] ?? 'border-gray-200'} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <Badge variant={plan.isActive ? 'success' : 'danger'}>{plan.isActive ? 'نشط' : 'موقوف'}</Badge>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{plan.monthlyPrice.toLocaleString()} <span className="text-base font-normal text-gray-500">ج.م / شهر</span></p>
                <p className="text-sm text-gray-500 mt-1">{plan.yearlyPrice.toLocaleString()} ج.م / سنة</p>
              </div>

              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  حتى {plan.maxStudents === -1 ? 'غير محدود' : plan.maxStudents} طالب
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  حتى {plan.maxTeachers === -1 ? 'غير محدود' : plan.maxTeachers} مدرس
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  {plan.maxBranches === -1 ? 'فروع غير محدودة' : `${plan.maxBranches} فرع`}
                </li>
                {plan.hasAiFeatures && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span>ميزات الذكاء الاصطناعي</li>}
                {plan.hasWhatsApp && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span>إشعارات WhatsApp</li>}
                {plan.hasSms && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span>إشعارات SMS</li>}
              </ul>

              <button className="btn btn-outline w-full mt-6 text-sm">تعديل الخطة</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
