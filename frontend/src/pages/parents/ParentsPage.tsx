import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users2, Plus, Phone, Mail, Briefcase, Search } from 'lucide-react'
import { PageHeader, DataTable, Badge, Modal, toast } from '../../components/ui'
import api from '../../services/api'

const parentsService = {
  getAll: async (params: any) => (await api.get('/parents', { params })).data,
  create: async (data: any) => (await api.post('/parents', data)).data,
  update: async (id: string, data: any) => (await api.put(`/parents/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/parents/${id}`)).data,
}

export function ParentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', occupation: '', studentName: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['parents', page, search],
    queryFn: () => parentsService.getAll({ page, pageSize: 10, search }),
  })

  const createMut = useMutation({
    mutationFn: parentsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parents'] })
      toast.success('تم إضافة ولي الأمر بنجاح')
      setModalOpen(false)
      setForm({ fullName: '', phone: '', email: '', occupation: '', studentName: '' })
    },
    onError: () => toast.error('حدث خطأ أثناء الإضافة'),
  })

  const parents = data?.items || []
  const columns = [
    { key: 'fullName', header: 'ولي الأمر', render: (v: string) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--purple-l)' }}>
          {v?.charAt(0)}
        </div>
        <span style={{ color: 'var(--text-1)' }}>{v}</span>
      </div>
    )},
    { key: 'studentName', header: 'اسم الطالب', render: (v: string) => <span style={{ color: 'var(--text-2)' }}>{v}</span> },
    { key: 'phone', header: 'الهاتف', render: (v: string) => (
      <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--text-3)' }}>
        <Phone className="w-3 h-3" />{v}
      </span>
    )},
    { key: 'email', header: 'البريد', render: (v: string) => (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
        <Mail className="w-3 h-3" />{v}
      </span>
    )},
    { key: 'occupation', header: 'الوظيفة', render: (v: string) => (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
        <Briefcase className="w-3 h-3" />{v}
      </span>
    )},
    { key: 'isActive', header: 'الحالة', render: (v: boolean) => <Badge variant={v ? 'success' : 'danger'}>{v ? 'نشط' : 'غير نشط'}</Badge> },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="أولياء الأمور" subtitle="إدارة بيانات أولياء أمور الطلاب" icon={Users2}
        actions={
          <button onClick={() => setModalOpen(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة ولي أمر
          </button>
        } />

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-s)', color: 'var(--text-1)' }} />
          </div>
        </div>
        <DataTable columns={columns} data={parents} isLoading={isLoading}
          page={page} totalPages={data?.totalPages || 1} onPageChange={setPage}
          emptyMessage="لا يوجد أولياء أمور" />
      </div>

      <Modal open={modalOpen} title="إضافة ولي أمر جديد" onClose={() => setModalOpen(false)}>
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">الاسم الكامل</label>
            <input className="input w-full" required value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الهاتف</label>
              <input className="input w-full" required value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input type="email" className="input w-full" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الوظيفة</label>
              <input className="input w-full" value={form.occupation}
                onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} />
            </div>
            <div>
              <label className="label">اسم الطالب</label>
              <input className="input w-full" value={form.studentName}
                onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">إلغاء</button>
            <button type="submit" disabled={createMut.isPending} className="btn btn-primary min-w-[100px]">
              {createMut.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
