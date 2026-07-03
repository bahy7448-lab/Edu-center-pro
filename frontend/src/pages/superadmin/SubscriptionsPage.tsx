import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { PageHeader, DataTable, Badge } from '../../components/ui'
import api from '../../services/api'

export function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page],
    queryFn: async () => (await api.get('/super-admin/subscriptions', { params: { page, pageSize: 10 } })).data,
  })

  const subs = data?.items || data || []
  const columns = [
    { key: 'centerName', header: 'المركز', render: (v: string) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--purple-l)' }}>
          {v?.charAt(0)}
        </div>
        <span style={{ color: 'var(--text-1)' }}>{v}</span>
      </div>
    )},
    { key: 'plan', header: 'الباقة', render: (v: string) => {
      const variant = v === 'premium' ? 'purple' : v === 'basic' ? 'info' : 'default'
      return <Badge variant={variant as any}>{v === 'premium' ? 'بريميوم' : v === 'basic' ? 'أساسية' : 'مجانية'}</Badge>
    }},
    { key: 'startDate', header: 'بداية', render: (v: string) => <span style={{ color: 'var(--text-3)' }}>{v ? new Date(v).toLocaleDateString('ar-EG') : '—'}</span> },
    { key: 'endDate', header: 'نهاية', render: (v: string) => {
      if (!v) return <span style={{ color: 'var(--text-3)' }}>—</span>
      const expired = new Date(v) < new Date()
      return <span style={{ color: expired ? 'var(--red)' : 'var(--text-2)' }}>{new Date(v).toLocaleDateString('ar-EG')}</span>
    }},
    { key: 'amount', header: 'المبلغ', render: (v: number) => <span style={{ color: 'var(--green)' }}>{v?.toLocaleString() || 0} ج.م</span> },
    { key: 'status', header: 'الحالة', render: (v: string) => {
      const map: any = { active: { variant: 'success', label: 'نشط', icon: CheckCircle2 }, expired: { variant: 'danger', label: 'منتهي', icon: XCircle }, pending: { variant: 'warning', label: 'معلق', icon: Clock } }
      const s = map[v] || map.active
      return <Badge variant={s.variant}>{s.label}</Badge>
    }},
  ]

  const subsWithId = Array.isArray(subs) ? subs.map((s: any, i: number) => ({ ...s, id: s.id || String(i) })) : []

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="إدارة الاشتراكات" subtitle="متابعة اشتراكات جميع المراكز" icon={CreditCard} />
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <DataTable columns={columns} data={subsWithId} isLoading={isLoading}
          page={page} totalPages={data?.totalPages || 1} onPageChange={setPage}
          emptyMessage="لا توجد اشتراكات" />
      </div>
    </div>
  )
}
