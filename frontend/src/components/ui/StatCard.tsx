import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  trend?: number
  icon: React.ElementType
  color?: string
}

export function StatCard({ title, value, trend, icon: Icon, color = 'indigo' }: Props) {
  const colors: any = {
    indigo: { bg: 'rgba(108,92,231,0.12)', icon: '#A89BFF' },
    emerald: { bg: 'rgba(0,184,148,0.12)', icon: '#00B894' },
    amber: { bg: 'rgba(253,203,110,0.12)', icon: '#FDCB6E' },
    red: { bg: 'rgba(255,107,107,0.12)', icon: '#FF6B6B' },
  }
  const c = colors[color] || colors.indigo
  const up = trend !== undefined && trend > 0

  return (
    <div className="rounded-2xl p-5 flex items-start justify-between hover:translate-y-[-2px] transition-all duration-200"
      style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
      <div>
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>{title}</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {up ? <TrendingUp className="w-3 h-3" style={{ color: 'var(--green)' }} />
              : <TrendingDown className="w-3 h-3" style={{ color: 'var(--red)' }} />}
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
