'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { todayStr, formatDate } from '@/lib/utils'

export default function NewLogPage() {
  const router = useRouter()
  const [date, setDate] = useState(todayStr())
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(status: 'DRAFT' | 'SUBMITTED') {
    if (!content.trim()) {
      setError('업무 내용을 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, content, status }),
    })

    if (res.ok) {
      router.push('/logs')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || '저장에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">업무일지 작성</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">업무 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="오늘 진행한 업무 내용을 작성해주세요.

예)
1. [도서명] 원고 검토 및 피드백
2. [저자명] 미팅 진행
3. 다음 주 출간 일정 확인"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

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
            {submitting ? '저장 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
