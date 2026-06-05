import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workLogId, content } = await req.json()
  if (!workLogId || !content) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: { workLogId, content, userId: session.user.id },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(comment)
}
