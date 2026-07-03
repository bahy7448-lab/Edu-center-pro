import { useState } from 'react'
import { Menu, Bell, LogOut, User, ChevronDown, Search } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store'
import { setLanguage } from '../../store/slices/uiSlice'
import { logout } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '../../services'

interface Props { onMenuClick: () => void }

export function Navbar({ onMenuClick }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const { language } = useAppSelector(s => s.ui)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: notifs } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsService.getAll({ isRead: false, pageSize: 5 }),
    refetchInterval: 30_000,
  })
  const unreadCount = notifs?.total ?? 0

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  return (
    <header className="h-14 flex items-center px-5 gap-3 shrink-0"
      style={{ background: 'var(--navy-900)', borderBottom: '1px solid var(--border)' }}>
      <button onClick={onMenuClick} className="p-2 rounded-lg lg:hidden hover:bg-white/5 transition"
        style={{ color: 'var(--text-3)' }}>
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
          <input type="text" placeholder="بحث سريع..."
            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg outline-none transition"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-s)',
              color: 'var(--text-2)',
            }} />
        </div>
      </div>

      <div className="flex-1" />

      {/* Language */}
      <button onClick={() => dispatch(setLanguage(language === 'ar' ? 'en' : 'ar'))}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
        style={{ border: '1px solid var(--border-s)', color: 'var(--text-3)' }}>
        {language === 'ar' ? 'EN' : 'عر'}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg hover:bg-white/5 transition"
          style={{ color: 'var(--text-3)' }}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              style={{ background: 'var(--red)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute left-0 top-full mt-2 w-72 rounded-xl shadow-2xl z-50"
            style={{ background: 'var(--navy-800)', border: '1px solid var(--border-s)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>الإشعارات</h4>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {!notifs?.items?.length ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--text-3)' }}>لا توجد إشعارات</p>
              ) : notifs?.items?.map((n: any) => (
                <div key={n.id} className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div className="relative">
        <button onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(108,92,231,0.2)', color: 'var(--purple-l)' }}>
            {user?.fullName?.charAt(0)}
          </div>
          <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-2)' }}>
            {user?.fullName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: 'var(--text-3)' }} />
        </button>
        {userMenuOpen && (
          <div className="absolute left-0 top-full mt-2 w-44 rounded-xl shadow-2xl z-50"
            style={{ background: 'var(--navy-800)', border: '1px solid var(--border-s)' }}>
            <button onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition"
              style={{ color: 'var(--text-2)' }}>
              <User className="w-4 h-4" /> الملف الشخصي
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 transition"
              style={{ color: 'var(--red)' }}>
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
