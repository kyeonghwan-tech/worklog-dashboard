import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const where: Record<string, unknown> = {}
  if (date) where.date = date

  const absences = await prisma.absence.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(absences)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, date, type, note } = await req.json()
  const targetUserId = session.user.role === 'ADMIN' && userId ? userId : session.user.id

  const absence = await prisma.absence.upsert({
    where: { userId_date: { userId: targetUserId, date } },
    update: { type, note },
    create: { userId: targetUserId, date, type, note },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(absence)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const targetUserId = session.user.role === 'ADMIN' && userId ? userId : session.user.id

  await prisma.absence.deleteMany({ where: { userId: targetUserId, date } })
  return NextResponse.json({ ok: true })
}
