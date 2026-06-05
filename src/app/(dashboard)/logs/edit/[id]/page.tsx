'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface WorkLog { id: string; date: string; content: string; status: string }

export default function EditLogPage() {
  const params = useParams()
  const router = useRouter()
  const [log, setLog] = useState<WorkLog | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/logs').then((r) => r.json()).then((logs: WorkLog[]) => {
      const found = logs.find((l) => l.id === params.id)
      if (found) { setLog(found); setContent(found.content) }
    })
  }, [params.id])

  async function handleSubmit(status: 'DRAFT' | 'SUBMITTED') {
    if (!content.trim()) { setError('내용을 입력해주세요.'); return }
    setSubmitting(true)
    const res = await fetch(`/api/logs/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, status }),
    })
    if (res.ok) {
      router.push('/logs')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || '저장 실패')
      setSubmitting(false)
    }
  }

  if (!log) return <div className="text-center py-12 text-gray-400">불러오는 중...</div>

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/logs" className="text-gray-400 hover:text-gray-600 text-sm">← 목록</Link>
        <h1 className="text-xl font-bold text-gray-900">업무일지 수정</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input
            type="date"
            value={log.date}
            readOnly
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">업무 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => handleSubmit('DRAFT')}
            disabled={submitting}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            임시저장
          </button>
          <button
            onClick={() => handleSubmit('SUBMITTED')}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
