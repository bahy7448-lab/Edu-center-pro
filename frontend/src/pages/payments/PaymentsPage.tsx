import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, CheckCircle, FileText } from 'lucide-react'
import { paymentsService } from '../../services'
import { PageHeader, Badge, DataTable, Modal, toast } from '../../components/ui'
import { useForm } from 'react-hook-form'
import type { Payment } from '../../types'

export function PaymentsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: () => paymentsService.getAll({ page, status: statusFilter || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: (d: object) => paymentsService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setShowCreate(false); reset(); toast.success('تمت إضافة الفاتورة') },
    onError: () => toast.error('فشل إضافة الفاتورة'),
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) => paymentsService.markPaid(id, method),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); toast.success('تم تسجيل الدفع') },
  })

  const getReceipt = async (id: string) => {
    const blob = await paymentsService.getReceipt(id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const statusVariant = (s: string) =>
    s === 'Paid' ? 'success' : s === 'Overdue' ? 'danger' : s === 'Pending' ? 'warning' : 'default'
  const statusLabel = (s: string) =>
    s === 'Paid' ? 'مدفوع' : s === 'Overdue' ? 'متأخر' : s === 'Pending' ? 'معلق' : s

  const columns = [
    { key: 'receiptNumber', header: 'رقم الإيصال', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { key: 'studentName', header: 'الطالب' },
    { key: 'groupName', header: 'المجموعة', render: (v: string) => v ?? '—' },
    { key: 'netAmount', header: 'المبلغ', render: (v: number) => <span className="font-semibold">{v.toLocaleString()} ج.م</span> },
    { key: 'dueDate', header: 'تاريخ الاستحقاق', render: (v: string) => new Date(v).toLocaleDateString('ar-EG') },
    { key: 'status', header: 'الحالة', render: (v: string) => <Badge variant={statusVariant(v)}>{statusLabel(v)}</Badge> },
    {
      key: 'actions', header: '',
      render: (_: any, row: Payment) => (
        <div className="flex items-center gap-1 justify-end">
          {row.status !== 'Paid' && (
            <button onClick={() => markPaidMutation.mutate({ id: row.id, method: 'Cash' })}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="تسجيل دفع">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.status === 'Paid' && (
            <button onClick={() => getReceipt(row.id)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="إيصال">
              <FileText className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="المدفوعات" subtitle={`${data?.total ?? 0} فاتورة`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />إضافة فاتورة
          </button>
        }
      />

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الفواتير', value: data.total, color: 'bg-indigo-50 text-indigo-700' },
            { label: 'مدفوع', value: data.items.filter((p: Payment) => p.status === 'Paid').length, color: 'bg-emerald-50 text-emerald-700' },
            { label: 'معلق', value: data.items.filter((p: Payment) => p.status === 'Pending').length, color: 'bg-amber-50 text-amber-700' },
            { label: 'متأخر', value: data.items.filter((p: Payment) => p.status === 'Overdue').length, color: 'bg-red-50 text-red-700' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
              <p className="text-xs font-medium opacity-75">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
          <option value="">كل الحالات</option>
          <option value="Pending">معلق</option>
          <option value="Paid">مدفوع</option>
          <option value="Overdue">متأخر</option>
        </select>
        <button className="btn btn-outline flex items-center gap-2 mr-auto"><Download className="w-4 h-4" />تصدير</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading}
          page={page} totalPages={Math.ceil((data?.total ?? 0) / 20)} onPageChange={setPage}
          emptyMessage="لا توجد فواتير" />
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} title="إضافة فاتورة جديدة" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">معرف الطالب</label>
            <input {...register('studentId', { required: true })} className="input w-full" placeholder="Student ID" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">المبلغ</label>
              <input type="number" {...register('amount', { required: true, min: 1 })} className="input w-full" placeholder="0.00" />
            </div>
            <div>
              <label className="label">الخصم</label>
              <input type="number" {...register('discount')} className="input w-full" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">طريقة الدفع</label>
              <select {...register('method')} className="input w-full">
                <option value="Cash">نقدي</option>
                <option value="BankTransfer">تحويل بنكي</option>
                <option value="Card">بطاقة</option>
              </select>
            </div>
            <div>
              <label className="label">تاريخ الاستحقاق</label>
              <input type="date" {...register('dueDate', { required: true })} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea {...register('description')} className="input w-full" rows={2} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline">إلغاء</button>
            <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
