'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

interface User { id: string; name: string }
interface WorkLog { id: string; date: string; user: User; status: string }

export default function CalendarPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') router.push('/')
  }, [session, router])

  useEffect(() => {
    setLoading(true)
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    // 해당 월 전체 일지 로드
    fetch(`/api/logs/range?start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [currentMonth])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startWeekday = getDay(startOfMonth(currentMonth)) // 0=일

  // 날짜별 일지 맵
  const logsByDate: Record<string, WorkLog[]> = {}
  for (const log of logs) {
    if (!logsByDate[log.date]) logsByDate[log.date] = []
    logsByDate[log.date].push(log)
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  function openLog(logId: string) {
    window.open(`/logs/${logId}`, '_blank', 'noopener,noreferrer')
  }

  if (session?.user.role !== 'ADMIN') return null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">업무일지 캘린더</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            ‹
          </button>
          <span className="font-semibold text-gray-800 min-w-[100px] text-center">
            {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            오늘
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekdays.map((d, i) => (
              <div
                key={d}
                className={`py-2.5 text-center text-sm font-semibold ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {/* 첫 주 빈칸 */}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-100 bg-gray-50/50" />
            ))}

            {days.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayLogs = logsByDate[dateStr] || []
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
              const dayOfWeek = getDay(day)
              const col = (startWeekday + idx) % 7

              return (
                <div
                  key={dateStr}
                  className={`min-h-[100px] border-r border-b border-gray-100 p-1.5 ${
                    col === 0 ? 'bg-red-50/30' : col === 6 ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : col === 0
                      ? 'text-red-500'
                      : col === 6
                      ? 'text-blue-500'
                      : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayLogs
                      .filter((l) => l.status === 'SUBMITTED')
                      .map((log) => (
                        <button
                          key={log.id}
                          onClick={() => openLog(log.id)}
                          className="w-full text-left text-xs px-1.5 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 truncate transition-colors"
                          title={`${log.user.name} - 클릭하여 일지 보기`}
                        >
                          {log.user.name}
                        </button>
                      ))}
                    {dayLogs.filter((l) => l.status === 'DRAFT').map((log) => (
                      <button
                        key={log.id}
                        onClick={() => openLog(log.id)}
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 truncate transition-colors"
                        title={`${log.user.name} (임시저장) - 클릭하여 일지 보기`}
                      >
                        {log.user.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="flex gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-100 inline-block" />
          제출 완료
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 inline-block" />
          임시저장
        </div>
      </div>
    </div>
  )
}
