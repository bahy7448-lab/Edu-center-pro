const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuid } = require('uuid')
const Datastore = require('@seald-io/nedb')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = 5000
const JWT_SECRET = 'educenterpro-secret-key-2026'
const DB_DIR = path.join(__dirname, 'data')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR)

// ── Databases ────────────────────────────────────────────────────────────────
const db = {
  users:      new Datastore({ filename: path.join(DB_DIR, 'users.db'),      autoload: true }),
  students:   new Datastore({ filename: path.join(DB_DIR, 'students.db'),   autoload: true }),
  teachers:   new Datastore({ filename: path.join(DB_DIR, 'teachers.db'),   autoload: true }),
  groups:     new Datastore({ filename: path.join(DB_DIR, 'groups.db'),     autoload: true }),
  attendance: new Datastore({ filename: path.join(DB_DIR, 'attendance.db'), autoload: true }),
  payments:   new Datastore({ filename: path.join(DB_DIR, 'payments.db'),   autoload: true }),
  exams:      new Datastore({ filename: path.join(DB_DIR, 'exams.db'),      autoload: true }),
  results:    new Datastore({ filename: path.join(DB_DIR, 'results.db'),    autoload: true }),
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const dbFind = (col, query = {}) => new Promise((res, rej) => col.find(query, (e, d) => e ? rej(e) : res(d)))
const dbFindOne = (col, query) => new Promise((res, rej) => col.findOne(query, (e, d) => e ? rej(e) : res(d)))
const dbInsert = (col, doc) => new Promise((res, rej) => col.insert(doc, (e, d) => e ? rej(e) : res(d)))
const dbUpdate = (col, query, update, opts = {}) => new Promise((res, rej) => col.update(query, update, opts, (e, n) => e ? rej(e) : res(n)))
const dbRemove = (col, query, opts = {}) => new Promise((res, rej) => col.remove(query, opts, (e, n) => e ? rej(e) : res(n)))
const dbCount = (col, query = {}) => new Promise((res, rej) => col.count(query, (e, n) => e ? rej(e) : res(n)))

const paginate = (items, page = 1, pageSize = 10) => {
  const p = parseInt(page), ps = parseInt(pageSize)
  const start = (p - 1) * ps
  return {
    items: items.slice(start, start + ps),
    total: items.length,
    page: p,
    pageSize: ps,
    totalPages: Math.ceil(items.length / ps)
  }
}

const auth = (req, res, next) => {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'غير مصرح' })
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET)
    next()
  } catch { res.status(401).json({ message: 'token منتهي' }) }
}

// Restricts a route to specific roles (e.g. only SuperAdmin can manage all centers)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' })
  next()
}

// Every tenant-scoped route relies on this: records outside the caller's center
// simply don't exist as far as they're concerned. A SuperAdmin token has no
// centerId, so it never matches real data here (SuperAdmin has its own routes).
const tenantId = (req) => req.user?.centerId || '__no_center__'

// Fetch a record only if it belongs to the caller's center - prevents one
// center from reading/editing/deleting another center's data by guessing IDs.
async function findOwned(col, id, req) {
  const rec = await dbFindOne(col, { id })
  if (!rec || rec.centerId !== tenantId(req)) return null
  return rec
}

// Strips centerId/id from a PATCH/PUT body so a client can never move a
// record into another tenant or overwrite its primary key.
function safeBody(body) {
  const { centerId, id, _id, ...rest } = body || {}
  return rest
}

