import { Router, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/ApiError'
import { authMiddleware, type AuthRequest } from '../middlewares/auth'

const router = Router()

router.use(authMiddleware)

const listQuerySchema = z.object({
  keyword: z.string().optional(),
  tagId: z.string().optional(),
  trashed: z.enum(['true', 'false']).default('false'),
  pinnedOnly: z.enum(['true', 'false']).default('false'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const q = listQuerySchema.parse(req.query)
    const where: any = { userId: req.userId! }
    if (q.trashed === 'true') {
      where.deletedAt = { not: null }
    } else {
      where.deletedAt = null
      if (q.pinnedOnly === 'true') where.pinned = true
    }
    if (q.keyword) {
      const kw = q.keyword.trim()
      if (kw) {
        where.OR = [
          { title: { contains: kw } },
          { content: { contains: kw } },
        ]
      }
    }
    if (q.tagId) where.tags = { some: { id: q.tagId } }

    const [items, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        take: q.limit,
        skip: q.offset,
        include: { tags: true },
      }),
      prisma.note.count({ where }),
    ])

    res.json({ items, total })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { tags: true },
    })
    if (!note) throw ApiError.notFound('笔记不存在')
    res.json({ note })
  } catch (e) {
    next(e)
  }
})

const createSchema = z.object({
  title: z.string().max(200).default(''),
  content: z.string().default(''),
  pinned: z.boolean().default(false),
  tagIds: z.array(z.string()).default([]),
})

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = createSchema.parse(req.body)
    const note = await prisma.note.create({
      data: {
        title: body.title,
        content: body.content ?? '',
        pinned: body.pinned,
        userId: req.userId!,
        tags: body.tagIds.length
          ? { connect: body.tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { tags: true },
    })
    res.status(201).json({ note })
  } catch (e) {
    next(e)
  }
})

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
})

router.put('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = updateSchema.parse(req.body)
    const existing = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      select: { id: true, deletedAt: true },
    })
    if (!existing) throw ApiError.notFound('笔记不存在')

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.content !== undefined) data.content = body.content
    if (body.pinned !== undefined) data.pinned = body.pinned
    if (body.tagIds !== undefined) {
      data.tags = { set: body.tagIds.map((id) => ({ id })) }
    }

    const note = await prisma.note.update({
      where: { id: existing.id },
      data,
      include: { tags: true },
    })
    res.json({ note })
  } catch (e) {
    next(e)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      select: { id: true, deletedAt: true },
    })
    if (!note) throw ApiError.notFound('笔记不存在')

    if (!note.deletedAt) {
      await prisma.note.update({
        where: { id: note.id },
        data: { deletedAt: new Date(), pinned: false },
      })
      return res.json({ message: '已移入回收站' })
    }
    await prisma.note.delete({ where: { id: note.id } })
    res.json({ message: '已彻底删除' })
  } catch (e) {
    next(e)
  }
})

router.post('/:id/restore', async (req: AuthRequest, res: Response, next) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId!, deletedAt: { not: null } },
      select: { id: true },
    })
    if (!note) throw ApiError.notFound('笔记不在回收站')
    const restored = await prisma.note.update({
      where: { id: note.id },
      data: { deletedAt: null },
      include: { tags: true },
    })
    res.json({ note: restored, message: '已恢复' })
  } catch (e) {
    next(e)
  }
})

router.delete('/trash/empty', async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await prisma.note.deleteMany({
      where: { userId: req.userId!, deletedAt: { not: null } },
    })
    res.json({ message: '回收站已清空', count: result.count })
  } catch (e) {
    next(e)
  }
})

export default router
