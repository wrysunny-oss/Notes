import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const APP_NAME = process.env.APP_NAME || '富商笔记'

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@clound.note' },
    update: {},
    create: {
      email: 'demo@clound.note',
      username: 'demo',
      passwordHash,
      nickname: '演示账号',
    },
  })

  const tags = ['工作', '生活', '灵感']
  for (const name of tags) {
    await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: {},
      create: { name, userId: user.id },
    })
  }

  const workTag = await prisma.tag.findFirst({ where: { userId: user.id, name: '工作' } })
  await prisma.note.create({
    data: {
      title: `欢迎使用${APP_NAME}`,
      content: '# 欢迎\n\n这是你的第一篇笔记，可以开始编辑了。',
      userId: user.id,
      pinned: true,
      tags: workTag ? { connect: [{ id: workTag.id }] } : undefined,
    },
  })

  console.log('seed done, user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
