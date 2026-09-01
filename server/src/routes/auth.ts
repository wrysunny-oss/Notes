import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signToken } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'
import { authMiddleware, type AuthRequest } from '../middlewares/auth'

const router = Router()

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(2, '用户名至少 2 个字符').max(24, '用户名最多 24 个字符'),
  password: z.string().min(6, '密码至少 6 位').max(64, '密码过长'),
  nickname: z.string().max(32).optional(),
})

const loginSchema = z.object({
  account: z.string().min(2, '请输入邮箱或用户名'),
  password: z.string().min(1, '请输入密码'),
})

router.post('/register', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = registerSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(body.password, 10)

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
      select: { email: true, username: true },
    })
    if (exists) {
      throw ApiError.conflict(
        'EMAIL_EXISTS',
        exists.email === body.email ? '邮箱已被注册' : '用户名已被占用',
      )
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        passwordHash,
        nickname: body.nickname || body.username,
      },
      select: { id: true, email: true, username: true, nickname: true, avatar: true },
    })

    const token = signToken({ userId: user.id, email: user.email })
    res.status(201).json({ token, user })
  } catch (e) {
    next(e)
  }
})

router.post('/login', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = loginSchema.parse(req.body)
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: body.account }, { username: body.account }] },
    })
    if (!user) throw ApiError.unauthorized('账号或密码错误')

    const ok = await bcrypt.compare(body.password, user.passwordHash)
    if (!ok) throw ApiError.unauthorized('账号或密码错误')

    const token = signToken({ userId: user.id, email: user.email })
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    })
  } catch (e) {
    next(e)
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, username: true, nickname: true, avatar: true, createdAt: true },
    })
    if (!user) throw ApiError.notFound('用户不存在')
    res.json({ user })
  } catch (e) {
    next(e)
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const body = z
      .object({
        nickname: z.string().min(1).max(32).optional(),
        avatar: z.string().url().optional(),
      })
      .parse(req.body)

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { nickname: body.nickname, avatar: body.avatar },
      select: { id: true, email: true, username: true, nickname: true, avatar: true },
    })
    res.json({ user })
  } catch (e) {
    next(e)
  }
})

router.put('/password', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const body = z
      .object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(6).max(64),
      })
      .parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user) throw ApiError.notFound('用户不存在')

    const ok = await bcrypt.compare(body.oldPassword, user.passwordHash)
    if (!ok) throw ApiError.badRequest('WRONG_PASSWORD', '原密码错误')

    const passwordHash = await bcrypt.hash(body.newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    res.json({ message: '密码已更新' })
  } catch (e) {
    next(e)
  }
})

export default router
