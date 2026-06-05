'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { todayStr } from '@/lib/utils'

const ABSENCE_TYPES = [
  { value: 'FULL_DAY', label: '연차' },
  { value: 'HALF_DAY_AM', label: '오전 반차' },
  { value: 'HALF_DAY_PM', label: '오후 반차' },
]

export default function ProfilePage() {
  const { data: session } = useSession()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const [absenceDate, setAbsenceDate] = useState(todayStr())
  const [absenceType, setAbsenceType] = useState('FULL_DAY')
  const [absenceSuccess, setAbsenceSuccess] = useState(false)

  async function changePassword() {
    setPwError('')
    setPwSuccess(false)
    if (password.length < 6) { setPwError('비밀번호는 6자 이상이어야 합니다.'); return }
    if (password !== confirm) { setPwError('비밀번호가 일치하지 않습니다.'); return }
    setSaving(true)
    const res = await fetch(`/api/users/${session?.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setPwSuccess(true)
      setPassword('')
      setConfirm('')
    } else {
      const d = await res.json()
      setPwError(d.error || '변경 실패')
    }
    setSaving(false)
  }

  async function requestAbsence() {
    setAbsenceSuccess(false)
    await fetch('/api/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: absenceDate, type: absenceType }),
    })
    setAbsenceSuccess(true)
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">내 정보</h1>

      {/* 프로필 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
            {session?.user.name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session?.user.name}</p>
            <p className="text-sm text-gray-500">{session?.user.email}</p>
            <p className="text-xs mt-0.5">
              <span className={`px-2 py-0.5 rounded-full ${
                session?.user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {session?.user.role === 'ADMIN' ? '팀장' : '팀원'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">비밀번호 변경</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {pwError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{pwError}</div>}
        {pwSuccess && <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl">비밀번호가 변경되었습니다.</div>}
        <button
          onClick={changePassword}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
        >
          변경하기
        </button>
      </div>

      {/* 부재 신청 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">부재 신청</h2>
        <p className="text-sm text-gray-500">연차 또는 반차 사용 시 부재 설정을 해주세요.</p>
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
        {absenceSuccess && <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl">부재가 설정되었습니다.</div>}
        <button
          onClick={requestAbsence}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium"
        >
          부재 신청
        </button>
      </div>
    </div>
  )
}
