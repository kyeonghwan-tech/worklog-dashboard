'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
  }, [session])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const navItems = [
    { href: '/', label: '대시보드', icon: '📊' },
    { href: '/logs', label: '업무일지', icon: '📋' },
    { href: '/logs/new', label: '일지 작성', icon: '✏️' },
    ...(session?.user.role === 'ADMIN'
      ? [
          { href: '/calendar', label: '캘린더', icon: '📅' },
          { href: '/admin', label: '팀원 관리', icon: '👥' },
        ]
      : []),
    { href: '/profile', label: '내 정보', icon: '👤' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-indigo-700 text-lg">
            신지원 업무일지
          </Link>
          <div className="flex items-center gap-3">
            {/* 알림 */}
            <div className="relative">
              <button
                onClick={() => { setShowNotif(!showNotif); if (!showNotif && unreadCount > 0) markAllRead() }}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-3 border-b font-semibold text-sm text-gray-700">알림</div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-400 text-center">알림이 없습니다</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 border-b text-sm ${n.read ? 'text-gray-400' : 'text-gray-700 bg-indigo-50'}`}>
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-sm text-gray-600 hidden sm:block">
              {session?.user.name}
              {session?.user.role === 'ADMIN' && <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">팀장</span>}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* 사이드바 */}
        <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 컨텐츠 */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* 모바일 하단 내비 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-40">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs ${
              pathname === item.href ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