// ── Seed Data ────────────────────────────────────────────────────────────────
async function seed() {
  const count = await dbCount(db.users)
  if (count > 0) return console.log('✅ البيانات موجودة')

  const hash = await bcrypt.hash('123456', 10)
  await dbInsert(db.users, {
    id: uuid(), fullName: 'أحمد محمد السيد', email: 'admin@educenter.com',
    password: hash, role: 'CenterAdmin', centerId: 'c1', createdAt: new Date().toISOString()
  })
  await dbInsert(db.users, {
    id: uuid(), fullName: 'مدير المنصة', email: 'superadmin@educenter.com',
    password: hash, role: 'SuperAdmin', createdAt: new Date().toISOString()
  })

  const teacherIds = []
  const tNames = ['محمد إبراهيم','سامي حسن','فاطمة علي','خالد عمر','نهى سعيد','أحمد رضا']
  const tSpecs = ['رياضيات','فيزياء','لغة عربية','كيمياء','إنجليزي','أحياء']
  for (let i = 0; i < 6; i++) {
    const id = uuid()
    teacherIds.push(id)
    await dbInsert(db.teachers, {
      id, fullName: `أ. ${tNames[i]}`, phone: `010${String(i).padStart(8,'0')}`,
      email: `teacher${i+1}@educenter.com`, specialization: tSpecs[i],
      salary: 3000 + i * 500, hireDate: '2023-09-01', isActive: true, groupsCount: 0, centerId: 'c1'
    })
  }

  const groupIds = []
  const gData = [
    {name:'رياضيات ثانوي أ', sub:'رياضيات', fee:500, sched:'السبت والثلاثاء 4م'},
    {name:'فيزياء ثانوي ب',   sub:'فيزياء',   fee:500, sched:'الأحد والأربعاء 5م'},
    {name:'لغة عربية إعدادي', sub:'لغة عربية', fee:350, sched:'الاثنين والخميس 3م'},
    {name:'كيمياء ثانوي ج',   sub:'كيمياء',   fee:500, sched:'الثلاثاء والجمعة 6م'},
  ]
  for (let i = 0; i < gData.length; i++) {
    const id = uuid()
    groupIds.push(id)
    await dbInsert(db.groups, {
      id, name: gData[i].name, subjectName: gData[i].sub,
      teacherId: teacherIds[i], teacherName: `أ. ${tNames[i]}`,
      schedule: gData[i].sched, maxCapacity: 25, enrolledCount: 0,
      monthlyFee: gData[i].fee, isActive: true, centerId: 'c1'
    })
  }

  const sNames = ['محمد علي أحمد','سارة محمود حسن','كريم إبراهيم يوسف','نورهان عبد الله','عمر فاروق سعد','ياسمين أحمد علي','عبد الرحمن محمد','منى حسن محمود','أحمد خالد سعيد','رنا وليد عمر','مصطفى جمال حسن','دينا محمد علي','خالد عبد العزيز','فاطمة الزهراء','يوسف إبراهيم','مريم طارق سعد']
  for (let i = 0; i < sNames.length; i++) {
    const id = uuid()
    const code = `STU-${String(i+1).padStart(3,'0')}`
    await dbInsert(db.students, {
      id, fullName: sNames[i], studentCode: code,
      phone: `0101234${String(i).padStart(4,'0')}`,
      email: `student${i+1}@educenter.com`,
      qrCode: `QR-${code}`, enrollDate: '2024-01-15',
      isActive: i % 5 !== 3, groupsCount: 1,
      totalPaid: (i+1)*250, totalDue: 500, centerId: 'c1'
    })
    await dbInsert(db.payments, {
      id: uuid(), studentId: id, studentName: sNames[i],
      groupId: groupIds[i % groupIds.length],
      groupName: gData[i % gData.length].name,
      amount: gData[i % gData.length].fee, discount: 0,
      netAmount: gData[i % gData.length].fee,
      method: i % 2 === 0 ? 'Cash' : 'Transfer',
      status: i % 4 === 0 ? 'Overdue' : i % 3 === 0 ? 'Pending' : 'Paid',
      description: 'رسوم شهر يوليو 2026',
      dueDate: '2026-07-01',
      paidDate: i % 3 !== 0 ? '2026-06-20' : null,
      receiptNumber: `RCP-2406${String(i+1).padStart(3,'0')}`,
      centerId: 'c1',
      createdAt: new Date().toISOString()
    })
  }

  await dbInsert(db.exams, {
    id: uuid(), groupId: groupIds[0], groupName: 'رياضيات ثانوي أ',
    title: 'امتحان منتصف الترم', maxScore: 100, passScore: 50,
    examDate: '2026-07-15', status: 'Scheduled', resultsCount: 0, centerId: 'c1'
  })
  await dbInsert(db.exams, {
    id: uuid(), groupId: groupIds[1], groupName: 'فيزياء ثانوي ب',
    title: 'اختبار شهري', maxScore: 50, passScore: 25,
    examDate: '2026-07-18', status: 'Scheduled', resultsCount: 0, centerId: 'c1'
  })

  console.log('✅ تم إضافة البيانات الأولية')
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }))
app.use(express.json())

// ── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await dbFindOne(db.users, { email })
    if (!user) return res.status(401).json({ message: 'البريد الإلكتروني غير موجود' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: 'كلمة المرور غير صحيحة' })
    const payload = { id: user.id, email: user.email, role: user.role, fullName: user.fullName, centerId: user.centerId }
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    res.json({ user: payload, accessToken, refreshToken: 'rf-' + uuid() })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

app.post('/api/auth/refresh', (req, res) => {
  res.json({ accessToken: jwt.sign({ id: '1', role: 'CenterAdmin' }, JWT_SECRET, { expiresIn: '7d' }) })
})

app.post('/api/auth/logout', (req, res) => res.json({ success: true }))

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await dbFindOne(db.users, { id: req.user.id })
  if (!user) return res.status(404).json({ message: 'غير موجود' })
  const { password, ...safe } = user
  res.json(safe)
})

app.put('/api/auth/profile', auth, async (req, res) => {
  const { fullName, email, phone } = req.body
  const user = await dbFindOne(db.users, { id: req.user.id })
  if (!user) return res.status(404).json({ message: 'غير موجود' })
  if (email && email !== user.email) {
    const exists = await dbFindOne(db.users, { email })
    if (exists && exists.id !== user.id) return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' })
  }
  await dbUpdate(db.users, { id: req.user.id }, { $set: { fullName, email, phone } })
  const updated = await dbFindOne(db.users, { id: req.user.id })
  const { password, ...safe } = updated
  // Keep JWT payload in sync so the header/sidebar reflect the new name immediately
  const payload = { id: safe.id, email: safe.email, role: safe.role, fullName: safe.fullName, centerId: safe.centerId }
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  res.json({ user: safe, accessToken })
})

app.post('/api/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' })
  const user = await dbFindOne(db.users, { id: req.user.id })
  if (!user) return res.status(404).json({ message: 'غير موجود' })
  const ok = await bcrypt.compare(currentPassword || '', user.password)
  if (!ok) return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' })
  const hash = await bcrypt.hash(newPassword, 10)
  await dbUpdate(db.users, { id: req.user.id }, { $set: { password: hash } })
  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })
})

app.get('/api/auth/notifications', auth, async (req, res) => {
  const user = await dbFindOne(db.users, { id: req.user.id })
  if (!user) return res.status(404).json({ message: 'غير موجود' })
  res.json(user.notifPrefs || { email: true, sms: true, whatsapp: true, inApp: true })
})

