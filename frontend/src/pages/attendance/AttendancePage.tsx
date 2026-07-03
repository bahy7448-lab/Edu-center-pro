import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QrCode, CheckSquare, Download } from 'lucide-react'
import { attendanceService, groupsService } from '../../services'
import { PageHeader, Badge, DataTable, LoadingSpinner } from '../../components/ui'
import { toast } from '../../components/ui'
import type { Attendance } from '../../types'

export function AttendancePage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'list' | 'manual' | 'qr'>('list')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [page, setPage] = useState(1)
  const [qrInput, setQrInput] = useState('')
  const [manualEntries, setManualEntries] = useState<Record<string, string>>({})

  const { data: groups } = useQuery({ queryKey: ['groups-list'], queryFn: () => groupsService.getAll({ pageSize: 100 }) })
  const { data: groupStudents } = useQuery({
    queryKey: ['group-students', selectedGroupId],
    queryFn: () => groupsService.getStudents(selectedGroupId),
    enabled: !!selectedGroupId && mode === 'manual',
  })
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', page, selectedGroupId, selectedDate],
    queryFn: () => attendanceService.getAll({ page, groupId: selectedGroupId || undefined, date: selectedDate || undefined }),
  })

  const manualMutation = useMutation({
    mutationFn: (data: object) => attendanceService.takeManual(data),
    onSuccess: () => { toast.success('تم تسجيل الحضور'); qc.invalidateQueries({ queryKey: ['attendance'] }); setMode('list') },
    onError: () => toast.error('فشل تسجيل الحضور'),
  })

  const qrMutation = useMutation({
    mutationFn: (data: object) => attendanceService.scanQr(data),
    onSuccess: (res) => { toast.success(`تم تسجيل حضور ${res.studentName}`); setQrInput('') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'كود غير صالح'),
  })

  const handleManualSubmit = () => {
    if (!selectedGroupId) return toast.error('اختر المجموعة')
    const entries = Object.entries(manualEntries).map(([studentId, status]) => ({ studentId, status, notes: '' }))
    if (entries.length === 0) return toast.error('سجّل الحضور أولاً')
    manualMutation.mutate({ groupId: selectedGroupId, date: selectedDate, entries })
  }

  const columns = [
    { key: 'studentName', header: 'الطالب' },
    { key: 'groupName', header: 'المجموعة' },
    { key: 'date', header: 'التاريخ', render: (v: string) => new Date(v).toLocaleDateString('ar-EG') },
    { key: 'checkInTime', header: 'وقت الحضور', render: (v: string) => v ?? '—' },
    { key: 'method', header: 'طريقة التسجيل', render: (v: string) => <Badge variant="info">{v === 'QRCode' ? 'QR كود' : 'يدوي'}</Badge> },
    { key: 'status', header: 'الحالة', render: (v: string) => (
      <Badge variant={v === 'Present' ? 'success' : v === 'Absent' ? 'danger' : 'warning'}>
        {v === 'Present' ? 'حاضر' : v === 'Absent' ? 'غائب' : v === 'Late' ? 'متأخر' : 'معذور'}
      </Badge>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="الحضور والغياب" subtitle="تسجيل ومتابعة حضور الطلاب"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setMode('qr')} className="btn btn-outline flex items-center gap-2"><QrCode className="w-4 h-4" />مسح QR</button>
            <button onClick={() => setMode('manual')} className="btn btn-primary flex items-center gap-2"><CheckSquare className="w-4 h-4" />تسجيل يدوي</button>
          </div>
        }
      />

      {/* QR Mode */}
      {mode === 'qr' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">مسح QR Code</h3>
          <div className="flex gap-3 mb-4">
            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="input flex-1">
              <option value="">اختر المجموعة</option>
              {groups?.items?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && qrInput && selectedGroupId) qrMutation.mutate({ qrCode: qrInput, groupId: selectedGroupId }) }}
              placeholder="امسح أو اكتب QR Code..."
              className="input flex-1"
              autoFocus
            />
            <button onClick={() => qrInput && selectedGroupId && qrMutation.mutate({ qrCode: qrInput, groupId: selectedGroupId })}
              disabled={!qrInput || !selectedGroupId || qrMutation.isPending}
              className="btn btn-primary">تسجيل</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">اضغط Enter أو زر تسجيل بعد المسح</p>
          <button onClick={() => setMode('list')} className="mt-4 text-sm text-indigo-600">← العودة</button>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">تسجيل الحضور اليدوي</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="input">
              <option value="">اختر المجموعة</option>
              {groups?.items?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input" />
          </div>
          {groupStudents && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groupStudents.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{s.fullName}</span>
                  <div className="flex gap-2">
                    {['Present', 'Absent', 'Late'].map(status => (
                      <button key={status} onClick={() => setManualEntries(p => ({ ...p, [s.id]: status }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          manualEntries[s.id] === status
                            ? status === 'Present' ? 'bg-emerald-600 text-white'
                              : status === 'Absent' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                        {status === 'Present' ? 'حاضر' : status === 'Absent' ? 'غائب' : 'متأخر'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={handleManualSubmit} disabled={manualMutation.isPending} className="btn btn-primary">
              {manualMutation.isPending ? 'جاري الحفظ...' : 'حفظ الحضور'}
            </button>
            <button onClick={() => setMode('list')} className="btn btn-outline">إلغاء</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3">
        <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="input">
          <option value="">كل المجموعات</option>
          {groups?.items?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input" />
        <button className="btn btn-outline flex items-center gap-2"><Download className="w-4 h-4" />تصدير</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? <LoadingSpinner /> : (
          <DataTable columns={columns} data={attendance?.items ?? []} isLoading={false}
            page={page} totalPages={Math.ceil((attendance?.total ?? 0) / 50)} onPageChange={setPage}
            emptyMessage="لا توجد سجلات حضور" />
        )}
      </div>
    </div>
  )
}
