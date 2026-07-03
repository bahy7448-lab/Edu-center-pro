import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Users, GraduationCap, Wallet, Power, Eye, X } from 'lucide-react'
import { PageHeader, Badge, Modal, toast } from '../../components/ui'
import api from '../../services/api'

const centersService = {
  getAll: async () => (await api.get('/super-admin/centers')).data,
  create: async (data: any) => (await api.post('/super-admin/centers', data)).data,
  toggle: async (id: string, isActive: boolean) => (await api.patch(`/super-admin/centers/${id}/toggle`, { isActive })).data,
  getStats: async (id: string) => (await api.get(`/super-admin/centers/${id}/stats`)).data,
}

function CenterCard({ center, onView, onToggle }: { center: any; onView: () => void; onToggle: () => void }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5 duration-200"
      style={{ background:'var(--navy-800)', border:'1px solid var(--border)' }}>
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ background:'linear-gradient(135deg,var(--purple),#9B59B6)', color:'#fff' }}>
            {center.name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color:'var(--text-1)' }}>{center.name}</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-3)' }}>{center.slug}</p>
          </div>
        </div>
        <Badge variant={center.isActive?'success':'danger'}>{center.isActive?'نشط':'معطل'}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Users, label: 'طلاب', value: center.studentsCount||0, color:'var(--purple-l)' },
          { icon: GraduationCap, label: 'مدرسون', value: center.teachersCount||0, color:'var(--green)' },
          { icon: Wallet, label: 'إيراد', value: `${(center.monthlyRevenue||0).toLocaleString()}`, color:'var(--amber)' },
        ].map(s=>(
          <div key={s.label} className="rounded-xl p-2.5 text-center"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
            <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color:s.color }} />
            <p className="text-sm font-bold" style={{ color:'var(--text-1)' }}>{s.value}</p>
            <p className="text-[10px]" style={{ color:'var(--text-3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plan badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 rounded-lg"
          style={{ background:'rgba(108,92,231,0.1)', color:'var(--purple-l)', border:'1px solid rgba(108,92,231,0.2)' }}>
          {center.activePlan==='premium'?'⭐ بريميوم':center.activePlan==='basic'?'✓ أساسي':'◎ مجاني'}
        </span>
        <p className="text-[11px]" style={{ color:'var(--text-3)' }}>
          {new Date(center.createdAt).toLocaleDateString('ar-EG')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1" style={{ borderTop:'1px solid var(--border)' }}>
        <button onClick={onView}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition"
          style={{ background:'rgba(108,92,231,0.1)', color:'var(--purple-l)' }}>
          <Eye className="w-3.5 h-3.5"/>تفاصيل
        </button>
        <button onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition"
          style={center.isActive
            ?{background:'rgba(255,107,107,0.1)',color:'var(--red)'}
            :{background:'rgba(0,184,148,0.1)',color:'var(--green)'}}>
          <Power className="w-3.5 h-3.5"/>
          {center.isActive?'تعطيل':'تفعيل'}
        </button>
      </div>
    </div>
  )
}

export function CentersPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [viewCenter, setViewCenter] = useState<any>(null)
  const [form, setForm] = useState({ name:'', slug:'', ownerName:'', ownerEmail:'', ownerPassword:'', plan:'basic', phone:'' })

  const { data, isLoading } = useQuery({ queryKey:['centers'], queryFn:centersService.getAll })
  const { data: centerStats } = useQuery({
    queryKey:['center-stats', viewCenter?.id],
    queryFn:()=>centersService.getStats(viewCenter.id),
    enabled:!!viewCenter,
  })

  const createMut = useMutation({
    mutationFn: centersService.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['centers']}); toast.success('تم إنشاء السنتر بنجاح'); setModalOpen(false); setForm({name:'',slug:'',ownerName:'',ownerEmail:'',ownerPassword:'',plan:'basic',phone:''}) },
    onError: () => toast.error('حدث خطأ أثناء الإنشاء'),
  })

  const toggleMut = useMutation({
    mutationFn: ({id,isActive}:{id:string,isActive:boolean}) => centersService.toggle(id,isActive),
    onSuccess: () => { qc.invalidateQueries({queryKey:['centers']}); toast.success('تم تحديث الحالة') },
  })

  const centers = data?.items || data || []
  const activeCount = centers.filter((c:any)=>c.isActive).length
  const totalStudents = centers.reduce((s:number,c:any)=>s+(c.studentsCount||0),0)
  const totalRevenue = centers.reduce((s:number,c:any)=>s+(c.monthlyRevenue||0),0)

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="إدارة السنترات" subtitle="تحكم في جميع المراكز التعليمية المسجلة" icon={Building2}
        actions={
          <button onClick={()=>setModalOpen(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4"/>إضافة سنتر جديد
          </button>
        }/>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:'إجمالي السنترات', value:centers.length, color:'var(--purple-l)', bg:'rgba(108,92,231,0.1)'},
          {label:'النشطة', value:activeCount, color:'var(--green)', bg:'rgba(0,184,148,0.1)'},
          {label:'إجمالي الطلاب', value:totalStudents.toLocaleString(), color:'var(--amber)', bg:'rgba(253,203,110,0.1)'},
          {label:'الإيراد الكلي', value:`${totalRevenue.toLocaleString()} ج`, color:'var(--text-1)', bg:'rgba(255,255,255,0.05)'},
        ].map(s=>(
          <div key={s.label} className="rounded-2xl p-4" style={{ background:'var(--navy-800)', border:'1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color:'var(--text-3)' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Centers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="rounded-2xl h-64 animate-pulse" style={{background:'var(--navy-800)',border:'1px solid var(--border)'}}/>)}
        </div>
      ) : centers.length===0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Building2 className="w-14 h-14 opacity-10" style={{ color:'var(--text-1)' }}/>
          <p style={{ color:'var(--text-3)' }}>لا توجد سنترات مسجلة</p>
          <button onClick={()=>setModalOpen(true)} className="btn btn-primary">إضافة أول سنتر</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {centers.map((c:any)=>(
            <CenterCard key={c.id} center={c}
              onView={()=>setViewCenter(c)}
              onToggle={()=>toggleMut.mutate({id:c.id, isActive:!c.isActive})} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} title="إضافة سنتر جديد" subtitle="سيتم إنشاء حساب المدير تلقائياً" onClose={()=>setModalOpen(false)} size="lg">
        <form onSubmit={e=>{e.preventDefault();createMut.mutate(form)}} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">اسم السنتر</label>
              <input className="input w-full" required placeholder="مثال: مركز النجوم التعليمي"
                value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div>
              <label className="label">الرابط (slug)</label>
              <input className="input w-full" required placeholder="stars-center"
                value={form.slug} onChange={e=>setForm(p=>({...p,slug:e.target.value.toLowerCase().replace(/\s/g,'-')}))} />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input className="input w-full" placeholder="01xxxxxxxxx"
                value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
            </div>
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{background:'rgba(108,92,231,0.05)',border:'1px solid rgba(108,92,231,0.15)'}}>
            <p className="text-xs font-semibold" style={{color:'var(--purple-l)'}}>بيانات المدير</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">الاسم الكامل</label>
                <input className="input w-full" required placeholder="اسم مدير السنتر"
                  value={form.ownerName} onChange={e=>setForm(p=>({...p,ownerName:e.target.value}))} />
              </div>
              <div>
                <label className="label">البريد الإلكتروني</label>
                <input type="email" className="input w-full" required placeholder="admin@center.com"
                  value={form.ownerEmail} onChange={e=>setForm(p=>({...p,ownerEmail:e.target.value}))} />
              </div>
              <div className="col-span-2">
                <label className="label">كلمة المرور</label>
                <input type="password" className="input w-full" required placeholder="كلمة مرور قوية"
                  value={form.ownerPassword} onChange={e=>setForm(p=>({...p,ownerPassword:e.target.value}))} />
              </div>
            </div>
          </div>

          <div>
            <label className="label">الباقة</label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'free',l:'مجانية',desc:'حتى 50 طالب'},{v:'basic',l:'أساسية',desc:'حتى 200 طالب'},{v:'premium',l:'بريميوم',desc:'غير محدود'}].map(p=>(
                <button type="button" key={p.v} onClick={()=>setForm(prev=>({...prev,plan:p.v}))}
                  className="p-3 rounded-xl text-right transition"
                  style={form.plan===p.v
                    ?{background:'rgba(108,92,231,0.2)',border:'1px solid var(--purple)',color:'var(--text-1)'}
                    :{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',color:'var(--text-3)'}}>
                  <p className="text-xs font-bold">{p.l}</p>
                  <p className="text-[10px] mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>setModalOpen(false)} className="btn btn-outline">إلغاء</button>
            <button type="submit" disabled={createMut.isPending} className="btn btn-primary min-w-[120px]">
              {createMut.isPending
                ?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"/>
                :'إنشاء السنتر'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Center Modal */}
      {viewCenter && (
        <Modal open={!!viewCenter} title={viewCenter.name} subtitle="تفاصيل السنتر وإحصائياته" onClose={()=>setViewCenter(null)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'الطلاب',value:centerStats?.studentsCount||viewCenter.studentsCount||0,color:'var(--purple-l)'},
                {label:'المدرسون',value:centerStats?.teachersCount||viewCenter.teachersCount||0,color:'var(--green)'},
                {label:'المجموعات',value:centerStats?.groupsCount||viewCenter.groupsCount||0,color:'var(--amber)'},
                {label:'الإيراد الشهري',value:`${(centerStats?.monthlyRevenue||viewCenter.monthlyRevenue||0).toLocaleString()} ج.م`,color:'var(--text-1)'},
              ].map(s=>(
                <div key={s.label} className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)'}}>
                  <p className="text-xs" style={{color:'var(--text-3)'}}>{s.label}</p>
                  <p className="text-xl font-bold mt-1" style={{color:s.color}}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 space-y-2" style={{background:'rgba(255,255,255,0.02)',border:'1px solid var(--border)'}}>
              {[
                {k:'الرابط',v:viewCenter.slug},
                {k:'الباقة',v:viewCenter.activePlan},
                {k:'تاريخ الإنشاء',v:new Date(viewCenter.createdAt).toLocaleDateString('ar-EG')},
                {k:'الحالة',v:viewCenter.isActive?'نشط':'معطل'},
              ].map(r=>(
                <div key={r.k} className="flex justify-between text-sm">
                  <span style={{color:'var(--text-3)'}}>{r.k}</span>
                  <span style={{color:'var(--text-2)'}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
