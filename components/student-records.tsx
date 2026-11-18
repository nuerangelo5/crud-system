'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowDownUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react'

type Student = {
  id: number
  student_id: string
  first_name: string
  last_name: string
  program: string
  year_level: number
  email: string
  created_at: string
}

type StudentForm = Omit<Student, 'id' | 'created_at'>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
const emptyForm: StudentForm = { student_id: '', first_name: '', last_name: '', program: '', year_level: 1, email: '' }
const pageSize = 8

function initials(student: Student) {
  return `${student.first_name[0] ?? ''}${student.last_name[0] ?? ''}`.toUpperCase()
}

export function StudentRecords() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Student | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<StudentForm>(emptyForm)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadStudents = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      setNotice({ type: 'error', text: 'Supabase configuration is missing. Check the project environment variables.' })
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('students').select('id, student_id, first_name, last_name, program, year_level, email, created_at').order('created_at', { ascending: false })
    if (error) setNotice({ type: 'error', text: `Could not load students: ${error.message}` })
    else setStudents((data ?? []) as Student[])
    setLoading(false)
  }, [])

  useEffect(() => { void loadStudents() }, [loadStudents])

  const filtered = useMemo(() => students.filter((student) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [student.student_id, student.first_name, student.last_name, student.program, student.email].some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (yearFilter === 'all' || String(student.year_level) === yearFilter)
  }), [students, search, yearFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visibleStudents = filtered.slice((page - 1) * pageSize, page * pageSize)
  const programs = new Set(students.map((student) => student.program)).size
  const freshmen = students.filter((student) => student.year_level === 1).length

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
    setNotice(null)
  }

  function openEdit(student: Student) {
    setFormOpen(true)
    setEditing(student)
    setForm({ student_id: student.student_id, first_name: student.first_name, last_name: student.last_name, program: student.program, year_level: student.year_level, email: student.email })
    setNotice(null)
  }

  async function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setNotice(null)
    const payload = { ...form, student_id: form.student_id.trim(), first_name: form.first_name.trim(), last_name: form.last_name.trim(), program: form.program.trim(), email: form.email.trim().toLowerCase() }
    const result = editing
      ? await supabase.from('students').update(payload).eq('id', editing.id)
      : await supabase.from('students').insert(payload)
    setSaving(false)
    if (result.error) {
      setNotice({ type: 'error', text: result.error.code === '23505' ? 'That student ID already exists. Please use a unique ID.' : `Could not save student: ${result.error.message}` })
      return
    }
    setNotice({ type: 'success', text: editing ? 'Student record updated.' : 'Student added to your records.' })
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(false)
    await loadStudents()
  }

  async function deleteStudent(student: Student) {
    if (!supabase || !window.confirm(`Delete ${student.first_name} ${student.last_name} (${student.student_id})? This cannot be undone.`)) return
    const { error } = await supabase.from('students').delete().eq('id', student.id)
    if (error) setNotice({ type: 'error', text: `Could not delete student: ${error.message}` })
    else {
      setNotice({ type: 'success', text: `${student.first_name} ${student.last_name} was removed.` })
      await loadStudents()
    }
  }

  function setField<K extends keyof StudentForm>(key: K, value: StudentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Campus Desk home">
          <span className="brand-mark"><GraduationCap size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">campus<span>desk</span></span>
        </a>
        <div className="topbar-right">
          <span className="workspace-label"><span className="status-dot" /> Student records</span>
          <span className="avatar">AD</span>
        </div>
      </header>

      <div className="dashboard-content" id="top">
        <div className="page-heading">
          <div>
            <div className="eyebrow"><BookOpen size={14} /> ACADEMIC SERVICES <span>/</span> DIRECTORY</div>
            <h1>Student records</h1>
            <p className="page-subtitle">A clear view of your students, all in one place.</p>
          </div>
          <button className="primary-button heading-add" type="button" onClick={openNew}><Plus size={17} /> Add student</button>
        </div>

        <div className="demo-warning"><ShieldAlert size={16} /><span><strong>Classroom demo:</strong> this directory is publicly accessible. Use sample or fictional student information only.</span></div>

        {notice && <div className={`notice notice-${notice.type}`} role="status"><span>{notice.type === 'success' ? <Check size={16} /> : <ShieldAlert size={16} />}{notice.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={16} /></button></div>}

        <section className="stats-grid" aria-label="Student overview">
          <article className="stat-card"><span className="stat-icon lavender"><Users size={18} /></span><div><span className="stat-label">Total students</span><strong>{students.length}</strong></div><span className="stat-note">in directory</span></article>
          <article className="stat-card"><span className="stat-icon mint"><BookOpen size={18} /></span><div><span className="stat-label">Programs</span><strong>{programs}</strong></div><span className="stat-note">represented</span></article>
          <article className="stat-card"><span className="stat-icon peach"><GraduationCap size={18} /></span><div><span className="stat-label">First year</span><strong>{freshmen}</strong></div><span className="stat-note">students</span></article>
        </section>

        <section className="records-card" aria-labelledby="directory-title">
          <div className="records-heading">
            <div><h2 id="directory-title">Directory</h2><p>Manage your student information and records.</p></div>
            <div className="records-tools">
              <label className="search-box"><Search size={16} /><span className="sr-only">Search students</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search students..." /></label>
              <label className="filter-box"><span className="sr-only">Filter by year</span><select value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); setPage(1) }}><option value="all">All years</option><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></select><ChevronDown size={15} /></label>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>STUDENT <ArrowDownUp size={12} /></th><th>PROGRAM</th><th>YEAR LEVEL</th><th>EMAIL ADDRESS</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="table-state"><LoaderCircle size={20} className="spin" /> Loading student records...</td></tr> : visibleStudents.length ? visibleStudents.map((student) => <tr key={student.id}>
                  <td><div className="student-cell"><span className="student-avatar">{initials(student)}</span><span><strong>{student.first_name} {student.last_name}</strong><small>{student.student_id}</small></span></div></td>
                  <td><span className="program-name">{student.program}</span></td>
                  <td><span className="year-pill">Year {student.year_level}</span></td>
                  <td><a className="email-link" href={`mailto:${student.email}`}><Mail size={14} />{student.email}</a></td>
                  <td><div className="row-actions"><button type="button" aria-label={`Edit ${student.first_name} ${student.last_name}`} onClick={() => openEdit(student)}><Pencil size={15} /></button><button type="button" aria-label={`Delete ${student.first_name} ${student.last_name}`} className="delete-action" onClick={() => void deleteStudent(student)}><Trash2 size={15} /></button></div></td>
                </tr>) : <tr><td colSpan={5} className="empty-state"><span className="empty-icon"><Users size={21} /></span><strong>{search || yearFilter !== 'all' ? 'No matching students' : 'No student records yet'}</strong><span>{search || yearFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Add your first student to get started.'}</span>{!search && yearFilter === 'all' && <button type="button" className="text-button" onClick={openNew}><Plus size={15} /> Add a student</button>}</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="table-footer"><span>Showing <strong>{filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> students</span><div className="pagination"><button type="button" disabled={page <= 1} aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /></button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} aria-label="Next page" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={16} /></button></div></footer>
        </section>
        <div className="page-footnote">Student Record Management System <span>•</span> Systems Analysis &amp; Design Lab</div>
      </div>

      {formOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditing(null); setForm(emptyForm); setFormOpen(false) } }}>
        <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <div className="modal-heading"><div><span className="modal-kicker">STUDENT DIRECTORY</span><h2 id="form-title">{editing ? 'Edit student' : 'Add a student'}</h2><p>{editing ? 'Update the details for this student.' : 'Enter the student details below to create a record.'}</p></div><button type="button" aria-label="Close form" className="close-button" onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(false) }}><X size={18} /></button></div>
          {notice?.type === 'error' && <div className="form-error" role="alert">{notice.text}</div>}
          <form onSubmit={(event) => void submitStudent(event)} className="student-form">
            <label>Student ID<input required maxLength={30} value={form.student_id} onChange={(event) => setField('student_id', event.target.value)} placeholder="e.g. 2024-001" /></label>
            <div className="form-row"><label>First name<input required maxLength={100} value={form.first_name} onChange={(event) => setField('first_name', event.target.value)} placeholder="First name" /></label><label>Last name<input required maxLength={100} value={form.last_name} onChange={(event) => setField('last_name', event.target.value)} placeholder="Last name" /></label></div>
            <label>Academic program<input required maxLength={120} value={form.program} onChange={(event) => setField('program', event.target.value)} placeholder="e.g. BS Information Technology" /></label>
            <div className="form-row"><label>Year level<select value={form.year_level} onChange={(event) => setField('year_level', Number(event.target.value))}><option value={1}>1st Year</option><option value={2}>2nd Year</option><option value={3}>3rd Year</option><option value={4}>4th Year</option></select></label><label>Email address<input required type="email" maxLength={255} value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="student@school.edu" /></label></div>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(false) }}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <><LoaderCircle size={16} className="spin" /> Saving...</> : editing ? <><Check size={16} /> Save changes</> : <><Plus size={16} /> Add student</>}</button></div>
          </form>
        </section>
      </div>}
    </main>
  )
}
