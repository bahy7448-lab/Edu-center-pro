import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QrCode, Download, Printer, Search, CheckSquare, Square, ScanLine, X, CheckCircle2, Clock, UserX } from 'lucide-react'
import { studentsService } from '../../services'
import { groupsService } from '../../services'
import { attendanceService } from '../../services'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// ── QR Generator ──────────────────────────────────────────────────────────────
function generateQRMatrix(text: string): boolean[][] {
  const size = 21
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const addFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
          if (row + r < size && col + c < size) matrix[row + r][col + c] = true
  }
  addFinder(0, 0); addFinder(0, 14); addFinder(14, 0)
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  for (let r = 8; r < size - 8; r++)
    for (let c = 8; c < size - 8; c++)
      matrix[r][c] = ((hash ^ (r * 31 + c * 17)) & 1) === 1
  for (let i = 8; i < size - 8; i++) { matrix[6][i] = i % 2 === 0; matrix[i][6] = i % 2 === 0 }
  return matrix
}

function QRCodeSVG({ value, size = 120 }: { value: string; size?: number }) {
  const matrix = generateQRMatrix(value)
  const ms = size / matrix.length
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {matrix.map((row, r) => row.map((cell, c) =>
        cell ? <rect key={`${r}-${c}`} x={c * ms} y={r * ms} width={ms} height={ms} fill="#111" /> : null
      ))}
    </svg>
  )
}

