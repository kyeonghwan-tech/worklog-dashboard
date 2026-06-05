import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@hanbit.co.kr' } })
  if (existing) {
    console.log('관리자 계정이 이미 존재합니다.')
    return
  }

  const hashed = await bcrypt.hash('hanbit1234!', 12)
  await prisma.user.create({
    data: {
      name: '신지원',
      email: 'admin@hanbit.co.kr',
      password: hashed,
      role: 'ADMIN',
      department: '편집부',
    },
  })
  console.log('✅ 관리자 계정 생성 완료')
  console.log('   이메일: admin@hanbit.co.kr')
  console.log('   비밀번호: hanbit1234!')
  console.log('   ⚠️  로그인 후 반드시 비밀번호를 변경해주세요.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