app.put('/api/auth/notifications', auth, async (req, res) => {
  const { email, sms, whatsapp, inApp } = req.body
  const notifPrefs = { email: !!email, sms: !!sms, whatsapp: !!whatsapp, inApp: !!inApp }
  await dbUpdate(db.users, { id: req.user.id }, { $set: { notifPrefs } })
  res.json(notifPrefs)
})

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, async (req, res) => {
  const cid = tenantId(req)
  const [studentsCount, teachersCount, groupsCount, allPayments, allAttendance] = await Promise.all([
    dbCount(db.students, { isActive: true, centerId: cid }),
    dbCount(db.teachers, { isActive: true, centerId: cid }),
    dbCount(db.groups, { isActive: true, centerId: cid }),
    dbFind(db.payments, { centerId: cid }),
    dbFind(db.attendance, { centerId: cid }),
  ])
  const paidPayments = allPayments.filter(p => p.status === 'Paid')
  const monthlyRevenue = paidPayments.reduce((s, p) => s + (p.netAmount || 0), 0)
  const attendanceRate = allAttendance.length
    ? Math.round(allAttendance.filter(a => a.status === 'Present').length / allAttendance.length * 100)
    : 88
  res.json({
    studentsCount, teachersCount, groupsCount,
    monthlyRevenue: monthlyRevenue || 42500,
    monthlyRevenueGrowth: 12.5, attendanceRate,
    pendingPayments: allPayments.filter(p => p.status === 'Pending').length,
    totalRevenue: monthlyRevenue || 42500, totalExpenses: 18200,
    netProfit: (monthlyRevenue || 42500) - 18200,
    revenueByMonth: [
      {month:'يناير',revenue:28000},{month:'فبراير',revenue:31000},{month:'مارس',revenue:35000},
      {month:'أبريل',revenue:38000},{month:'مايو',revenue:40000},{month:'يونيو',revenue:monthlyRevenue||42500},
    ],
    attendanceByDay: [
      {day:'الأحد',rate:88},{day:'الاثنين',rate:75},{day:'الثلاثاء',rate:92},{day:'الأربعاء',rate:65},{day:'الخميس',rate:80},
    ],
    paymentStats: {
      paid: paidPayments.length,
      pending: allPayments.filter(p=>p.status==='Pending').length,
      overdue: allPayments.filter(p=>p.status==='Overdue').length,
    },
    upcomingExams: await dbFind(db.exams, { status: 'Scheduled', centerId: cid }),
  })
})

// ── STUDENTS ──────────────────────────────────────────────────────────────────
app.get('/api/students', auth, async (req, res) => {
  const { page = 1, pageSize = 10, search, isActive } = req.query
  let all = await dbFind(db.students, { centerId: tenantId(req) })
  if (search) all = all.filter(s => s.fullName?.includes(search) || s.studentCode?.includes(search) || s.phone?.includes(search))
  if (isActive !== undefined) all = all.filter(s => s.isActive === (isActive === 'true'))
  all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  res.json(paginate(all, page, pageSize))
})

app.get('/api/students/export', auth, async (req, res) => {
  const all = await dbFind(db.students, { centerId: tenantId(req) })
  res.json(all)
})

app.get('/api/students/:id', auth, async (req, res) => {
  const s = await findOwned(db.students, req.params.id, req)
  if (!s) return res.status(404).json({ message: 'الطالب غير موجود' })
  res.json(s)
})

app.post('/api/students', auth, async (req, res) => {
  const cid = tenantId(req)
  const count = await dbCount(db.students, { centerId: cid })
  const id = uuid()
  const doc = {
    ...safeBody(req.body), id,
    studentCode: `STU-${String(count + 1).padStart(3, '0')}`,
    qrCode: `QR-STU-${id.slice(0, 8)}`,
    isActive: true, groupsCount: 0, totalPaid: 0, totalDue: 0,
    centerId: cid, createdAt: new Date().toISOString()
  }
  const inserted = await dbInsert(db.students, doc)
  notifyCenter(cid, { title: 'طالب جديد', message: `تم تسجيل الطالب ${inserted.fullName} بنجاح`, type: 'success' }).catch(() => {})
  res.status(201).json(inserted)
})

app.put('/api/students/:id', auth, async (req, res) => {
  const existing = await findOwned(db.students, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'الطالب غير موجود' })
  await dbUpdate(db.students, { id: req.params.id }, { $set: safeBody(req.body) })
  const updated = await dbFindOne(db.students, { id: req.params.id })
  res.json(updated)
})

app.delete('/api/students/:id', auth, async (req, res) => {
  const existing = await findOwned(db.students, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'الطالب غير موجود' })
  await dbRemove(db.students, { id: req.params.id })
  res.status(200).json({ success: true })
})

app.get('/api/students/:id/attendance', auth, async (req, res) => {
  const student = await findOwned(db.students, req.params.id, req)
  if (!student) return res.status(404).json({ message: 'الطالب غير موجود' })
  const { page = 1, pageSize = 10 } = req.query
  const all = await dbFind(db.attendance, { studentId: req.params.id, centerId: tenantId(req) })
  res.json(paginate(all, page, pageSize))
})

app.get('/api/students/:id/payments', auth, async (req, res) => {
  const student = await findOwned(db.students, req.params.id, req)
  if (!student) return res.status(404).json({ message: 'الطالب غير موجود' })
  const all = await dbFind(db.payments, { studentId: req.params.id, centerId: tenantId(req) })
  res.json(paginate(all, 1, 100))
})

app.get('/api/students/:id/exam-results', auth, async (req, res) => {
  const student = await findOwned(db.students, req.params.id, req)
  if (!student) return res.status(404).json({ message: 'الطالب غير موجود' })
  const all = await dbFind(db.results, { studentId: req.params.id, centerId: tenantId(req) })
  res.json(all)
})

app.get('/api/students/:id/card', auth, async (req, res) => {
  const s = await findOwned(db.students, req.params.id, req)
  if (!s) return res.status(404).json({ message: 'الطالب غير موجود' })
  res.json({ studentCode: s.studentCode, qrCode: s.qrCode, name: s.fullName })
})

// ── TEACHERS ──────────────────────────────────────────────────────────────────
app.get('/api/teachers', auth, async (req, res) => {
  const { page = 1, pageSize = 10, search } = req.query
  let all = await dbFind(db.teachers, { centerId: tenantId(req) })
  if (search) all = all.filter(t => t.fullName?.includes(search))
  res.json(paginate(all, page, pageSize))
})

