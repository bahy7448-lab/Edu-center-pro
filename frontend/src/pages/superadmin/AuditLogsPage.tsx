import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText, Search } from 'lucide-react'
import { PageHeader, DataTable, Badge } from '../../components/ui'
import api from '../../services/api'

export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: async () => (await api.get('/super-admin/audit-logs', { params: { page, pageSize: 15, search } })).data,
  })

  const logs = data?.items || data || []
  const columns = [
    { key: 'createdAt', header: 'الوقت', render: (v: string) => (
      <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
        {new Date(v).toLocaleString('ar-EG')}
      </span>
    )},
    { key: 'userEmail', header: 'المستخدم', render: (v: string) => <span style={{ color: 'var(--text-2)' }}>{v || '—'}</span> },
    { key: 'action', header: 'الإجراء', render: (v: string) => {
      const variant = v?.includes('DELETE') ? 'danger' : v?.includes('POST') || v?.includes('CREATE') ? 'success' : 'info'
      return <Badge variant={variant as any}>{v}</Badge>
    }},
    { key: 'resource', header: 'المورد', render: (v: string) => <span style={{ color: 'var(--text-3)' }}>{v || '—'}</span> },
    { key: 'ipAddress', header: 'IP', render: (v: string) => <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{v || '—'}</span> },
    { key: 'status', header: 'الحالة', render: (v: number) => (
      <Badge variant={v >= 200 && v < 300 ? 'success' : 'danger'}>{v || 200}</Badge>
    )},
  ]

  const logsWithId = Array.isArray(logs) ? logs.map((l: any, i: number) => ({ ...l, id: l.id || String(i) })) : []

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="سجلات التدقيق" subtitle="تتبع جميع العمليات والأنشطة في النظام" icon={ScrollText} />
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <div className="p-4 flex gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث في السجلات..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-s)', color: 'var(--text-1)' }} />
          </div>
        </div>
        <DataTable columns={columns} data={logsWithId} isLoading={isLoading}
          page={page} totalPages={data?.totalPages || 1} onPageChange={setPage}
          emptyMessage="لا توجد سجلات" />
      </div>
    </div>
  )
}
