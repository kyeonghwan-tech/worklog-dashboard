'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { todayStr } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string | null
}

const ABSENCE_TYPES = [
  { value: 'FULL_DAY', label: '연차' },
  { value: 'HALF_DAY_AM', label: '오전 반차' },
  { value: 'HALF_DAY_PM', label: '오후 반차' },
]

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER', department: '' })
  const [absenceModal, setAbsenceModal] = useState<User | null>(null)
  const [absenceDate, setAbsenceDate] = useState(todayStr())
  const [absenceType, setAbsenceType] = useState('FULL_DAY')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') router.push('/')
  }, [session, router])

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : []))
  }, [])

  async function saveUser() {
    setError('')
    setSaving(true)
    if (editUser) {
      const body: Record<string, string> = {}
      if (form.name) body.name = form.name
      if (form.role) body.role = form.role
      if (form.department !== undefined) body.department = form.department
      if (form.password) body.password = form.password

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        closeForm()
      } else {
        const d = await res.json()
        setError(d.error || '수정 실패')
      }
    } else {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const user = await res.json()
        setUsers((prev) => [...prev, user])
        closeForm()
      } else {
        const d = await res.json()
        setError(d.error || '생성 실패')
      }
    }
    setSaving(false)
  }

  async function deleteUser(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  async function setAbsence() {
    setSaving(true)
    await fetch('/api/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: absenceModal?.id, date: absenceDate, type: absenceType }),
    })
    setAbsenceModal(null)
    setSaving(false)
  }

  function openEdit(user: User) {
    setEditUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department || '' })
    setShowForm(true)
    setError('')
  }

  function closeForm() {
    setShowForm(false)
    setEditUser(null)
    setForm({ name: '', email: '', password: '', role: 'MEMBER', department: '' })
    setError('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">팀원 관리</h1>
        <button
          onClick={() => { closeForm(); setShowForm(true) }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          + 팀원 추가
        </button>
      </div>

      {/* 팀원 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">이메일</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">역할</th>
              <th className="text-right px-5 py-3 font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">
                  {user.name}
                  {user.department && <span className="ml-1 text-xs text-gray-400">{user.department}</span>}
                </td>
                <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'ADMIN' ? '팀장' : '팀원'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setAbsenceModal(user); setAbsenceDate(todayStr()) }}
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      부재설정
                    </button>
                    <button onClick={() => openEdit(user)} className="text-xs text-indigo-600 hover:underline">수정</button>
                    <button onClick={() => deleteUser(user.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 팀원 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg text-gray-900">{editUser ? '팀원 수정' : '팀원 추가'}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {!editUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 {editUser && <span className="font-normal text-gray-400">(변경 시만 입력)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editUser ? '변경할 비밀번호' : '초기 비밀번호'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="예: 편집1팀"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MEMBER">팀원</option>
                <option value="ADMIN">팀장</option>
              </select>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={closeForm} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={saveUser}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부재 설정 모달 */}
      {absenceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg text-gray-900">{absenceModal.name} 부재 설정</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <input
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
              <select
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ABSENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setAbsenceModal(null)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={setAbsence}
                disabled={saving}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                설정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
