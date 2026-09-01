import jwt, { type SignOptions } from 'jsonwebtoken'
import { z } from 'zod'

const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

export const TokenPayload = z.object({
  userId: z.string(),
  email: z.string(),
})

export type TokenPayloadType = z.infer<typeof TokenPayload>

export function signToken(payload: TokenPayloadType): string {
  const options = { expiresIn } as SignOptions
  return jwt.sign(payload, secret, options)
}

export function verifyToken(token: string): TokenPayloadType | null {
  try {
    const decoded = jwt.verify(token, secret) as Record<string, unknown>
    const parsed = TokenPayload.safeParse(decoded)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