app.get('/api/teachers/:id', auth, async (req, res) => {
  const t = await findOwned(db.teachers, req.params.id, req)
  if (!t) return res.status(404).json({ message: 'المدرس غير موجود' })
  res.json(t)
})

app.post('/api/teachers', auth, async (req, res) => {
  const doc = { ...safeBody(req.body), id: uuid(), isActive: true, groupsCount: 0, centerId: tenantId(req), createdAt: new Date().toISOString() }
  const inserted = await dbInsert(db.teachers, doc)
  res.status(201).json(inserted)
})

app.put('/api/teachers/:id', auth, async (req, res) => {
  const existing = await findOwned(db.teachers, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'المدرس غير موجود' })
  await dbUpdate(db.teachers, { id: req.params.id }, { $set: safeBody(req.body) })
  res.json(await dbFindOne(db.teachers, { id: req.params.id }))
})

app.delete('/api/teachers/:id', auth, async (req, res) => {
  const existing = await findOwned(db.teachers, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'المدرس غير موجود' })
  await dbRemove(db.teachers, { id: req.params.id })
  res.status(200).json({ success: true })
})

// ── GROUPS ────────────────────────────────────────────────────────────────────
app.get('/api/groups', auth, async (req, res) => {
  const { page = 1, pageSize = 100 } = req.query
  const all = await dbFind(db.groups, { centerId: tenantId(req) })
  res.json(paginate(all, page, pageSize))
})

app.get('/api/groups/:id', auth, async (req, res) => {
  const g = await findOwned(db.groups, req.params.id, req)
  if (!g) return res.status(404).json({ message: 'المجموعة غير موجودة' })
  res.json(g)
})

app.post('/api/groups', auth, async (req, res) => {
  const doc = { ...safeBody(req.body), id: uuid(), enrolledCount: 0, isActive: true, centerId: tenantId(req), createdAt: new Date().toISOString() }
  const inserted = await dbInsert(db.groups, doc)
  res.status(201).json(inserted)
})

app.put('/api/groups/:id', auth, async (req, res) => {
  const existing = await findOwned(db.groups, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'المجموعة غير موجودة' })
  await dbUpdate(db.groups, { id: req.params.id }, { $set: safeBody(req.body) })
  res.json(await dbFindOne(db.groups, { id: req.params.id }))
})

app.delete('/api/groups/:id', auth, async (req, res) => {
  const existing = await findOwned(db.groups, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'المجموعة غير موجودة' })
  await dbRemove(db.groups, { id: req.params.id })
  res.status(200).json({ success: true })
})

app.get('/api/groups/:id/students', auth, async (req, res) => {
  const group = await findOwned(db.groups, req.params.id, req)
  if (!group) return res.status(404).json({ message: 'المجموعة غير موجودة' })
  const all = await dbFind(db.students, { centerId: tenantId(req) })
  res.json(all.slice(0, 10))
})

app.post('/api/groups/:groupId/students/:studentId', auth, async (req, res) => {
  const group = await findOwned(db.groups, req.params.groupId, req)
  const student = await findOwned(db.students, req.params.studentId, req)
  if (!group || !student) return res.status(404).json({ message: 'غير موجود' })
  res.json({ success: true })
})

app.delete('/api/groups/:groupId/students/:studentId', auth, async (req, res) => {
  const group = await findOwned(db.groups, req.params.groupId, req)
  const student = await findOwned(db.students, req.params.studentId, req)
  if (!group || !student) return res.status(404).json({ message: 'غير موجود' })
  res.status(200).json({ success: true })
})

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
app.get('/api/attendance', auth, async (req, res) => {
  const { page = 1, pageSize = 10, groupId, date } = req.query
  let all = await dbFind(db.attendance, { centerId: tenantId(req) })
  if (groupId) all = all.filter(a => a.groupId === groupId)
  if (date) all = all.filter(a => a.date === date)
  all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  res.json(paginate(all, page, pageSize))
})

app.post('/api/attendance/manual', auth, async (req, res) => {
  const { groupId, date, entries } = req.body
  const group = await findOwned(db.groups, groupId, req)
  if (!group) return res.status(404).json({ message: 'المجموعة غير موجودة' })
  const cid = tenantId(req)
  for (const e of entries || []) {
    const student = await findOwned(db.students, e.studentId, req)
    if (!student) continue
    await dbInsert(db.attendance, {
      id: uuid(), studentId: e.studentId,
      studentName: student.fullName || '',
      groupId, groupName: group.name || '',
      date, status: e.status, method: 'Manual',
      checkInTime: e.status === 'Present' ? new Date().toTimeString().slice(0, 5) : null,
      notes: e.notes || '', centerId: cid, createdAt: new Date().toISOString()
    })
  }
  res.json({ success: true, count: entries?.length || 0 })
})

app.post('/api/attendance/qr', auth, async (req, res) => {
  const { qrCode, groupId } = req.body
  const cid = tenantId(req)
  const student = await dbFindOne(db.students, { qrCode, centerId: cid })
  if (!student) return res.status(404).json({ message: 'كود QR غير صالح' })
  const group = await findOwned(db.groups, groupId, req)
  if (!group) return res.status(404).json({ message: 'المجموعة غير موجودة' })
  const today = new Date().toISOString().split('T')[0]
  const existing = await dbFindOne(db.attendance, { studentId: student.id, groupId, date: today })
  if (existing) return res.status(400).json({ message: 'تم تسجيل الحضور مسبقاً' })
  const time = new Date().toTimeString().slice(0, 5)
  await dbInsert(db.attendance, {
    id: uuid(), studentId: student.id, studentName: student.fullName,
    groupId, groupName: group.name || '', date: today,
    status: 'Present', method: 'QRCode', checkInTime: time, centerId: cid, createdAt: new Date().toISOString()
  })
  res.json({ studentName: student.fullName, status: 'Present', checkInTime: time })
})

