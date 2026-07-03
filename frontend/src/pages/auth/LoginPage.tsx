import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { login } from '../../store/slices/authSlice'
import { Shield, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading } = useAppSelector(s => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) {
      navigate(result.payload.user.role === 'SuperAdmin' ? '/super-admin/dashboard' : '/dashboard')
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--navy-950)' }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--purple)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, var(--purple), #9B59B6)' }}>
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>EduCenter Pro</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>نظام إدارة المراكز التعليمية</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{ background: 'var(--navy-800)', border: '1px solid var(--border-s)' }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-1)' }}>تسجيل الدخول</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@educenter.com"
                className="input w-full" required />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input w-full pl-10" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: 'var(--text-3)' }}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="btn w-full h-11 text-sm font-semibold mt-2"
              style={{ background: 'var(--purple)', color: '#fff' }}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'دخول'}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>بيانات تجريبية:</p>
            {[
              { label: 'مدير مركز', email: 'admin@educenter.com', pwd: '123456' },
              { label: 'مدير المنصة', email: 'superadmin@educenter.com', pwd: '123456' },
            ].map(d => (
              <button key={d.email} onClick={() => setForm({ email: d.email, password: d.pwd })}
                className="w-full text-right text-xs px-2 py-1 rounded-lg transition hover:bg-white/5 mb-0.5"
                style={{ color: 'var(--text-3)' }}>
                <span style={{ color: 'var(--purple-l)' }}>{d.label}:</span> {d.email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
