import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader, Badge, toast } from '../../components/ui'
import { notificationsService } from '../../services'

const iconMap: any = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle }
const colorMap: any = {
  info:    { bg: 'rgba(108,92,231,0.12)', color: 'var(--purple-l)' },
  success: { bg: 'rgba(0,184,148,0.12)',  color: 'var(--green)' },
  warning: { bg: 'rgba(253,203,110,0.12)',color: 'var(--amber)' },
  error:   { bg: 'rgba(255,107,107,0.12)',color: 'var(--red)' },
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', filter],
    queryFn: () => notificationsService.getAll({ isRead: filter === 'unread' ? false : undefined, pageSize: 50 }),
    refetchInterval: 30_000,
  })

  const markAllMut = useMutation({
    mutationFn: () => notificationsService.markAllRead?.() || Promise.resolve(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('تم تعليم الكل كمقروء') },
  })

  const notifications = data?.items || []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  const grouped = notifications.reduce((acc: any, n: any) => {
    const date = new Date(n.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(n)
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="الإشعارات" subtitle="جميع التنبيهات والإشعارات" icon={Bell}
        actions={
          <div className="flex gap-2">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
                  style={filter === f ? { background: 'rgba(108,92,231,0.2)', color: 'var(--purple-l)' } : { color: 'var(--text-3)' }}>
                  {f === 'all' ? 'الكل' : `غير مقروء (${unreadCount})`}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button onClick={() => markAllMut.mutate()}
                className="btn flex items-center gap-2 text-xs"
                style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--green)', border: '1px solid rgba(0,184,148,0.2)' }}>
                <CheckCheck className="w-4 h-4" /> تعليم الكل كمقروء
              </button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(108,92,231,0.3)', borderTopColor: 'var(--purple)' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Bell className="w-16 h-16 opacity-10" style={{ color: 'var(--text-1)' }} />
          <p style={{ color: 'var(--text-3)' }}>لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]: any) => (
            <div key={date}>
              <p className="text-xs font-medium mb-3 px-1" style={{ color: 'var(--text-3)' }}>{date}</p>
              <div className="space-y-2">
                {items.map((n: any) => {
                  const type = n.type?.toLowerCase() || 'info'
                  const Icon = iconMap[type] || Info
                  const c = colorMap[type] || colorMap.info
                  return (
                    <div key={n.id} className="flex items-start gap-4 p-4 rounded-2xl transition-all"
                      style={{
                        background: n.isRead ? 'var(--navy-800)' : 'rgba(108,92,231,0.05)',
                        border: n.isRead ? '1px solid var(--border)' : '1px solid rgba(108,92,231,0.2)',
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                        <Icon className="w-4 h-4" style={{ color: c.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: 'var(--purple)' }} />}
                        </div>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{n.message}</p>
                        <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                          {new Date(n.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
