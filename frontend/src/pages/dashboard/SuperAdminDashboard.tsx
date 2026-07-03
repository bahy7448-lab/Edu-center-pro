import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Building2, Users, GraduationCap, TrendingUp, Activity, CreditCard } from 'lucide-react'
import { dashboardService } from '../../services'
import { StatCard, LoadingSpinner } from '../../components/ui'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']
const PLAN_LABELS: Record<string, string> = { free: 'مجانية', basic: 'أساسية', premium: 'بريميوم' }

export function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['superAdminDashboard'],
    queryFn: dashboardService.getSuperAdminDashboard,
    refetchInterval: 60_000,
  })

  if (isLoading) return <LoadingSpinner />
  const d = data!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة تحكم Super Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة شاملة لجميع المراكز التعليمية</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="إجمالي المراكز" value={d.totalCenters} icon={Building2} color="indigo" />
        <StatCard title="المراكز النشطة" value={d.activeCenters} icon={Activity} color="emerald" />
        <StatCard title="إجمالي الطلاب" value={d.totalStudents} icon={Users} color="amber" />
        <StatCard title="إجمالي الإيرادات" value={`${d.totalRevenue?.toLocaleString()} ج.م`} icon={TrendingUp} color="indigo" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">الإيرادات الشهرية للمنصة</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.revenueChart}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ج.م`, 'الإيرادات']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">نمو المراكز</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.centerGrowth}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="centers" fill="#10b981" radius={[4, 4, 0, 0]} name="المراكز" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">توزيع الخطط</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={d.planDistribution?.map((p: any) => ({ ...p, plan: PLAN_LABELS[p.plan] || p.plan }))}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="plan"
              >
                {d.planDistribution?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" /> ملخص الاشتراكات
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'مجانية', plan: 'free', color: 'bg-gray-100 text-gray-700' },
              { label: 'أساسية', plan: 'basic', color: 'bg-indigo-100 text-indigo-700' },
              { label: 'بريميوم', plan: 'premium', color: 'bg-amber-100 text-amber-700' },
            ].map(p => ({
              ...p,
              count: d.planDistribution?.find((x: any) => x.plan === p.plan)?.count ?? 0,
            })).map(p => (
              <div key={p.label} className={`rounded-xl p-4 ${p.color}`}>
                <p className="text-xs font-medium opacity-70">{p.label}</p>
                <p className="text-3xl font-bold mt-1">{p.count}</p>
                <p className="text-xs mt-1">مركز</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">إيرادات هذا الشهر</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {d.monthlyRevenue?.toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
              <p className="text-xs text-indigo-700 dark:text-indigo-400">إجمالي المدرسين</p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                {d.totalTeachers?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
