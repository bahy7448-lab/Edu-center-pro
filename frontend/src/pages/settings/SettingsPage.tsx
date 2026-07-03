import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { User, Bell, Palette, Lock, Building2 } from 'lucide-react'
import { PageHeader, toast, LoadingSpinner } from '../../components/ui'
import { useAppDispatch, useAppSelector } from '../../store'
import { toggleDarkMode, setLanguage } from '../../store/slices/uiSlice'
import { setUser } from '../../store/slices/authSlice'
import { settingsService } from '../../services'

export function SettingsPage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(s => s.auth)
  const { darkMode, language } = useAppSelector(s => s.ui)
  const isSuperAdmin = user?.role === 'SuperAdmin'

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'security', label: 'الأمان', icon: Lock },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    ...(!isSuperAdmin ? [{ id: 'center', label: 'إعدادات المركز', icon: Building2 }] : []),
  ]

  const [activeTab, setActiveTab] = useState('profile')
  const qc = useQueryClient()

  // ── Profile ─────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName ?? '', email: user?.email ?? '', phone: '' })

  useEffect(() => {
    if (user) setProfileForm(p => ({ ...p, fullName: user.fullName ?? '', email: user.email ?? '' }))
  }, [user?.fullName, user?.email])

  const profileMutation = useMutation({
    mutationFn: (d: object) => settingsService.updateProfile(d),
    onSuccess: (res) => {
      dispatch(setUser(res.user))
      if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)
      toast.success('تم تحديث الملف الشخصي')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'فشل تحديث الملف الشخصي'),
  })

  // ── Password ────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })

  const pwMutation = useMutation({
    mutationFn: (d: object) => settingsService.changePassword(d),
    onSuccess: () => { setPwForm({ current: '', newPw: '', confirm: '' }); toast.success('تم تغيير كلمة المرور') },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'فشل تغيير كلمة المرور'),
  })

  // ── Notifications ───────────────────────────────────────────────────────
  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notificationPrefs'],
    queryFn: settingsService.getNotificationPrefs,
    enabled: activeTab === 'notifications',
  })
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: true, whatsapp: true, inApp: true })

  useEffect(() => { if (notifData) setNotifPrefs(notifData) }, [notifData])

  const notifMutation = useMutation({
    mutationFn: (d: object) => settingsService.updateNotificationPrefs(d),
    onSuccess: () => { toast.success('تم حفظ تفضيلات الإشعارات'); qc.invalidateQueries({ queryKey: ['notificationPrefs'] }) },
    onError: () => toast.error('فشل حفظ تفضيلات الإشعارات'),
  })

  // ── Center settings ─────────────────────────────────────────────────────
  const { data: centerData, isLoading: centerLoading } = useQuery({
    queryKey: ['centerSettings'],
    queryFn: settingsService.getCenterSettings,
    enabled: activeTab === 'center' && !isSuperAdmin,
  })
  const [centerForm, setCenterForm] = useState({ centerName: '', phone: '', email: '', address: '', currency: 'EGP', timezone: 'Africa/Cairo' })

  useEffect(() => { if (centerData) setCenterForm(centerData) }, [centerData])

  const centerMutation = useMutation({
    mutationFn: (d: object) => settingsService.updateCenterSettings(d),
    onSuccess: (res) => { setCenterForm(res); toast.success('تم حفظ إعدادات المركز'); qc.invalidateQueries({ queryKey: ['centerSettings'] }) },
    onError: () => toast.error('فشل حفظ إعدادات المركز'),
  })

  return (
    <div className="space-y-5">
      <PageHeader title="الإعدادات" subtitle="تخصيص حسابك وإعدادات المركز" />

      <div className="flex gap-6">
        {/* Tabs Sidebar */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-right
                  ${activeTab === t.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-5 max-w-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">الملف الشخصي</h3>
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {user?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
                  <p className="text-sm text-gray-500">{user?.role}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">الاسم الكامل</label>
                  <input value={profileForm.fullName} onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className="input w-full" dir="ltr" />
                </div>
                <div>
                  <label className="label">رقم الهاتف</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input w-full" placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <button onClick={() => profileMutation.mutate(profileForm)} disabled={profileMutation.isPending} className="btn btn-primary">
                {profileMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-5 max-w-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">تغيير كلمة المرور</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">كلمة المرور الحالية</label>
                  <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="label">كلمة المرور الجديدة</label>
                  <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} className="input w-full" />
                  <p className="text-xs text-gray-400 mt-1">6 أحرف على الأقل</p>
                </div>
                <div>
                  <label className="label">تأكيد كلمة المرور</label>
                  <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} className="input w-full" />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!pwForm.current || !pwForm.newPw) { toast.error('من فضلك املأ كل الحقول'); return }
                  if (pwForm.newPw.length < 6) { toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'); return }
                  if (pwForm.newPw !== pwForm.confirm) { toast.error('كلمتا المرور غير متطابقتين'); return }
                  pwMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.newPw })
                }}
                disabled={pwMutation.isPending}
                className="btn btn-primary"
              >
                {pwMutation.isPending ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            notifLoading ? <LoadingSpinner /> : (
              <div className="space-y-5 max-w-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white">تفضيلات الإشعارات</h3>

                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'إشعارات البريد الإلكتروني', desc: 'استقبال الإشعارات عبر البريد' },
                    { key: 'sms', label: 'إشعارات SMS', desc: 'استقبال الإشعارات عبر الرسائل القصيرة' },
                    { key: 'whatsapp', label: 'إشعارات WhatsApp', desc: 'استقبال الإشعارات عبر واتساب' },
                    { key: 'inApp', label: 'إشعارات داخل التطبيق', desc: 'الإشعارات في لوحة التحكم' },
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{n.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${notifPrefs[n.key as keyof typeof notifPrefs] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs[n.key as keyof typeof notifPrefs] ? 'translate-x-0.5' : '-translate-x-5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => notifMutation.mutate(notifPrefs)} disabled={notifMutation.isPending} className="btn btn-primary">
                  {notifMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            )
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 max-w-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white">المظهر واللغة</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">الوضع</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'فاتح', icon: '☀️', value: false },
                      { label: 'داكن', icon: '🌙', value: true },
                    ].map(m => (
                      <button
                        key={m.label}
                        onClick={() => { if (darkMode !== m.value) dispatch(toggleDarkMode()) }}
                        className={`p-4 rounded-xl border-2 text-center transition ${darkMode === m.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <p className="text-sm font-medium mt-2 text-gray-900 dark:text-white">{m.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">اللغة</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'العربية', value: 'ar' as const }, { label: 'English', value: 'en' as const }].map(l => (
                      <button
                        key={l.value}
                        onClick={() => dispatch(setLanguage(l.value))}
                        className={`p-4 rounded-xl border-2 text-center transition ${language === l.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{l.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center Settings Tab */}
          {activeTab === 'center' && !isSuperAdmin && (
            centerLoading ? <LoadingSpinner /> : (
              <div className="space-y-5 max-w-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white">إعدادات المركز</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">اسم المركز</label>
                    <input value={centerForm.centerName} onChange={e => setCenterForm(p => ({ ...p, centerName: e.target.value }))} className="input w-full" placeholder="اسم المركز" />
                  </div>
                  <div>
                    <label className="label">رقم الهاتف</label>
                    <input value={centerForm.phone} onChange={e => setCenterForm(p => ({ ...p, phone: e.target.value }))} className="input w-full" placeholder="01xxxxxxxxx" />
                  </div>
                  <div>
                    <label className="label">البريد الإلكتروني</label>
                    <input type="email" value={centerForm.email} onChange={e => setCenterForm(p => ({ ...p, email: e.target.value }))} className="input w-full" dir="ltr" />
                  </div>
                  <div>
                    <label className="label">العنوان</label>
                    <textarea value={centerForm.address} onChange={e => setCenterForm(p => ({ ...p, address: e.target.value }))} className="input w-full" rows={2} />
                  </div>
                  <div>
                    <label className="label">العملة</label>
                    <select value={centerForm.currency} onChange={e => setCenterForm(p => ({ ...p, currency: e.target.value }))} className="input w-full">
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="AED">درهم إماراتي (AED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">المنطقة الزمنية</label>
                    <select value={centerForm.timezone} onChange={e => setCenterForm(p => ({ ...p, timezone: e.target.value }))} className="input w-full">
                      <option value="Africa/Cairo">القاهرة (UTC+2)</option>
                      <option value="Asia/Riyadh">الرياض (UTC+3)</option>
                      <option value="Asia/Dubai">دبي (UTC+4)</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => centerMutation.mutate(centerForm)} disabled={centerMutation.isPending} className="btn btn-primary">
                  {centerMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