app.get('/api/attendance/report', auth, async (req, res) => {
  res.json({ message: 'تقرير الحضور', data: [] })
})

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
app.get('/api/payments', auth, async (req, res) => {
  const { page = 1, pageSize = 10, status, studentId } = req.query
  let all = await dbFind(db.payments, { centerId: tenantId(req) })
  if (status) all = all.filter(p => p.status === status)
  if (studentId) all = all.filter(p => p.studentId === studentId)
  all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  res.json(paginate(all, page, pageSize))
})

app.get('/api/payments/overdue', auth, async (req, res) => {
  const all = await dbFind(db.payments, { status: 'Overdue', centerId: tenantId(req) })
  res.json(all)
})

app.post('/api/payments', auth, async (req, res) => {
  const cid = tenantId(req)
  const student = await findOwned(db.students, req.body.studentId, req)
  const group = req.body.groupId ? await findOwned(db.groups, req.body.groupId, req) : null
  if (!student) return res.status(404).json({ message: 'الطالب غير موجود' })
  const doc = {
    ...safeBody(req.body), id: uuid(),
    studentName: student.fullName || req.body.studentName || '',
    groupName: group?.name || req.body.groupName || '',
    receiptNumber: `RCP-${Date.now()}`,
    status: req.body.status || 'Pending',
    centerId: cid, createdAt: new Date().toISOString()
  }
  const inserted = await dbInsert(db.payments, doc)
  res.status(201).json(inserted)
})

app.patch('/api/payments/:id/pay', auth, async (req, res) => {
  const existing = await findOwned(db.payments, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'الدفعة غير موجودة' })
  const { method } = req.query
  await dbUpdate(db.payments, { id: req.params.id }, {
    $set: { status: 'Paid', method: method || 'Cash', paidDate: new Date().toISOString().split('T')[0] }
  })
  const updated = await dbFindOne(db.payments, { id: req.params.id })
  notifyCenter(tenantId(req), {
    title: 'دفعة جديدة',
    message: `تم استلام ${updated.netAmount || 0} ج.م من ${updated.studentName || 'طالب'}`,
    type: 'success',
  }).catch(() => {})
  res.json(updated)
})

app.get('/api/payments/:id/receipt', auth, async (req, res) => {
  const p = await findOwned(db.payments, req.params.id, req)
  if (!p) return res.status(404).json({ message: 'الإيصال غير موجود' })
  res.json({ receipt: p, message: 'الإيصال' })
})

// ── EXAMS ─────────────────────────────────────────────────────────────────────
app.get('/api/exams', auth, async (req, res) => {
  const { page = 1, pageSize = 10, groupId } = req.query
  let all = await dbFind(db.exams, { centerId: tenantId(req) })
  if (groupId) all = all.filter(e => e.groupId === groupId)
  res.json(paginate(all, page, pageSize))
})

app.get('/api/exams/:id', auth, async (req, res) => {
  const e = await findOwned(db.exams, req.params.id, req)
  if (!e) return res.status(404).json({ message: 'الامتحان غير موجود' })
  res.json(e)
})

app.post('/api/exams', auth, async (req, res) => {
  const cid = tenantId(req)
  const group = req.body.groupId ? await findOwned(db.groups, req.body.groupId, req) : null
  const doc = { ...safeBody(req.body), id: uuid(), groupName: group?.name || '', resultsCount: 0, centerId: cid, createdAt: new Date().toISOString() }
  const inserted = await dbInsert(db.exams, doc)
  res.status(201).json(inserted)
})

app.put('/api/exams/:id', auth, async (req, res) => {
  const existing = await findOwned(db.exams, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'الامتحان غير موجود' })
  await dbUpdate(db.exams, { id: req.params.id }, { $set: safeBody(req.body) })
  res.json(await dbFindOne(db.exams, { id: req.params.id }))
})

app.delete('/api/exams/:id', auth, async (req, res) => {
  const existing = await findOwned(db.exams, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'الامتحان غير موجود' })
  await dbRemove(db.exams, { id: req.params.id })
  res.status(200).json({ success: true })
})

app.get('/api/exams/:id/results', auth, async (req, res) => {
  const exam = await findOwned(db.exams, req.params.id, req)
  if (!exam) return res.status(404).json({ message: 'الامتحان غير موجود' })
  const all = await dbFind(db.results, { examId: req.params.id })
  res.json(all)
})

app.post('/api/exams/:id/results', auth, async (req, res) => {
  const exam = await findOwned(db.exams, req.params.id, req)
  if (!exam) return res.status(404).json({ message: 'الامتحان غير موجود' })
  const cid = tenantId(req)
  const { results } = req.body
  for (const r of results || []) {
    const student = await findOwned(db.students, r.studentId, req)
    if (!student) continue
    await dbInsert(db.results, {
      id: uuid(), examId: req.params.id, studentId: r.studentId,
      studentName: student.fullName || '', score: r.score, grade: r.grade || '',
      feedback: r.feedback || '', isAbsent: r.isAbsent || false, centerId: cid, createdAt: new Date().toISOString()
    })
  }
  await dbUpdate(db.exams, { id: req.params.id }, { $set: { status: 'Completed', resultsCount: results?.length || 0 } })
  res.json({ success: true })
})

// ── REPORTS ───────────────────────────────────────────────────────────────────
app.get('/api/reports/revenue', auth, async (req, res) => {
  const all = await dbFind(db.payments, { status: 'Paid', centerId: tenantId(req) })
  res.json({ total: all.reduce((s, p) => s + (p.netAmount || 0), 0), items: all })
})

