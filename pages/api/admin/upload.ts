import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminAuth } from '@/lib/adminGuard'
import { prisma } from '@/server/prisma'

export const config = {
  api: { bodyParser: false },
}

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const auth = requireAdminAuth(req, res)
  if (!auth.ok) return

  try {
    const ct = (req.headers['content-type'] as string) || 'application/octet-stream'
    const filename = (req.query.filename as string) || 'upload'
    if (!ALLOWED.has(ct)) return res.status(400).json({ error: 'Tipo de archivo no permitido' })

    const bufs: Buffer[] = []
    let total = 0
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => {
        total += chunk.length
        if (total > MAX_BYTES) {
          reject(new Error('Archivo demasiado grande'))
          req.destroy()
          return
        }
        bufs.push(chunk)
      })
      req.on('end', () => resolve())
      req.on('error', (e) => reject(e))
    })
    const data = Buffer.concat(bufs)
    const media = await prisma.media.create({ data: { filename, contentType: ct, size: data.length, data } })
    const url = `/api/images/${media.id}`
    return res.status(201).json({ id: media.id, url })
  } catch (e: any) {
    console.error('upload error', e)
    return res.status(400).json({ error: e.message || 'Error de carga' })
  }
}

