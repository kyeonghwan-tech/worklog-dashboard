import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format, toZonedTime } from 'date-fns-tz'

const KST = 'Asia/Seoul'

function todayKST(): string {
  return format(toZonedTime(new Date(), KST), 'yyyy-MM-dd')
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const log = await prisma.workLog.findUnique({ where: { id } })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (log.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 팀원은 당일에만 수정 가능 (팀장은 항상 가능)
  if (session.user.role !== 'ADMIN' && log.date !== todayKST()) {
    return NextResponse.json(
      { error: '업무일지는 작성 당일에만 수정할 수 있습니다.' },
      { status: 403 }
    )
  }

  const { content, status } = await req.json()
  const updated = await prisma.workLog.update({
    where: { id },
    data: { content, status },
    include: {
      user: { select: { id: true, name: true } },
      comments: { include: { user: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const log = await prisma.workLog.findUnique({ where: { id } })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (log.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.workLog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
