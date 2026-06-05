import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const userId = searchParams.get('userId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // 팀원은 본인 일지만 조회 가능
  const isAdmin = session.user.role === 'ADMIN'
  const targetUserId = !isAdmin ? session.user.id : userId || undefined

  const where: Record<string, unknown> = {}
  if (targetUserId) where.userId = targetUserId
  if (date) {
    where.date = date
  } else if (startDate || endDate) {
    where.date = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    }
  }

  const logs = await prisma.workLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(logs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, content, status } = await req.json()
  if (!date || !content) {
    return NextResponse.json({ error: '날짜와 내용을 입력해주세요.' }, { status: 400 })
  }

  const log = await prisma.workLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    update: { content, status: status || 'SUBMITTED', updatedAt: new Date() },
    create: { userId: session.user.id, date, content, status: status || 'SUBMITTED' },
    include: {
      user: { select: { id: true, name: true } },
      comments: { include: { user: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json(log)
}
