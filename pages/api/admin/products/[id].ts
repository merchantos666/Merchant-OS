import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { requireAdminAuth } from '@/lib/adminGuard'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'id requerido' })

  const auth = requireAdminAuth(req, res)
  if (!auth.ok) return

  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({ where: { id }, include: { category: true, pricingTiers: true } })
    if (!product) return res.status(404).json({ error: 'No encontrado' })
    return res.status(200).json(product)
  }

  if (req.method === 'PUT') {
    const data = req.body || {}
    try {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          ignitionMethod: data.ignitionMethod,
          durationSeconds: data.durationSeconds != null ? Number(data.durationSeconds) : null,
          colorsAvailable: Array.isArray(data.colorsAvailable) ? data.colorsAvailable : undefined,
          videoUrl: data.videoUrl,
          imageUrl: data.imageUrl === '' ? null : data.imageUrl,
          forOutdoorUse: typeof data.forOutdoorUse === 'boolean' ? data.forOutdoorUse : undefined,
          ageRestriction: data.ageRestriction,
          categoryId: data.categoryId,
          metadata: data.metadata,
        },
      })
      // PricingTiers update is simplistic: replace all
      if (Array.isArray(data.pricingTiers)) {
        await prisma.pricingTier.deleteMany({ where: { productId: id } })
        await prisma.pricingTier.createMany({
          data: data.pricingTiers.map((t: any) => ({ productId: id, minQty: t.minQty ?? null, maxQty: t.maxQty ?? null, price: Number(t.price) })),
        })
      }
      const full = await prisma.product.findUnique({ where: { id }, include: { pricingTiers: true } })
      return res.status(200).json(full)
    } catch (e) {
      console.error('update product', e)
      return res.status(400).json({ error: 'No se pudo actualizar' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.pricingTier.deleteMany({ where: { productId: id } })
      await prisma.product.delete({ where: { id } })
      return res.status(204).end()
    } catch (e) {
      console.error('delete product', e)
      return res.status(400).json({ error: 'No se pudo eliminar' })
    }
  }

  return res.status(405).end()
}
