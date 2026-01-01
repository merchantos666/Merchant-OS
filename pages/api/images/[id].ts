import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).send('id requerido')
  try {
    const media = await prisma.media.findUnique({ where: { id } })
    if (!media) return res.status(404).end('no encontrado')
    res.setHeader('Content-Type', media.contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('Content-Length', String(media.size))
    res.status(200).send(Buffer.from(media.data as any))
  } catch (e) {
    console.error('serve image error', e)
    return res.status(500).end('error')
  }
}