app.get('/api/reports/attendance', auth, async (req, res) => {
  const all = await dbFind(db.attendance, { centerId: tenantId(req) })
  res.json({ items: all, total: all.length, page: 1, pageSize: all.length, totalPages: 1 })
})

// ── SETTINGS ──────────────────────────────────────────────────────────────────
app.get('/api/settings', auth, async (req, res) => {
  const centerId = req.user.centerId || 'c1'
  const center = await dbFindOne(centersDb, { id: centerId })
  if (!center) return res.status(404).json({ message: 'المركز غير موجود' })
  res.json({
    centerName: center.name || '',
    phone: center.phone || '',
    email: center.ownerEmail || '',
    address: center.address || '',
    currency: center.currency || 'EGP',
    timezone: center.timezone || 'Africa/Cairo',
  })
})

app.put('/api/settings', auth, async (req, res) => {
  const centerId = req.user.centerId || 'c1'
  const { centerName, phone, email, address, currency, timezone } = req.body
  const center = await dbFindOne(centersDb, { id: centerId })
  if (!center) return res.status(404).json({ message: 'المركز غير موجود' })
  await dbUpdate(centersDb, { id: centerId }, { $set: {
    name: centerName ?? center.name,
    phone: phone ?? center.phone,
    ownerEmail: email ?? center.ownerEmail,
    address: address ?? center.address,
    currency: currency ?? center.currency,
    timezone: timezone ?? center.timezone,
  } })
  const updated = await dbFindOne(centersDb, { id: centerId })
  res.json({
    centerName: updated.name || '',
    phone: updated.phone || '',
    email: updated.ownerEmail || '',
    address: updated.address || '',
    currency: updated.currency || 'EGP',
    timezone: updated.timezone || 'Africa/Cairo',
    message: 'تم الحفظ',
  })
})


// ── SUPER ADMIN + CENTERS ─────────────────────────────────────────────────────
const centersDb = new Datastore({ filename: path.join(DB_DIR, 'centers.db'), autoload: true })

async function seedCenters() {
  const count = await dbCount(centersDb)
  if (count > 0) return
  await dbInsert(centersDb, {
    id: 'c1', name: 'مركز النجوم التعليمي', slug: 'stars', phone: '01000000001',
    ownerName: 'أحمد محمد السيد', ownerEmail: 'admin@educenter.com',
    activePlan: 'premium', isActive: true,
    studentsCount: 0, teachersCount: 0, groupsCount: 0, monthlyRevenue: 0,
    createdAt: new Date('2024-01-01').toISOString()
  })
}
seedCenters()

// Enrich center with live counts
async function enrichCenter(c) {
  const [students, teachers, groups, payments] = await Promise.all([
    dbCount(db.students, { centerId: c.id }),
    dbCount(db.teachers, { centerId: c.id }),
    dbCount(db.groups, { centerId: c.id }),
    dbFind(db.payments, { centerId: c.id }),
  ])
  const now = new Date(); const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const monthlyRevenue = payments.filter(p => p.status === 'Paid' && p.paidDate?.startsWith(month)).reduce((s,p)=>s+(p.netAmount||0),0)
  return { ...c, studentsCount: students, teachersCount: teachers, groupsCount: groups, monthlyRevenue }
}

app.get('/api/super-admin/dashboard', auth, requireRole('SuperAdmin'), async (req, res) => {
  const centers = await dbFind(centersDb)
  const enriched = await Promise.all(centers.map(enrichCenter))

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const allPayments = await dbFind(db.payments)
  const totalRevenue = allPayments.filter(p=>p.status==='Paid').reduce((s,p)=>s+(p.netAmount||0),0)
  const monthlyRevenue = allPayments.filter(p=>p.status==='Paid' && p.paidDate?.startsWith(thisMonth)).reduce((s,p)=>s+(p.netAmount||0),0)

  // Monthly revenue trend - last 6 months
  const revenueChart = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const revenue = allPayments.filter(p=>p.status==='Paid' && p.paidDate?.startsWith(key)).reduce((s,p)=>s+(p.netAmount||0),0)
    revenueChart.push({ month: d.toLocaleDateString('ar-EG', { month: 'short' }), revenue })
  }

  // Center growth (cumulative count of centers created up to each month) - last 6 months
  const centerGrowth = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const count = centers.filter(c => c.createdAt && c.createdAt.slice(0,7) <= key).length
    centerGrowth.push({ month: d.toLocaleDateString('ar-EG', { month: 'short' }), centers: count })
  }

  // Plan distribution (matches real plan values: free / basic / premium)
  const planOrder = ['free', 'basic', 'premium']
  const planDistribution = planOrder.map(plan => ({
    plan,
    count: centers.filter(c => (c.activePlan || 'free') === plan).length,
  }))

  res.json({
    totalCenters: centers.length,
    activeCenters: centers.filter(c=>c.isActive).length,
    totalStudents: enriched.reduce((s,c)=>s+c.studentsCount,0),
    totalTeachers: enriched.reduce((s,c)=>s+c.teachersCount,0),
    totalRevenue,
    monthlyRevenue,
    revenueChart,
    centerGrowth,
    planDistribution,
  })
})

app.get('/api/super-admin/centers', auth, requireRole('SuperAdmin'), async (req, res) => {
  const centers = await dbFind(centersDb)
  const enriched = await Promise.all(centers.map(enrichCenter))
  enriched.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
  res.json({ items: enriched, total: enriched.length, page:1, pageSize:100, totalPages:1 })
})

app.post('/api/super-admin/centers', auth, requireRole('SuperAdmin'), async (req, res) => {
  const { name, slug, ownerName, ownerEmail, ownerPassword, plan='basic', phone='' } = req.body
  const centerId = uuid()
  // Create the center
  const center = { id: centerId, name, slug, phone, ownerName, ownerEmail, activePlan: plan, isActive: true, createdAt: new Date().toISOString() }
  await dbInsert(centersDb, center)
  // Create admin user for this center
  const bcrypt = require('bcryptjs')
  const hash = bcrypt.hashSync(ownerPassword || '123456', 10)
  await dbInsert(db.users, { id: uuid(), fullName: ownerName, email: ownerEmail, password: hash, role: 'CenterAdmin', centerId, createdAt: new Date().toISOString() })
  res.json(await enrichCenter(center))
})

