import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { Users, GraduationCap, BookOpen, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, QrCode } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

const PIE_COLORS = ['#00B894', '#FDCB6E', '#FF6B6B', '#6C5CE7']

function StatCard({ title, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    indigo: { bg: 'rgba(108,92,231,0.12)', icon: 'var(--purple-l)', text: 'var(--text-1)' },
    emerald: { bg: 'rgba(0,184,148,0.12)', icon: 'var(--green)', text: 'var(--text-1)' },
    amber: { bg: 'rgba(253,203,110,0.12)', icon: 'var(--amber)', text: 'var(--text-1)' },
    red: { bg: 'rgba(255,107,107,0.12)', icon: 'var(--red)', text: 'var(--text-1)' },
  }
  const c = colors[color] || colors.indigo
  const up = trend > 0

  return (
    <div className="rounded-2xl p-5 flex items-start justify-between transition-all hover:translate-y-[-2px] duration-200"
      style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
      <div>
        <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{title}</p>
        <p className="text-2xl font-bold" style={{ color: c.text }}>{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1.5">
            {up ? <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
              : <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />}
            <span className="text-xs" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: c.bg }}>
        <Icon className="w-5 h-5" style={{ color: c.icon }} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{ background: 'var(--navy-700)', border: '1px solid var(--border-s)', color: 'var(--text-2)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  )
}

export function CenterAdminDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['centerDashboard'],
    queryFn: dashboardService.getCenterDashboard,
    refetchInterval: 60_000,
  })

  if (isLoading) return <LoadingSpinner />
  const d = data!

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>لوحة التحكم</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/qr-codes')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
          style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--green)', border: '1px solid rgba(0,184,148,0.2)' }}>
          <QrCode className="w-4 h-4" /> مسح الحضور
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلاب" value={d.totalStudents} trend={d.studentsTrend} icon={Users} color="indigo" />
        <StatCard title="المدرسون" value={d.totalTeachers} icon={GraduationCap} color="emerald" />
        <StatCard title="المجموعات النشطة" value={d.activeGroups} icon={BookOpen} color="amber" />
        <StatCard title="إيرادات الشهر" value={`${d.monthlyRevenue?.toLocaleString()} ج.م`} trend={d.revenueTrend} icon={TrendingUp} color="indigo" />
      </div>

      {/* Financial row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'الإيرادات', value: d.monthlyRevenue, color: 'var(--green)' },
          { label: 'المصروفات', value: d.monthlyExpenses, color: 'var(--red)' },
          { label: 'صافي الربح', value: d.monthlyRevenue - d.monthlyExpenses, color: 'var(--purple-l)' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl p-5"
            style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{item.label}</p>
            <p className="text-xl font-bold" style={{ color: item.color }}>
              {item.value?.toLocaleString()} ج.م
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>الإيرادات الشهرية</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.revenueChart || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#6C5CE7" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payments pie */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>حالة المدفوعات</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={d.paymentStatus || []} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                dataKey="value" paddingAngle={3}>
                {(d.paymentStatus || []).map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {(d.paymentStatus || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span style={{ color: 'var(--text-3)' }}>{item.name}</span>
                </div>
                <span style={{ color: 'var(--text-2)' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance chart */}
      <div className="rounded-2xl p-5"
        style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>الحضور الأسبوعي</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={d.attendanceChart || []} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="present" name="حاضر" fill="#00B894" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" name="غائب" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      {d.alerts?.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>التنبيهات</h3>
          {d.alerts.map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl"
              style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--red)' }} />
              <span style={{ color: 'var(--text-2)' }}>{a.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
