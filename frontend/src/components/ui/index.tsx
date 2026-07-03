import { LucideIcon, ChevronLeft, ChevronRight, AlertTriangle, X, CheckCircle, XCircle, Info } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: 'success'|'danger'|'warning'|'info'|'default'|'purple' }
export function Badge({ children, variant = 'default' }: BadgeProps) {
  const v: any = {
    success: { background:'rgba(0,184,148,0.12)', color:'var(--green)' },
    danger:  { background:'rgba(255,107,107,0.12)', color:'var(--red)' },
    warning: { background:'rgba(253,203,110,0.12)', color:'var(--amber)' },
    info:    { background:'rgba(0,206,201,0.12)', color:'#00CEC9' },
    purple:  { background:'rgba(108,92,231,0.12)', color:'var(--purple-l)' },
    default: { background:'rgba(255,255,255,0.06)', color:'var(--text-3)' },
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={v[variant]}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {children}
    </span>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps { title:string; value:string|number; trend?:number; icon:LucideIcon; color?:'indigo'|'emerald'|'amber'|'red' }
export function StatCard({ title, value, trend, icon: Icon, color='indigo' }: StatCardProps) {
  const c: any = {
    indigo:  { bg:'rgba(108,92,231,0.12)', icon:'var(--purple-l)' },
    emerald: { bg:'rgba(0,184,148,0.12)',  icon:'var(--green)' },
    amber:   { bg:'rgba(253,203,110,0.12)',icon:'var(--amber)' },
    red:     { bg:'rgba(255,107,107,0.12)',icon:'var(--red)' },
  }
  const col = c[color]
  const up = trend !== undefined && trend >= 0
  return (
    <div className="rounded-2xl p-5 flex items-start justify-between hover:-translate-y-0.5 transition-all duration-200"
      style={{ background:'var(--navy-800)', border:'1px solid var(--border)' }}>
      <div>
        <p className="text-xs mb-1.5" style={{ color:'var(--text-3)' }}>{title}</p>
        <p className="text-2xl font-bold" style={{ color:'var(--text-1)' }}>{value}</p>
        {trend !== undefined && (
          <p className="text-xs mt-1" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
            {up ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: col.bg }}>
        <Icon className="w-5 h-5" style={{ color: col.icon }} />
      </div>
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, icon: Icon }: { title:string; subtitle?:string; actions?:React.ReactNode; icon?:LucideIcon }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background:'rgba(108,92,231,0.12)' }}>
            <Icon className="w-5 h-5" style={{ color:'var(--purple-l)' }} />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold" style={{ color:'var(--text-1)' }}>{title}</h1>
          {subtitle && <p className="text-sm mt-0.5" style={{ color:'var(--text-3)' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

// ── DataTable ─────────────────────────────────────────────────────────────────
interface Column<T> { key:string; header:string; render?:(value:any, row:T)=>React.ReactNode }
interface DataTableProps<T> {
  columns:Column<T>[]; data:T[]; isLoading?:boolean
  page:number; totalPages:number; onPageChange:(p:number)=>void
  emptyMessage?:string; emptyIcon?:LucideIcon
}
export function DataTable<T extends { id:string }>({ columns, data, isLoading, page, totalPages, onPageChange, emptyMessage='لا توجد بيانات' }: DataTableProps<T>) {
  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor:'rgba(108,92,231,0.3)', borderTopColor:'var(--purple)' }} />
    </div>
  )
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color:'var(--text-3)', background:'rgba(255,255,255,0.02)' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-16 text-center" style={{ color:'var(--text-3)' }}>
                {emptyMessage}
              </td></tr>
            ) : data.map((row, ri) => (
              <tr key={row.id} className="group transition-colors"
                style={{ borderBottom: ri < data.length-1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3" style={{ color:'var(--text-2)' }}>
                    {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop:'1px solid var(--border)' }}>
          <p className="text-xs" style={{ color:'var(--text-3)' }}>صفحة {page} من {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(page-1)} disabled={page===1}
              className="p-1.5 rounded-lg transition disabled:opacity-30 hover:bg-white/5" style={{ color:'var(--text-2)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
            {Array.from({length: Math.min(totalPages,5)}, (_,i)=> i+1).map(n=>(
              <button key={n} onClick={()=>onPageChange(n)}
                className="w-7 h-7 rounded-lg text-xs font-medium transition"
                style={ n===page
                  ? {background:'rgba(108,92,231,0.2)',color:'var(--purple-l)'}
                  : {color:'var(--text-3)'} }>
                {n}
              </button>
            ))}
            <button onClick={() => onPageChange(page+1)} disabled={page===totalPages}
              className="p-1.5 rounded-lg transition disabled:opacity-30 hover:bg-white/5" style={{ color:'var(--text-2)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, title, onClose, children, size='md', subtitle }: {
  open:boolean; title:string; subtitle?:string; onClose:()=>void; children:React.ReactNode; size?:'sm'|'md'|'lg'|'xl'
}) {
  useEffect(()=>{
    if(open) document.body.style.overflow='hidden'
    else document.body.style.overflow=''
    return ()=>{ document.body.style.overflow='' }
  },[open])
  if (!open) return null
  const sizes = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg', xl:'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(6,11,20,0.8)', backdropFilter:'blur(6px)' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div className={`w-full ${sizes[size]} max-h-[90vh] flex flex-col rounded-2xl animate-fade-in`}
        style={{ background:'var(--navy-800)', border:'1px solid var(--border-s)' }}>
        <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom:'1px solid var(--border)' }}>
          <div>
            <h3 className="font-semibold" style={{ color:'var(--text-1)' }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition" style={{ color:'var(--text-3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, confirmLabel='تأكيد', variant='primary', isLoading, onConfirm, onCancel }: {
  open:boolean; title:string; message:string; confirmLabel?:string; variant?:'danger'|'primary'; isLoading?:boolean; onConfirm:()=>void; onCancel:()=>void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(6,11,20,0.8)', backdropFilter:'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-in"
        style={{ background:'var(--navy-800)', border:'1px solid var(--border-s)' }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: variant==='danger' ? 'rgba(255,107,107,0.12)' : 'rgba(108,92,231,0.12)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: variant==='danger' ? 'var(--red)' : 'var(--purple-l)' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color:'var(--text-1)' }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color:'var(--text-3)' }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn btn-outline">إلغاء</button>
          <button onClick={onConfirm} disabled={isLoading}
            className="btn min-w-[80px]"
            style={ variant==='danger'
              ? {background:'var(--red)',color:'#fff'}
              : {background:'var(--purple)',color:'#fff'} }>
            {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── LoadingSpinner ─────────────────────────────────────────────────────────────
export function LoadingSpinner({ fullPage }: { fullPage?:boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullPage ? 'h-screen' : 'h-48'}`}>
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor:'rgba(108,92,231,0.3)', borderTopColor:'var(--purple)' }} />
    </div>
  )
}

// ── Toaster ───────────────────────────────────────────────────────────────────
let _setToasts: ((fn:(prev:any[])=>any[])=>void)|null = null
export const toast = {
  success: (msg:string) => _setToasts?.(p=>[...p,{id:Date.now(),msg,type:'success'}]),
  error:   (msg:string) => _setToasts?.(p=>[...p,{id:Date.now(),msg,type:'error'}]),
  info:    (msg:string) => _setToasts?.(p=>[...p,{id:Date.now(),msg,type:'info'}]),
}
export function Toaster() {
  const [toasts, setToasts] = useState<any[]>([])
  useEffect(()=>{ _setToasts = setToasts },[])
  useEffect(()=>{
    if (!toasts.length) return
    const t = setTimeout(()=>setToasts(p=>p.slice(1)), 3500)
    return ()=>clearTimeout(t)
  },[toasts])
  const icons:any = { success: CheckCircle, error: XCircle, info: Info }
  const styles:any = {
    success: { background:'rgba(0,184,148,0.15)', border:'1px solid rgba(0,184,148,0.3)', color:'var(--green)' },
    error:   { background:'rgba(255,107,107,0.15)', border:'1px solid rgba(255,107,107,0.3)', color:'var(--red)' },
    info:    { background:'rgba(108,92,231,0.15)', border:'1px solid rgba(108,92,231,0.3)', color:'var(--purple-l)' },
  }
  return (
    <div className="fixed bottom-5 left-5 z-[100] flex flex-col gap-2">
      {toasts.map(t=>{
        const Icon = icons[t.type]
        return (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in"
            style={{ ...styles[t.type], backdropFilter:'blur(12px)' }}>
            <Icon className="w-4 h-4 shrink-0" />
            {t.msg}
          </div>
        )
      })}
    </div>
  )
}
