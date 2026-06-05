'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatDate, formatDateTime, todayStr } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface User { id: string; name: string }
interface Comment { id: string; content: string; user: User; createdAt: string }
interface WorkLog {
  id: string; date: string; content: string; status: string
  user: User; comments: Comment[]; updatedAt: string
}

type Preset = 'today' | 'week' | 'month' | 'lastMonth' | 'custom'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'lastMonth', label: '지난 달' },
  { value: 'custom', label: '직접 입력' },
]

function getPresetDates(preset: Preset): { start: string; end: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (preset) {
    case 'today':
      return { start: fmt(today), end: fmt(today) }
    case 'week': {
      const day = today.getDay()
      const mon = new Date(today); mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { start: fmt(mon), end: fmt(sun) }
    }
    case 'month':
      return { start: fmt(startOfMonth(today)), end: fmt(endOfMonth(today)) }
    case 'lastMonth': {
      const last = subMonths(today, 1)
      return { start: fmt(startOfMonth(last)), end: fmt(endOfMonth(last)) }
    }
    default:
      return { start: '', end: '' }
  }
}

export default function LogsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user.role === 'ADMIN'

  const [logs, setLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  const [preset, setPreset] = useState<Preset>('month')
  const [startDate, setStartDate] = useState(() => getPresetDates('month').start)
  const [endDate, setEndDate] = useState(() => getPresetDates('month').end)
  const [filterUser, setFilterUser] = useState('')

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/users').then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : []))
    }
  }, [isAdmin])

  const fetchLogs = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (isAdmin && filterUser) params.set('userId', filterUser)

    fetch(`/api/logs?${params}`)
      .then((r) => r.json())
      .then((d) => { setLogs(Array.isArray(d) ? d : []); setLoading(false) })
  }, [startDate, endDate, filterUser, isAdmin])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function applyPreset(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      const { start, end } = getPresetDates(p)
      setStartDate(start)
      setEndDate(end)
    }
  }

  function resetFilters() {
    setPreset('month')
    const { start, end } = getPresetDates('month')
    setStartDate(start)
    setEndDate(end)
    setFilterUser('')
  }

  // 날짜별로 그룹핑
  const groupedByDate: Record<string, WorkLog[]> = {}
  for (const log of logs) {
    if (!groupedByDate[log.date]) groupedByDate[log.date] = []
    groupedByDate[log.date].push(log)
  }
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">업무일지 조회</h1>
        <Link
          href="/logs/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + 일지 작성
        </Link>
      </div>

      {/* 필터 패널 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 mr-1">기간:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                preset === p.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPreset('custom') }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPreset('custom') }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isAdmin && (
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">전체 팀원</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={resetFilters}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            초기화
          </button>
        </div>

        {/* 결과 요약 */}
        <div className="flex items-center gap-4 pt-1 border-t border-gray-100 text-sm text-gray-500">
          <span>총 <strong className="text-gray-800">{logs.length}</strong>건</span>
          <span>제출 <strong className="text-green-600">{logs.filter(l => l.status === 'SUBMITTED').length}</strong>건</span>
          <span>임시저장 <strong className="text-gray-500">{logs.filter(l => l.status === 'DRAFT').length}</strong>건</span>
        </div>
      </div>

      {/* 일지 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
          조회된 업무일지가 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-600">{formatDate(date)}</h2>
                <span className="text-xs text-gray-400">{groupedByDate[date].length}건</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-3">
                {groupedByDate[date].map((log) => (
                  <div key={log.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                          {log.user.name[0]}
                        </div>
                        <span className="font-semibold text-gray-800">{log.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.status === 'SUBMITTED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {log.status === 'SUBMITTED' ? '제출' : '임시저장'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDateTime(log.updatedAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4 bg-gray-50 rounded-xl px-4 py-3">
                      {log.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">댓글 {log.comments.length}개</span>
                      <div className="flex gap-3">
                        {(isAdmin || (log.user.id === session?.user.id && log.date === todayStr())) && (
                          <Link href={`/logs/edit/${log.id}`} className="text-xs text-gray-500 hover:text-gray-700">
                            수정
                          </Link>
                        )}
                        <Link href={`/logs/${log.id}`} className="text-xs text-indigo-600 hover:underline">
                          상세보기 →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
