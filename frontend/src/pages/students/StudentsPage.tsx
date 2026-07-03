import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download, QrCode, Trash2, Eye } from 'lucide-react'
import { studentsService } from '../../services/studentsService'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StudentFormModal } from './StudentFormModal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../components/ui/Toaster'
import type { Student } from '../../types'

export function StudentsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () => studentsService.getAll({ page, search, pageSize: 20 }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: studentsService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('تم حذف الطالب بنجاح')
      setDeleteId(null)
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => studentsService.exportExcel({ search }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    },
  })

  const columns = [
    {
      key: 'studentCode',
      header: 'الكود',
      render: (v: string) => <span className="font-mono text-xs text-gray-500">{v}</span>
    },
    {
      key: 'fullName',
      header: 'اسم الطالب',
      render: (v: string, row: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">
            {v.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{v}</p>
            <p className="text-xs text-gray-500">{row.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'البريد الإلكتروني' },
    {
      key: 'enrollDate',
      header: 'تاريخ الالتحاق',
      render: (v: string) => new Date(v).toLocaleDateString('ar-EG'),
    },
    {
      key: 'isActive',
      header: 'الحالة',
      render: (v: boolean) => (
        <Badge variant={v ? 'success' : 'danger'}>
          {v ? 'نشط' : 'غير نشط'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: Student) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => navigate(`/students/${row.id}`)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditStudent(row); setShowForm(true) }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="الطلاب"
        subtitle={`${data?.total ?? 0} طالب مسجل`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportMutation.mutate()}
              className="btn btn-outline flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
            <button
              onClick={() => { setEditStudent(null); setShowForm(true) }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة طالب
            </button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن طالب..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input pr-10 w-full"
            />
          </div>
          <button className="btn btn-outline flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلتر
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          totalPages={Math.ceil((data?.total ?? 0) / 20)}
          onPageChange={setPage}
          emptyMessage="لا يوجد طلاب مسجلون"
        />
      </div>

      {/* Modals */}
      {showForm && (
        <StudentFormModal
          student={editStudent}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['students'] })
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف الطالب"
        message="هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
