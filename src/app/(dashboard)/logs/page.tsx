'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'
import { format, subDays } from 'date-fns'

interface User {
  id: string
  name: string
}

interface Comment {
  id: string
  content: string
  user: User
  createdAt: string
}

interface WorkLog {
  id: string
  date: string
  content: string
  status: string
  user: User
  comments: Comment[]
  updatedAt: string
}

export default function LogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterUser) params.set('userId', filterUser)
    if (filterDate) params.set('date', filterDate)
    fetch(`/api/logs?${params}`).then((r) => r.json()).then((d) => {
      setLogs(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [filterUser, filterDate])

  const isAdmin = session?.user.role === 'ADMIN'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">업무일지 목록</h1>
        <Link
          href="/logs/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + 일지 작성
        </Link>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 bg-white rounded-2xl border border-gray-200 p-4">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
        {(filterDate || filterUser) && (
          <button
            onClick={() => { setFilterDate(''); setFilterUser('') }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            초기화
          </button>
        )}
      </div>

      {/* 일지 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
          업무일지가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-semibold text-gray-800">{log.user.name}</span>
                  <span className="text-sm text-gray-400 ml-2">{formatDate(log.date)}</span>
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
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{log.content}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  댓글 {log.comments.length}개
                </span>
                <div className="flex gap-2">
                  {(log.user.id === session?.user.id || isAdmin) && (
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
      )}
    </div>
  )
}
