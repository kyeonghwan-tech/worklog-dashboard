'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate, todayStr, formatDateTime } from '@/lib/utils'

interface User {
  id: string
  name: string
  role: string
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

interface Absence {
  id: string
  date: string
  type: string
  user: User
}

const ABSENCE_LABELS: Record<string, string> = {
  FULL_DAY: '연차',
  HALF_DAY_AM: '오전 반차',
  HALF_DAY_PM: '오후 반차',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const today = todayStr()

  useEffect(() => {
    Promise.all([
      fetch(`/api/logs?date=${today}`).then((r) => r.json()),
      fetch(`/api/absences?date=${today}`).then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
    ]).then(([logsData, absencesData, usersData]) => {
      setLogs(Array.isArray(logsData) ? logsData : [])
      setAbsences(Array.isArray(absencesData) ? absencesData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setLoading(false)
    })
  }, [today])

  const myLog = logs.find((l) => l.user.id === session?.user.id)
  const absentUserIds = new Set(absences.map((a) => a.user.id))
  const submittedUserIds = new Set(logs.filter((l) => l.status === 'SUBMITTED').map((l) => l.user.id))
  const missingUsers = users.filter((u) => !absentUserIds.has(u.id) && !submittedUserIds.has(u.id))

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">불러오는 중...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">오늘의 현황</h1>
        <p className="text-gray-500 mt-1 text-sm">{formatDate(today)}</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="전체 팀원" value={users.length} color="gray" />
        <StatCard label="일지 제출" value={submittedUserIds.size} color="green" />
        <StatCard label="부재중" value={absences.length} color="yellow" />
        <StatCard label="미작성" value={missingUsers.length} color="red" />
      </div>

      {/* 내 일지 상태 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">내 오늘 업무일지</h2>
          {myLog ? (
            <Link href={`/logs/edit/${myLog.id}`} className="text-sm text-indigo-600 hover:underline">
              수정
            </Link>
          ) : (
            <Link href="/logs/new" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
              작성하기
            </Link>
          )}
        </div>
        {myLog ? (
          <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
            {myLog.content}
          </div>
        ) : absentUserIds.has(session?.user.id || '') ? (
          <p className="text-sm text-yellow-600">오늘 부재중으로 설정되어 있습니다.</p>
        ) : (
          <p className="text-sm text-red-500">아직 오늘 업무일지를 작성하지 않으셨습니다.</p>
        )}
      </div>

      {/* 팀 현황 - 어드민만 */}
      {session?.user.role === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">팀 현황</h2>
          <div className="space-y-2">
            {users.map((user) => {
              const log = logs.find((l) => l.user.id === user.id)
              const absence = absences.find((a) => a.user.id === user.id)
              return (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  {absence ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      {ABSENCE_LABELS[absence.type]}
                    </span>
                  ) : log?.status === 'SUBMITTED' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">제출완료</span>
                  ) : log ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">임시저장</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">미작성</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 오늘 제출된 일지 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">오늘 제출된 일지</h2>
          <Link href="/logs" className="text-sm text-indigo-600 hover:underline">전체보기</Link>
        </div>
        <div className="space-y-4">
          {logs.filter((l) => l.status === 'SUBMITTED').length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">아직 제출된 일지가 없습니다.</p>
          ) : (
            logs
              .filter((l) => l.status === 'SUBMITTED')
              .map((log) => (
                <div key={log.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-800">{log.user.name}</span>
                    <span className="text-xs text-gray-400">{formatDateTime(log.updatedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{log.content}</p>
                  {log.comments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">댓글 {log.comments.length}개</p>
                    </div>
                  )}
                  <Link href={`/logs/${log.id}`} className="text-xs text-indigo-500 hover:underline mt-1 block">
                    상세보기 →
                  </Link>
                </div>
              ))
          )}
        </div>
      </div>

      {/* 부재 현황 */}
      {absences.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <h2 className="font-semibold text-yellow-800 mb-3">오늘 부재 현황</h2>
          <div className="space-y-1">
            {absences.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-yellow-700">
                <span>•</span>
                <span className="font-medium">{a.user.name}</span>
                <span className="text-yellow-600">({ABSENCE_LABELS[a.type]})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-600',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
