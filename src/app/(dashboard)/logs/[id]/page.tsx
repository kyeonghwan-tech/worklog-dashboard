'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'

interface User { id: string; name: string }
interface Comment { id: string; content: string; user: User; createdAt: string }
interface WorkLog {
  id: string; date: string; content: string; status: string
  user: User; comments: Comment[]; updatedAt: string
}

export default function LogDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [log, setLog] = useState<WorkLog | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/logs?`)
      .then((r) => r.json())
      .then((logs: WorkLog[]) => {
        const found = logs.find((l) => l.id === params.id)
        if (found) setLog(found)
      })
  }, [params.id])

  async function submitComment() {
    if (!comment.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workLogId: params.id, content: comment }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setLog((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev)
      setComment('')
    }
    setSubmitting(false)
  }

  async function deleteLog() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/logs/${params.id}`, { method: 'DELETE' })
    router.push('/logs')
  }

  if (!log) return <div className="text-center py-12 text-gray-400">불러오는 중...</div>

  const canEdit = log.user.id === session?.user.id || session?.user.role === 'ADMIN'

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/logs" className="text-gray-400 hover:text-gray-600 text-sm">← 목록</Link>
        <h1 className="text-xl font-bold text-gray-900">업무일지 상세</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">{log.user.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{formatDate(log.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              log.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {log.status === 'SUBMITTED' ? '제출' : '임시저장'}
            </span>
            {canEdit && (
              <div className="flex gap-2">
                <Link href={`/logs/edit/${log.id}`} className="text-xs text-indigo-600 hover:underline">수정</Link>
                <button onClick={deleteLog} className="text-xs text-red-400 hover:text-red-600">삭제</button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {log.content}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">수정: {formatDateTime(log.updatedAt)}</p>
      </div>

      {/* 댓글 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">댓글 {log.comments.length}개</h3>
        <div className="space-y-3 mb-5">
          {log.comments.length === 0 ? (
            <p className="text-sm text-gray-400">아직 댓글이 없습니다.</p>
          ) : (
            log.comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                  {c.user.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800">{c.user.name}</span>
                    {session?.user.role === 'ADMIN' && (
                      <span className="text-xs text-indigo-500">팀장</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
            placeholder="댓글을 입력하세요..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={submitComment}
            disabled={submitting || !comment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
