import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { hashPassword, verifyPassword } from '@/lib/security'
import { issueSession, setCsrfCookie } from '@/lib/session'
import { rateLimit } from '@/lib/rateLimit'

function getClientIp(req: NextApiRequest) {
  const xf = (req.headers['x-forwarded-for'] as string) || ''
  return (xf.split(',')[0] || req.socket.remoteAddress || 'unknown').trim()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = getClientIp(req)
  const rl = rateLimit(`login:${ip}`, 10, 5 * 60 * 1000) // 10 attempts per 5 min per IP
  if (!rl.allowed) return res.status(429).json({ error: 'Demasiados intentos, intenta más tarde.' })

  try {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' })

    const user = await prisma.adminUser.findUnique({ where: { username } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Credenciales inválidas' })

    // Account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente' })
    }

    const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash)
    if (!ok) {
      // increment failed attempts
      const failed = (user.failedLoginAttempts || 0) + 1
      const updates: any = { failedLoginAttempts: failed }
      if (failed >= 5) {
        updates.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 min
        updates.failedLoginAttempts = 0
      }
      await prisma.adminUser.update({ where: { id: user.id }, data: updates })
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockoutUntil: null },
    })

    issueSession(res, { id: user.id, username: user.username })
    // also set fresh CSRF cookie for client-side fetches
    const csrf = Math.random().toString(36).slice(2)
    setCsrfCookie(res, csrf)
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('login error', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}