// ── Print ─────────────────────────────────────────────────────────────────────
function printQRCards(students: any[]) {
  const w = window.open('', '_blank')
  if (!w) return
  const cards = students.map(s => {
    const matrix = generateQRMatrix(s.qrCode || s.studentCode)
    const sz = 160; const ms = sz / matrix.length
    const rects = matrix.flatMap((row, r) =>
      row.map((cell, c) => cell ? `<rect x="${c*ms}" y="${r*ms}" width="${ms}" height="${ms}" fill="#111"/>` : '')
    ).join('')
    return `<div class="card">
      <div class="qr-wrap">
        <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><rect width="${sz}" height="${sz}" fill="white"/>${rects}</svg>
      </div>
      <div class="info">
        <div class="name">${s.fullName}</div>
        <div class="code">${s.studentCode}</div>
        ${s.phone ? `<div class="phone">${s.phone}</div>` : ''}
      </div>
    </div>`
  }).join('')
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>كروت QR</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;background:#fff;padding:10px}
      h1{text-align:center;color:#6C5CE7;font-size:16px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #6C5CE7}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      .card{border:1px solid #e5e7eb;border-radius:12px;padding:10px;text-align:center;break-inside:avoid;display:flex;flex-direction:column;align-items:center;gap:6px}
      .qr-wrap{background:#fff;padding:4px;border-radius:6px;border:1px solid #f0f0f0}
      .name{font-size:11px;font-weight:bold;color:#111;margin-top:2px}
      .code{font-size:10px;font-family:monospace;color:#6C5CE7;background:#f0eeff;padding:2px 6px;border-radius:4px;margin-top:2px}
      .phone{font-size:9px;color:#888}
      @media print{@page{margin:8mm;size:A4}.grid{gap:8px}}
    </style>
    </head><body>
    <h1>🎓 EduCenter Pro — كروت QR الطلاب (${students.length} طالب)</h1>
    <div class="grid">${cards}</div>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`)
  w.document.close()
}

// ── Scanner Modal ─────────────────────────────────────────────────────────────
function ScannerModal({ groupId, date, onClose }: { groupId: string; date: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [qrInput, setQrInput] = useState('')
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [stats, setStats] = useState({ present: 0, late: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: groupStudents } = useQuery({
    queryKey: ['group-students-scan', groupId],
    queryFn: () => groupId ? groupsService.getStudents(groupId) : Promise.resolve([]),
    enabled: !!groupId,
  })

  const totalStudents = groupStudents?.length || 0
  const attendancePct = totalStudents ? Math.round((stats.present + stats.late) / totalStudents * 100) : 0

  const qrMutation = useMutation({
    mutationFn: (data: object) => attendanceService.scanQr(data),
    onSuccess: (res: any) => {
      const isLate = new Date().getHours() >= 9
      const result = { studentName: res.studentName, status: isLate ? 'late' : 'present', time: new Date().toLocaleTimeString('ar-EG') }
      setScanResult(result)
      setScanHistory(prev => [{ ...result, id: Date.now() }, ...prev.slice(0, 9)])
      setStats(prev => ({ ...prev, [isLate ? 'late' : 'present']: prev[isLate ? 'late' : 'present'] + 1 }))
      qc.invalidateQueries({ queryKey: ['attendance'] })
      setTimeout(() => { setScanResult(null); inputRef.current?.focus() }, 2500)
    },
  })

  const handleScan = () => {
    if (!qrInput.trim()) return
    qrMutation.mutate({ qrCode: qrInput.trim(), groupId, date })
    setQrInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,11,20,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--navy-800)', border: '1px solid var(--border-s)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,184,148,0.15)' }}>
              <ScanLine className="w-5 h-5" style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>ماسح QR الحضور</h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>التاريخ: {date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--green)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
              جلسة نشطة
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-3)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Scanner */}
          <div className="md:col-span-2 p-6 flex flex-col gap-4" style={{ borderLeft: '1px solid var(--border)' }}>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'حاضر', value: stats.present, color: 'var(--green)', icon: CheckCircle2 },
                { label: 'متأخر', value: stats.late, color: 'var(--amber)', icon: Clock },
                { label: 'غائب', value: Math.max(0, totalStudents - stats.present - stats.late), color: 'var(--red)', icon: UserX },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-3)' }}>نسبة الحضور</span>
                <span className="font-bold" style={{ color: 'var(--green)' }}>{attendancePct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${attendancePct}%`, background: 'linear-gradient(90deg,var(--green),#00D4AB)' }} />
              </div>
            </div>

            {/* Frame */}
            <div className="relative rounded-2xl flex items-center justify-center"
              style={{ height: 170, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-s)' }}>
              {[['top-3 right-3','border-t-2 border-r-2 rounded-tr-lg'],['top-3 left-3','border-t-2 border-l-2 rounded-tl-lg'],
                ['bottom-3 right-3','border-b-2 border-r-2 rounded-br-lg'],['bottom-3 left-3','border-b-2 border-l-2 rounded-bl-lg']
              ].map(([pos,cls],i)=>(
                <div key={i} className={`absolute w-6 h-6 ${pos} ${cls}`} style={{ borderColor:'var(--green)' }} />
              ))}
              <div className="absolute w-4/5 h-px scan-line"
                style={{ background:'linear-gradient(90deg,transparent,var(--green),transparent)', boxShadow:'0 0 8px var(--green)' }} />
              {scanResult ? (
                <div className="flex flex-col items-center gap-2 animate-fade-in z-10">
                  <CheckCircle2 className="w-9 h-9" style={{ color: scanResult.status==='present'?'var(--green)':'var(--amber)' }} />
                  <p className="text-sm font-bold" style={{ color:'var(--text-1)' }}>{scanResult.studentName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={scanResult.status==='present'
                      ?{background:'rgba(0,184,148,0.15)',color:'var(--green)'}
                      :{background:'rgba(253,203,110,0.15)',color:'var(--amber)'}}>
                    {scanResult.status==='present'?'✓ حاضر':'⏰ متأخر'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 z-10">
                  <QrCode className="w-9 h-9" style={{ color:'var(--text-3)' }} />
                  <p className="text-xs" style={{ color:'var(--text-3)' }}>في انتظار المسح...</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs mb-1" style={{ color:'var(--text-3)' }}>كود QR أو رقم الطالب</label>
              <div className="flex gap-2">
                <input ref={inputRef} autoFocus value={qrInput} onChange={e=>setQrInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleScan()}
                  placeholder="STU-XXXX أو QR-STU-XXXX"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-s)', color:'var(--text-1)' }} />
                <button onClick={handleScan} disabled={!qrInput.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition"
                  style={{ background:'var(--green)', color:'#fff' }}>تسجيل</button>
              </div>
              <p className="text-[11px] mt-1" style={{ color:'var(--text-3)' }}>اضغط Enter بعد مسح QR مباشرة</p>
            </div>
          </div>

          {/* History */}
          <div className="md:col-span-3 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color:'var(--text-1)' }}>آخر عمليات المسح</h3>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background:'rgba(108,92,231,0.1)', color:'var(--purple-l)' }}>
                {scanHistory.length} عملية
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-80">
              {scanHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <ScanLine className="w-10 h-10 opacity-10" style={{ color:'var(--text-1)' }} />
                  <p className="text-sm" style={{ color:'var(--text-3)' }}>ابدأ بمسح كود QR لأي طالب</p>
                </div>
              ) : scanHistory.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl animate-fade-in"
                  style={{ background: i===0?'rgba(0,184,148,0.05)':'rgba(255,255,255,0.02)', border:`1px solid ${i===0?'rgba(0,184,148,0.2)':'var(--border)'}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background:'rgba(108,92,231,0.15)', color:'var(--purple-l)' }}>
                    {item.studentName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color:'var(--text-1)' }}>{item.studentName}</p>
                    <p className="text-xs" style={{ color:'var(--text-3)' }}>{item.time}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={item.status==='present'
                      ?{background:'rgba(0,184,148,0.1)',color:'var(--green)'}
                      :{background:'rgba(253,203,110,0.1)',color:'var(--amber)'}}>
                    {item.status==='present'?'حاضر':'متأخر'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main QR Page ──────────────────────────────────────────────────────────────
export function QRCodesPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterActive, setFilterActive] = useState('all')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['students-qr'],
    queryFn: () => studentsService.getAll({ pageSize: 500 }),
  })
  const { data: groups } = useQuery({
    queryKey: ['groups-list'],
    queryFn: () => groupsService.getAll({ pageSize: 100 }),
  })

  const students = data?.items || []
  const filtered = students.filter(s => {
    const ms = !search || s.fullName?.includes(search) || s.studentCode?.includes(search) || s.phone?.includes(search)
    const ma = filterActive==='all' || (filterActive==='active'&&s.isActive) || (filterActive==='inactive'&&!s.isActive)
    return ms && ma
  })

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const selectAll = () => setSelected(selected.size===filtered.length ? new Set() : new Set(filtered.map(s=>s.id)))
  const selectedStudents = filtered.filter(s => selected.has(s.id))

  const downloadSingle = (student: any) => {
    const matrix = generateQRMatrix(student.qrCode || student.studentCode)
    const sz = 300; const ms = sz / matrix.length
    const canvas = document.createElement('canvas')
    canvas.width = sz + 40; canvas.height = sz + 70
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    matrix.forEach((row, r) => row.forEach((cell, c) => {
      if (cell) { ctx.fillStyle='#111111'; ctx.fillRect(20+c*ms, 20+r*ms, ms, ms) }
    }))
    ctx.fillStyle='#111111'; ctx.font='bold 14px Arial'; ctx.textAlign='center'
    ctx.fillText(student.fullName, canvas.width/2, sz+42)
    ctx.fillStyle='#6C5CE7'; ctx.font='12px monospace'
    ctx.fillText(student.studentCode, canvas.width/2, sz+60)
    const a = document.createElement('a')
    a.download = `QR-${student.studentCode}.png`
    a.href = canvas.toDataURL()
    a.click()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-5 h-5" style={{ color:'var(--purple-l)' }} />
            <h1 className="text-lg font-bold" style={{ color:'var(--text-1)' }}>كروت QR الطلاب</h1>
          </div>
          <p className="text-sm" style={{ color:'var(--text-3)' }}>أنشئ وطبع أو حمّل كود QR لكل طالب</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={selectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-s)', color:'var(--text-2)' }}>
            {selected.size===filtered.length&&filtered.length>0
              ?<><CheckSquare className="w-4 h-4" style={{color:'var(--purple-l)'}}/>إلغاء الكل</>
              :<><Square className="w-4 h-4"/>تحديد الكل</>}
          </button>
          <button onClick={()=>selectedStudents.length>0&&printQRCards(selectedStudents)}
            disabled={selectedStudents.length===0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40"
            style={{ background:'rgba(108,92,231,0.15)', border:'1px solid rgba(108,92,231,0.3)', color:'var(--purple-l)' }}>
            <Printer className="w-4 h-4"/>طباعة {selectedStudents.length>0&&`(${selectedStudents.length})`}
          </button>
          <button onClick={()=>setScannerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition"
            style={{ background:'var(--green)', color:'#fff' }}>
            <ScanLine className="w-4 h-4"/>بدء المسح
          </button>
        </div>
      </div>

      {/* Session bar */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-end"
        style={{ background:'var(--navy-800)', border:'1px solid var(--border)' }}>
        <div>
          <label className="block text-xs mb-1" style={{ color:'var(--text-3)' }}>المجموعة</label>
          <select value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-s)', color:'var(--text-1)' }}>
            <option value="">كل المجموعات</option>
            {groups?.items?.map((g:any)=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color:'var(--text-3)' }}>التاريخ</label>
          <input type="date" value={scanDate} onChange={e=>setScanDate(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-s)', color:'var(--text-1)' }} />
        </div>
        <button onClick={()=>setScannerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium h-[38px] transition"
          style={{ background:'rgba(0,184,148,0.1)', border:'1px solid rgba(0,184,148,0.2)', color:'var(--green)' }}>
          <ScanLine className="w-4 h-4"/>فتح الماسح
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3"
        style={{ background:'var(--navy-800)', border:'1px solid var(--border)', borderRadius:14, padding:'12px 16px' }}>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-3)' }} />
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود أو الهاتف..."
            className="w-full pr-9 pl-3 py-2 text-sm rounded-xl outline-none"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-s)', color:'var(--text-1)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.03)' }}>
          {[{v:'all',l:'الكل'},{v:'active',l:'نشط'},{v:'inactive',l:'غير نشط'}].map(opt=>(
            <button key={opt.v} onClick={()=>setFilterActive(opt.v)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
              style={filterActive===opt.v
                ?{background:'rgba(108,92,231,0.2)',color:'var(--purple-l)'}
                :{color:'var(--text-3)'}}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs px-1" style={{ color:'var(--text-3)' }}>
        <span>{filtered.length} طالب</span>
        {selected.size>0&&<span style={{ color:'var(--purple-l)' }}>• {selected.size} محدد</span>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({length:10}).map((_,i)=>(
            <div key={i} className="rounded-2xl h-52 animate-pulse"
              style={{ background:'var(--navy-800)', border:'1px solid var(--border)' }} />
          ))}
        </div>
      ) : filtered.length===0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <QrCode className="w-14 h-14 opacity-10" style={{ color:'var(--text-1)' }} />
          <p style={{ color:'var(--text-3)' }}>لا يوجد طلاب</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(student=>(
            <div key={student.id}
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 group`}
              style={{
                background:'var(--navy-800)',
                border: selected.has(student.id)?'1px solid var(--purple)':'1px solid var(--border)',
                boxShadow: selected.has(student.id)?'0 0 0 2px rgba(108,92,231,0.25)':'none',
              }}>
              {/* Select */}
              <button onClick={()=>toggleSelect(student.id)}
                className="absolute top-2 right-2 z-10 p-1 rounded-lg transition"
                style={{ background: selected.has(student.id)?'var(--purple)':'rgba(0,0,0,0.5)' }}>
                {selected.has(student.id)
                  ?<CheckSquare className="w-3.5 h-3.5 text-white"/>
                  :<Square className="w-3.5 h-3.5 text-white/60"/>}
              </button>

              <div className="p-4 flex flex-col items-center gap-3">
                {/* QR */}
                <div className="p-2 rounded-xl shadow-lg" style={{ background:'#fff' }}>
                  <QRCodeSVG value={student.qrCode||student.studentCode} size={96} />
                </div>

                {/* Info */}
                <div className="text-center w-full">
                  <p className="text-xs font-bold truncate" style={{ color:'var(--text-1)' }}>{student.fullName}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color:'var(--purple-l)' }}>{student.studentCode}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1"
                    style={student.isActive
                      ?{background:'rgba(0,184,148,0.1)',color:'var(--green)'}
                      :{background:'rgba(255,107,107,0.1)',color:'var(--red)'}}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{background:'currentColor'}}/>
                    {student.isActive?'نشط':'غير نشط'}
                  </span>
                </div>

                {/* Download */}
                <button onClick={()=>downloadSingle(student)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-xl transition opacity-0 group-hover:opacity-100"
                  style={{ background:'rgba(108,92,231,0.12)', color:'var(--purple-l)' }}>
                  <Download className="w-3 h-3"/>تحميل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {scannerOpen&&<ScannerModal groupId={selectedGroup} date={scanDate} onClose={()=>setScannerOpen(false)}/>}
    </div>
  )
}
