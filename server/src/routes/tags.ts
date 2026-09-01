import { Router, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/ApiError'
import { authMiddleware, type AuthRequest } from '../middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { notes: true } } },
    })
    res.json({ tags })
  } catch (e) {
    next(e)
  }
})

const createSchema = z.object({
  name: z.string().min(1, '标签名不能为空').max(32, '标签名过长'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '颜色格式不正确').optional(),
})

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = createSchema.parse(req.body)
    const exists = await prisma.tag.findUnique({
      where: { userId_name: { userId: req.userId!, name: body.name } },
      select: { id: true },
    })
    if (exists) throw ApiError.conflict('TAG_EXISTS', '标签名已存在')
    const tag = await prisma.tag.create({
      data: { name: body.name, color: body.color, userId: req.userId! },
    })
    res.status(201).json({ tag })
  } catch (e) {
    next(e)
  }
})

const updateSchema = z.object({
  name: z.string().min(1).max(32).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = updateSchema.parse(req.body)
    const tag = await prisma.tag.update({
      where: { id: req.params.id, userId: req.userId! },
      data: { name: body.name, color: body.color },
    })
    res.json({ tag })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.tag.delete({ where: { id: req.params.id, userId: req.userId! } })
    res.json({ message: '标签已删除' })
  } catch (e) {
    next(e)
  }
})

export default router
