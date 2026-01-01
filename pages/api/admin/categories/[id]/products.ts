import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { requireAdminAuth } from '@/lib/adminGuard'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'id requerido' })

  const auth = requireAdminAuth(req, res)
  if (!auth.ok) return

  if (req.method === 'GET') {
    const products = await prisma.product.findMany({
      where: { categoryId: id },
      orderBy: { name: 'asc' },
      include: { pricingTiers: true },
    })
    return res.status(200).json(products)
  }

  if (req.method === 'POST') {
    const data = req.body || {}
    if (!data.name || !data.slug) return res.status(400).json({ error: 'name y slug requeridos' })
    try {
      const created = await prisma.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          ignitionMethod: data.ignitionMethod,
          durationSeconds: data.durationSeconds != null ? Number(data.durationSeconds) : null,
          colorsAvailable: Array.isArray(data.colorsAvailable) ? data.colorsAvailable : [],
          videoUrl: data.videoUrl,
          imageUrl: data.imageUrl,
          forOutdoorUse: typeof data.forOutdoorUse === 'boolean' ? data.forOutdoorUse : null,
          ageRestriction: data.ageRestriction,
          categoryId: id,
          metadata: data.metadata,
          pricingTiers: Array.isArray(data.pricingTiers)
            ? { create: data.pricingTiers.map((t: any) => ({ minQty: t.minQty ?? null, maxQty: t.maxQty ?? null, price: Number(t.price) })) }
            : undefined,
        },
        include: { pricingTiers: true },
      })
      return res.status(201).json(created)
    } catch (e) {
      console.error('create product in category', e)
      return res.status(400).json({ error: 'No se pudo crear' })
    }
  }

  return res.status(405).end()
}

