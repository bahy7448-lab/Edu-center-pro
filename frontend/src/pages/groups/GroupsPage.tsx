import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, Trash2, Edit } from 'lucide-react'
import { groupsService } from '../../services'
import { PageHeader, Badge, DataTable, Modal, ConfirmDialog, toast } from '../../components/ui'
import { useForm } from 'react-hook-form'
import type { Group } from '../../types'

export function GroupsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [studentsGroupId, setStudentsGroupId] = useState<string | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['groups', page, search],
    queryFn: () => groupsService.getAll({ page, search: search || undefined }),
    placeholderData: (p: any) => p,
  })

  const { data: groupStudents } = useQuery({
    queryKey: ['group-students', studentsGroupId],
    queryFn: () => groupsService.getStudents(studentsGroupId!),
    enabled: !!studentsGroupId,
  })

  const saveMutation = useMutation({
    mutationFn: (d: any) => editGroup ? groupsService.update(editGroup.id, d) : groupsService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); setShowForm(false); reset(); toast.success(editGroup ? 'تم التحديث' : 'تم الإضافة') },
    onError: () => toast.error('فشل الحفظ'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['groups'] }); setDeleteId(null); toast.success('تم الحذف') },
  })

  const openEdit = (g: Group) => {
    setEditGroup(g)
    setValue('name', g.name)
    setValue('subjectId', g.subjectId)
    setValue('teacherId', g.teacherId)
    setValue('schedule', g.schedule)
    setValue('maxCapacity', g.maxCapacity)
    setValue('monthlyFee', g.monthlyFee)
    setShowForm(true)
  }

  const columns = [
    {
      key: 'name', header: 'المجموعة',
      render: (v: string, row: Group) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{v}</p>
          <p className="text-xs text-gray-500">{row.subjectName}</p>
        </div>
      ),
    },
    { key: 'teacherName', header: 'المدرس' },
    { key: 'schedule', header: 'الجدول', render: (v: string) => v ?? '—' },
    {
      key: 'enrolledCount', header: 'الطلاب',
      render: (v: number, row: Group) => (
        <span className={`font-semibold ${v >= row.maxCapacity ? 'text-red-500' : 'text-emerald-600'}`}>
          {v} / {row.maxCapacity}
        </span>
      ),
    },
    { key: 'monthlyFee', header: 'الرسوم الشهرية', render: (v: number) => v ? `${v.toLocaleString()} ج.م` : '—' },
    { key: 'isActive', header: 'الحالة', render: (v: boolean) => <Badge variant={v ? 'success' : 'danger'}>{v ? 'نشطة' : 'موقوفة'}</Badge> },
    {
      key: 'actions', header: '',
      render: (_: any, row: Group) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setStudentsGroupId(row.id)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="الطلاب"><Users className="w-4 h-4" /></button>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="المجموعات" subtitle={`${data?.total ?? 0} مجموعة`}
        actions={
          <button onClick={() => { setEditGroup(null); reset(); setShowForm(true) }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />إضافة مجموعة
          </button>
        }
      />
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="ابحث عن مجموعة..." className="input pr-10 w-full" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading}
          page={page} totalPages={Math.ceil((data?.total ?? 0) / 20)} onPageChange={setPage}
          emptyMessage="لا توجد مجموعات" />
      </div>

      {/* Form Modal */}
      <Modal open={showForm} title={editGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'} onClose={() => setShowForm(false)}>
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">اسم المجموعة</label>
            <input {...register('name', { required: true })} className="input w-full" placeholder="مثال: مجموعة الرياضيات أ" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">المادة (ID)</label>
              <input {...register('subjectId', { required: true })} className="input w-full" />
            </div>
            <div>
              <label className="label">المدرس (ID)</label>
              <input {...register('teacherId', { required: true })} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="label">الجدول</label>
            <input {...register('schedule')} className="input w-full" placeholder="السبت والاثنين 4-6 م" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">أقصى عدد</label>
              <input type="number" {...register('maxCapacity')} defaultValue={30} className="input w-full" />
            </div>
            <div>
              <label className="label">الرسوم الشهرية</label>
              <input type="number" {...register('monthlyFee')} className="input w-full" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">إلغاء</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
              {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Students List Modal */}
      <Modal open={!!studentsGroupId} title="طلاب المجموعة" onClose={() => setStudentsGroupId(null)} size="lg">
        <div className="space-y-2">
          {groupStudents?.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">
                  {s.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.fullName}</p>
                  <p className="text-xs text-gray-500">{s.phone}</p>
                </div>
              </div>
              <Badge variant={s.isActive ? 'success' : 'danger'}>{s.isActive ? 'نشط' : 'غير نشط'}</Badge>
            </div>
          )) ?? <p className="text-center text-gray-400 py-8">لا يوجد طلاب في هذه المجموعة</p>}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف المجموعة" message="هل أنت متأكد من حذف هذه المجموعة؟"
        confirmLabel="حذف" variant="danger" isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
