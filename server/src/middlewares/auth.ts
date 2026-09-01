import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { ApiError } from '../utils/ApiError'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized())
  }

  const token = header.slice(7).trim()
  const payload = verifyToken(token)
  if (!payload) {
    return next(ApiError.unauthorized())
  }

  req.userId = payload.userId
  req.userEmail = payload.email
  next()
}
