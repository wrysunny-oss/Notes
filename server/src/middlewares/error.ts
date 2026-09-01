import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError'

type ErrorLike = Error & { code?: string; status?: number }

export function errorHandler(err: ErrorLike, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ code: err.code, message: err.message })
  }

  if (err instanceof ZodError) {
    const first = err.errors[0]
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: first ? `${first.path.join('.')}: ${first.message}` : '参数校验失败',
    })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ code: 'CONFLICT', message: '字段已存在' })
  }

  console.error('[server error]', err)
  res.status(err.status || 500).json({
    code: 'SERVER_ERROR',
    message: err.message || '服务器内部错误',
  })
}
