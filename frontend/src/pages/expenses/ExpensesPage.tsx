import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, Plus, Trash2, TrendingDown } from 'lucide-react'
import { PageHeader, DataTable, Badge, Modal, ConfirmDialog, toast } from '../../components/ui'
import api from '../../services/api'

const expensesService = {
  getAll: async (params: any) => (await api.get('/expenses', { params })).data,
  create: async (data: any) => (await api.post('/expenses', data)).data,
  remove: async (id: string) => (await api.delete(`/expenses/${id}`)).data,
}

const categoryColors: any = {
  'إيجار': 'info', 'رواتب': 'purple', 'كهرباء': 'warning', 'مستلزمات': 'success', 'صيانة': 'danger',
}

export function ExpensesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', category: 'مستلزمات', amount: '', date: new Date().toISOString().split('T')[0], notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => expensesService.getAll({ page, pageSize: 10 }),
  })

  const createMut = useMutation({
    mutationFn: expensesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('تم إضافة المصروف')
      setModalOpen(false)
      setForm({ title: '', category: 'مستلزمات', amount: '', date: new Date().toISOString().split('T')[0], notes: '' })
    },
  })
  const deleteMut = useMutation({
    mutationFn: expensesService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('تم الحذف'); setDeleteId(null) },
  })

  const expenses = data?.items || []
  const total = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)

  const columns = [
    { key: 'title', header: 'البند', render: (v: string) => <span style={{ color: 'var(--text-1)' }}>{v}</span> },
    { key: 'category', header: 'الفئة', render: (v: string) => <Badge variant={categoryColors[v] || 'default'}>{v}</Badge> },
    { key: 'amount', header: 'المبلغ', render: (v: number) => <span style={{ color: 'var(--red)' }}>-{v?.toLocaleString()} ج.م</span> },
    { key: 'date', header: 'التاريخ', render: (v: string) => <span style={{ color: 'var(--text-3)' }}>{new Date(v).toLocaleDateString('ar-EG')}</span> },
    { key: 'id', header: '', render: (_: any, row: any) => (
      <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition" style={{ color: 'var(--red)' }}>
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="المصروفات" subtitle="تسجيل ومتابعة مصروفات المركز" icon={Receipt}
        actions={
          <button onClick={() => setModalOpen(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة مصروف
          </button>
        } />

      <div className="rounded-2xl p-5 flex items-center gap-3 max-w-xs"
        style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,107,0.12)' }}>
          <TrendingDown className="w-5 h-5" style={{ color: 'var(--red)' }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>إجمالي المصروفات (هذه الصفحة)</p>
          <p className="text-lg font-bold" style={{ color: 'var(--red)' }}>{total.toLocaleString()} ج.م</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--navy-800)', border: '1px solid var(--border)' }}>
        <DataTable columns={columns} data={expenses} isLoading={isLoading}
          page={page} totalPages={data?.totalPages || 1} onPageChange={setPage}
          emptyMessage="لا توجد مصروفات مسجلة" />
      </div>

      <Modal open={modalOpen} title="إضافة مصروف جديد" onClose={() => setModalOpen(false)}>
        <form onSubmit={e => { e.preventDefault(); createMut.mutate({ ...form, amount: parseFloat(form.amount) }) }} className="space-y-4">
          <div>
            <label className="label">البند</label>
            <input className="input w-full" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الفئة</label>
              <select className="input w-full" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {['إيجار', 'رواتب', 'كهرباء', 'مستلزمات', 'صيانة', 'أخرى'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">المبلغ (ج.م)</label>
              <input type="number" className="input w-full" required value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">التاريخ</label>
            <input type="date" className="input w-full" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea className="input w-full" rows={2} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">إلغاء</button>
            <button type="submit" disabled={createMut.isPending} className="btn btn-primary min-w-[100px]">
              {createMut.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف المصروف" message="هل أنت متأكد من حذف هذا المصروف؟"
        variant="danger" isLoading={deleteMut.isPending}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
