import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { hashPassword } from '@/lib/security'

// Bootstrap endpoint: create the first admin if none exists.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const token = process.env.ADMIN_INIT_TOKEN
    if (!token) return res.status(403).json({ error: 'ADMIN_INIT_TOKEN no configurado' })
    const provided = (req.headers['x-init-token'] as string) || (req.query.token as string)
    if (!provided || provided !== token) return res.status(403).json({ error: 'Token inválido' })

    const count = await prisma.adminUser.count()
    if (count > 0) return res.status(409).json({ error: 'Ya existe un admin' })

    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'username y password requeridos' })
    const { saltHex, hashHex } = await hashPassword(password)
    const user = await prisma.adminUser.create({ data: { username, passwordSalt: saltHex, passwordHash: hashHex } })
    return res.status(201).json({ ok: true, username: user.username })
  } catch (e) {
    console.error('init admin error', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}

