import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { requireAdminAuth } from '@/lib/adminGuard'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const auth = requireAdminAuth(req, res)
    if (!auth.ok) return
    const products = await prisma.product.findMany({ include: { category: true, pricingTiers: true } })
    return res.status(200).json(products)
  }

  if (req.method === 'POST') {
    const auth = requireAdminAuth(req, res)
    if (!auth.ok) return
    const {
      name,
      slug,
      description,
      ignitionMethod,
      durationSeconds,
      colorsAvailable,
      videoUrl,
      imageUrl,
      forOutdoorUse,
      ageRestriction,
      categoryId,
      metadata,
      pricingTiers,
    } = req.body || {}

    if (!name || !slug || !categoryId) return res.status(400).json({ error: 'name, slug, categoryId requeridos' })
    try {
      const created = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          ignitionMethod,
          durationSeconds: durationSeconds ? Number(durationSeconds) : null,
          colorsAvailable: Array.isArray(colorsAvailable) ? colorsAvailable : [],
          videoUrl,
          imageUrl,
          forOutdoorUse: typeof forOutdoorUse === 'boolean' ? forOutdoorUse : null,
          ageRestriction,
          categoryId,
          metadata: metadata ?? undefined,
          pricingTiers: pricingTiers && Array.isArray(pricingTiers)
            ? { create: pricingTiers.map((t: any) => ({ minQty: t.minQty ?? null, maxQty: t.maxQty ?? null, price: Number(t.price) })) }
            : undefined,
        },
        include: { pricingTiers: true },
      })
      return res.status(201).json(created)
    } catch (e) {
      console.error('create product', e)
      return res.status(400).json({ error: 'No se pudo crear el producto' })
    }
  }

  return res.status(405).end()
}

