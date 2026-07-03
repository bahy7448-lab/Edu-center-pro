import { NavLink } from 'react-router-dom'
import { useAppSelector } from '../../store'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  Wallet, ClipboardList, BarChart3, Settings, Building2,
  CreditCard, ScrollText, Bell, X, Shield, QrCode, LogOut, Award, Users2, Receipt
} from 'lucide-react'

interface NavItem { label: string; labelAr: string; icon: React.ElementType; to: string; section?: string; badge?: string }

const centerNavItems: NavItem[] = [
  { label:'Dashboard',    labelAr:'لوحة التحكم',   icon:LayoutDashboard, to:'/dashboard',    section:'الرئيسية' },
  { label:'Students',     labelAr:'الطلاب',         icon:Users,            to:'/students',     section:'الإدارة' },
  { label:'Teachers',     labelAr:'المدرسون',       icon:GraduationCap,    to:'/teachers' },
  { label:'Parents',      labelAr:'أولياء الأمور',  icon:Users2,           to:'/parents' },
  { label:'Groups',       labelAr:'المجموعات',      icon:BookOpen,         to:'/groups' },
  { label:'Attendance',   labelAr:'الحضور',         icon:CalendarCheck,    to:'/attendance',   section:'الحضور' },
  { label:'QR Codes',     labelAr:'حضور QR مسح',    icon:QrCode,           to:'/qr-codes',     badge:'مسح' },
  { label:'Payments',     labelAr:'المدفوعات',      icon:Wallet,           to:'/payments',     section:'المالية' },
  { label:'Expenses',     labelAr:'المصروفات',      icon:Receipt,          to:'/expenses' },
  { label:'Exams',        labelAr:'الامتحانات',     icon:ClipboardList,    to:'/exams',        section:'أكاديمي' },
  { label:'Grades',       labelAr:'الدرجات',        icon:Award,            to:'/grades' },
  { label:'Reports',      labelAr:'التقارير',       icon:BarChart3,        to:'/reports' },
  { label:'Notifications',labelAr:'الإشعارات',     icon:Bell,             to:'/notifications',section:'النظام' },
  { label:'Settings',     labelAr:'الإعدادات',      icon:Settings,         to:'/settings' },
]

const superAdminNavItems: NavItem[] = [
  { label:'Dashboard',    labelAr:'لوحة التحكم',    icon:LayoutDashboard, to:'/super-admin/dashboard',     section:'الرئيسية' },
  { label:'Centers',      labelAr:'المراكز',         icon:Building2,        to:'/super-admin/centers',       section:'الإدارة' },
  { label:'Subscriptions',labelAr:'الاشتراكات',     icon:CreditCard,       to:'/super-admin/subscriptions' },
  { label:'Audit Logs',   labelAr:'سجلات المراجعة', icon:ScrollText,       to:'/super-admin/audit-logs',    section:'النظام' },
  { label:'Settings',     labelAr:'الإعدادات',       icon:Settings,         to:'/super-admin/settings' },
]

interface Props { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: Props) {
  const { user } = useAppSelector(s => s.auth)
  const { language } = useAppSelector(s => s.ui)
  const isSuperAdmin = user?.role === 'SuperAdmin'
  const navItems = isSuperAdmin ? superAdminNavItems : centerNavItems
  let lastSection = ''

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 right-0 z-30 flex w-60 flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        style={{ background:'var(--navy-900)', borderLeft:'1px solid var(--border)' }}>

        <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background:'linear-gradient(135deg, var(--purple), #9B59B6)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold" style={{ color:'var(--text-1)' }}>EduCenter</span>
              <span className="text-xs ml-0.5" style={{ color:'var(--purple-l)' }}>Pro</span>
              {!isSuperAdmin && <p className="text-[10px] leading-none mt-0.5" style={{ color:'var(--text-3)' }}>نظام إدارة المركز</p>}
              {isSuperAdmin && <p className="text-[10px] leading-none mt-0.5" style={{ color:'var(--purple-l)' }}>Super Admin</p>}
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/5" style={{ color:'var(--text-3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {navItems.map(item => {
            const showSection = item.section && item.section !== lastSection
            if (item.section) lastSection = item.section
            return (
              <div key={item.to}>
                {showSection && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest px-2.5 pt-4 pb-1"
                    style={{ color:'var(--text-3)' }}>{item.section}</p>
                )}
                <NavLink to={item.to}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150"
                  style={({ isActive }) => isActive
                    ? { background:'rgba(108,92,231,0.15)', color:'#A89BFF', borderRight:'2px solid var(--purple)' }
                    : { color:'var(--text-3)' }}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{language === 'ar' ? item.labelAr : item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background:'rgba(0,184,148,0.15)', color:'var(--green)' }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>

        <div className="p-2.5" style={{ borderTop:'1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background:'rgba(108,92,231,0.2)', color:'var(--purple-l)' }}>
              {user?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color:'var(--text-1)' }}>{user?.fullName}</p>
              <p className="text-[10px] truncate" style={{ color:'var(--text-3)' }}>{user?.role}</p>
            </div>
            <LogOut className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:'var(--text-3)' }} />
          </div>
        </div>
      </aside>
    </>
  )
}
