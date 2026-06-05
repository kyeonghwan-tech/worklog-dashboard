import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = toZonedTime(new Date(), 'Asia/Seoul')
  const today = format(now, 'yyyy-MM-dd')

  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } })

  const absences = await prisma.absence.findMany({ where: { date: today } })
  const absentUserIds = new Set(absences.map((a) => a.userId))

  const submittedLogs = await prisma.workLog.findMany({
    where: { date: today, status: 'SUBMITTED' },
    select: { userId: true },
  })
  const submittedUserIds = new Set(submittedLogs.map((l) => l.userId))

  const missing = allUsers.filter(
    (u) => !absentUserIds.has(u.id) && !submittedUserIds.has(u.id)
  )

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })

  const notifications: { userId: string; message: string }[] = []

  for (const user of missing) {
    notifications.push({
      userId: user.id,
      message: `📋 오늘(${today}) 업무일지를 아직 작성하지 않으셨습니다. 퇴근 전에 작성해주세요.`,
    })
    for (const admin of admins) {
      if (admin.id !== user.id) {
        notifications.push({
          userId: admin.id,
          message: `⚠️ ${user.name}님이 오늘(${today}) 업무일지를 작성하지 않았습니다.`,
        })
      }
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications })
  }

  return NextResponse.json({ checked: missing.length, notified: notifications.length })
}
