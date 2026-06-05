import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const log = await prisma.workLog.findUnique({ where: { id } })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (log.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