app.patch('/api/super-admin/centers/:id/toggle', auth, requireRole('SuperAdmin'), async (req, res) => {
  const { isActive } = req.body
  await dbUpdate(centersDb, { id: req.params.id }, { $set: { isActive } })
  res.json({ success: true })
})

app.get('/api/super-admin/centers/:id/stats', auth, requireRole('SuperAdmin'), async (req, res) => {
  const center = await dbFindOne(centersDb, { id: req.params.id })
  if (!center) return res.status(404).json({ message: 'not found' })
  res.json(await enrichCenter(center))
})

// ── TEACHER INCOME ────────────────────────────────────────────────────────────
app.get('/api/teachers/:id/income', auth, async (req, res) => {
  const { month } = req.query // format: "2026-06"
  const targetMonth = month || new Date().toISOString().slice(0,7)
  const cid = tenantId(req)
  const teacher = await findOwned(db.teachers, req.params.id, req)
  if (!teacher) return res.status(404).json({ message: 'not found' })
  // Get groups for this teacher (within the same center)
  const groups = await dbFind(db.groups, { teacherId: req.params.id, centerId: cid })
  // For each group get enrolled students count and payments this month
  const groupsWithRevenue = await Promise.all(groups.map(async (g) => {
    const enrollments = await dbFind(db.enrollments || db.students, { groupId: g.id })
    const studentsCount = g.enrolledCount || enrollments.length || 0
    const payments = await dbFind(db.payments, { groupId: g.id, centerId: cid })
    const revenue = payments
      .filter(p => p.status === 'Paid' && p.paidDate?.startsWith(targetMonth))
      .reduce((s, p) => s + (p.netAmount || 0), 0)
    // fallback: estimate from fee × students
    const estimatedRevenue = revenue || (studentsCount * (g.monthlyFee || 0))
    return { id: g.id, name: g.name, studentsCount, monthlyFee: g.monthlyFee, revenue: estimatedRevenue }
  }))
  const totalRevenue = groupsWithRevenue.reduce((s,g)=>s+g.revenue,0)
  const sharePercent = teacher.sharePercent || 70
  res.json({
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    month: targetMonth,
    sharePercent,
    groups: groupsWithRevenue,
    totalRevenue,
    teacherShare: Math.round(totalRevenue * sharePercent / 100),
    centerShare: Math.round(totalRevenue * (100 - sharePercent) / 100),
  })
})



// ── NOTIFICATIONS ENHANCED ────────────────────────────────────────────────────
const notifDb = new Datastore({ filename: path.join(DB_DIR, 'notifications.db'), autoload: true })

// Creates an in-app notification (shown in the bell/notifications page).
async function notifyCenter(centerId, { title, message, type = 'info' }) {
  await dbInsert(notifDb, { id: uuid(), title, message, type, isRead: false, centerId, createdAt: new Date().toISOString() })
}

// Seed some notifications
async function seedNotifications() {
  const count = await dbCount(notifDb)
  if (count > 0) return
  const sample = [
    { title: 'طالب جديد مسجل', message: 'تم تسجيل الطالب محمد علي في مجموعة رياضيات ثانوي أ', type: 'success', isRead: false },
    { title: 'دفعة متأخرة', message: '5 طلاب لم يسددوا رسوم شهر يونيو', type: 'warning', isRead: false },
    { title: 'حضور منخفض', message: 'نسبة الحضور أقل من المعدل هذا الأسبوع', type: 'warning', isRead: true },
    { title: 'امتحان قادم', message: 'امتحان الرياضيات بعد 3 أيام - ثانوي أ', type: 'info', isRead: true },
    { title: 'تقرير شهري جاهز', message: 'تقرير شهر مايو جاهز للتحميل', type: 'info', isRead: true },
  ]
  for (const n of sample) {
    await dbInsert(notifDb, { id: uuid(), ...n, centerId: 'c1', createdAt: new Date(Date.now() - Math.random()*7*86400000).toISOString() })
  }
}
seedNotifications()

app.get('/api/notifications', auth, async (req, res) => {
  const { isRead, pageSize = 20 } = req.query
  let query = { centerId: tenantId(req) }
  if (isRead === 'false') query.isRead = false
  const all = await dbFind(notifDb, query)
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json({ items: all.slice(0, parseInt(pageSize)), total: all.length, page: 1, totalPages: 1 })
})

app.patch('/api/notifications/mark-all-read', auth, async (req, res) => {
  await dbUpdate(notifDb, { centerId: tenantId(req) }, { $set: { isRead: true } }, { multi: true })
  res.json({ success: true })
})

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  const notif = await dbFindOne(notifDb, { id: req.params.id })
  if (!notif || notif.centerId !== tenantId(req)) return res.status(404).json({ message: 'غير موجود' })
  await dbUpdate(notifDb, { id: req.params.id }, { $set: { isRead: true } })
  res.json({ success: true })
})

// ── PARENTS ───────────────────────────────────────────────────────────────────
const parentsDb = new Datastore({ filename: path.join(DB_DIR, 'parents.db'), autoload: true })

async function seedParents() {
  const count = await dbCount(parentsDb)
  if (count > 0) return
  const names = ['سيد محمد علي','حسن إبراهيم يوسف','عبد الله محمود','طارق عمر سعد','وليد أحمد حسن']
  for (let i=0; i<5; i++) {
    await dbInsert(parentsDb, {
      id: uuid(), fullName: names[i], phone: `0111${String(i).padStart(7,'0')}`,
      email: `parent${i+1}@gmail.com`, studentName: `الطالب ${i+1}`,
      occupation: ['مهندس','طبيب','معلم','محاسب','تاجر'][i],
      isActive: true, centerId: 'c1', createdAt: new Date().toISOString()
    })
  }
}
seedParents()

