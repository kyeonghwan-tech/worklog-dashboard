import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }

  const logs = await prisma.workLog.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(logs)
}
