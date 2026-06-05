import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const userId = searchParams.get('userId')

  const where: Record<string, unknown> = {}
  if (date) where.date = date
  if (userId) where.userId = userId

  const logs = await prisma.workLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
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