app.get('/api/parents', auth, async (req, res) => {
  const { page=1, pageSize=10, search='' } = req.query
  let all = await dbFind(parentsDb, { centerId: tenantId(req) })
  if (search) all = all.filter((p) => p.fullName?.includes(search) || p.phone?.includes(search))
  res.json(paginate(all, page, pageSize))
})

app.post('/api/parents', auth, async (req, res) => {
  const parent = { id: uuid(), ...safeBody(req.body), centerId: tenantId(req), createdAt: new Date().toISOString() }
  await dbInsert(parentsDb, parent)
  res.json(parent)
})

app.put('/api/parents/:id', auth, async (req, res) => {
  const existing = await findOwned(parentsDb, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'غير موجود' })
  await dbUpdate(parentsDb, { id: req.params.id }, { $set: safeBody(req.body) })
  res.json({ success: true })
})

app.delete('/api/parents/:id', auth, async (req, res) => {
  const existing = await findOwned(parentsDb, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'غير موجود' })
  await dbRemove(parentsDb, { id: req.params.id })
  res.json({ success: true })
})

// ── EXPENSES ──────────────────────────────────────────────────────────────────
const expensesDb = new Datastore({ filename: path.join(DB_DIR, 'expenses.db'), autoload: true })

async function seedExpenses() {
  const count = await dbCount(expensesDb)
  if (count > 0) return
  const categories = ['إيجار','رواتب','كهرباء','مستلزمات','صيانة']
  for (let i=0; i<8; i++) {
    const cat = categories[i % categories.length]
    await dbInsert(expensesDb, {
      id: uuid(), title: `${cat} - ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس'][i]}`,
      category: cat, amount: (1+i)*800, date: new Date(2026, i%6, 1).toISOString(),
      notes: '', centerId: 'c1', createdAt: new Date().toISOString()
    })
  }
}
seedExpenses()

app.get('/api/expenses', auth, async (req, res) => {
  const { page=1, pageSize=10 } = req.query
  const all = await dbFind(expensesDb, { centerId: tenantId(req) })
  all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  res.json(paginate(all, page, pageSize))
})

app.post('/api/expenses', auth, async (req, res) => {
  const expense = { id: uuid(), ...safeBody(req.body), centerId: tenantId(req), createdAt: new Date().toISOString() }
  await dbInsert(expensesDb, expense)
  res.json(expense)
})

app.delete('/api/expenses/:id', auth, async (req, res) => {
  const existing = await findOwned(expensesDb, req.params.id, req)
  if (!existing) return res.status(404).json({ message: 'غير موجود' })
  await dbRemove(expensesDb, { id: req.params.id })
  res.json({ success: true })
})

// ── SUPER ADMIN ENHANCED ──────────────────────────────────────────────────────
app.get('/api/super-admin/audit-logs', auth, requireRole('SuperAdmin'), async (req, res) => {
  const { page=1, pageSize=15 } = req.query
  // Generate synthetic audit logs from recent actions
  const logs = [
    { id:uuid(), action:'POST /students', resource:'Students', userEmail:'admin@educenter.com', status:201, ipAddress:'192.168.1.1', centerId:'c1', createdAt: new Date(Date.now()-1000*60*5).toISOString() },
    { id:uuid(), action:'GET /dashboard', resource:'Dashboard', userEmail:'admin@educenter.com', status:200, ipAddress:'192.168.1.1', centerId:'c1', createdAt: new Date(Date.now()-1000*60*15).toISOString() },
    { id:uuid(), action:'PATCH /payments/:id/pay', resource:'Payments', userEmail:'admin@educenter.com', status:200, ipAddress:'192.168.1.1', centerId:'c1', createdAt: new Date(Date.now()-1000*60*30).toISOString() },
    { id:uuid(), action:'POST /attendance/qr', resource:'Attendance', userEmail:'admin@educenter.com', status:200, ipAddress:'192.168.1.1', centerId:'c1', createdAt: new Date(Date.now()-1000*60*60).toISOString() },
    { id:uuid(), action:'DELETE /students/:id', resource:'Students', userEmail:'admin@educenter.com', status:200, ipAddress:'192.168.1.1', centerId:'c1', createdAt: new Date(Date.now()-1000*60*90).toISOString() },
  ]
  res.json(paginate(logs, page, pageSize))
})

app.get('/api/super-admin/subscriptions', auth, requireRole('SuperAdmin'), async (req, res) => {
  const { page=1, pageSize=10 } = req.query
  const subs = [
    { id:'s1', centerName:'مركز النجوم التعليمي', plan:'premium', startDate:'2026-01-01', endDate:'2026-12-31', amount:4800, status:'active' },
    { id:'s2', centerName:'مركز الفاروق', plan:'basic', startDate:'2026-03-01', endDate:'2026-08-31', amount:1200, status:'active' },
    { id:'s3', centerName:'مركز النور', plan:'basic', startDate:'2025-06-01', endDate:'2025-12-31', amount:1200, status:'expired' },
  ]
  res.json(paginate(subs, page, pageSize))
})

// ── Catch-all ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`⚠️  ${req.method} ${req.url}`)
  res.json({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 })
})

// ── Start ─────────────────────────────────────────────────────────────────────
seed().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ EduCenter Pro Backend شغال على http://localhost:${PORT}`)
    console.log(`📧 مدير مركز: admin@educenter.com / 123456`)
    console.log(`📧 مدير المنصة (Super Admin): superadmin@educenter.com / 123456\n`)
  })
})
