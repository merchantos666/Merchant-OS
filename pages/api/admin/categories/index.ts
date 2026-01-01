import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { requireAdminAuth } from '@/lib/adminGuard'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Auth required to avoid data leakage
    const auth = requireAdminAuth(req, res)
    if (!auth.ok) return
    const includeCounts = req.query.includeCounts === '1'
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    if (!includeCounts) return res.status(200).json(categories)
    const withCounts = await Promise.all(
      categories.map(async (c) => ({
        ...c,
        productsCount: await prisma.product.count({ where: { categoryId: c.id } }),
      }))
    )
    return res.status(200).json(withCounts)
  }

  if (req.method === 'POST') {
    const auth = requireAdminAuth(req, res)
    if (!auth.ok) return
    const { name, slug, description, imageUrl } = req.body || {}
    if (!name || !slug) return res.status(400).json({ error: 'name y slug son requeridos' })
    try {
      const created = await prisma.category.create({ data: { name, slug, description, imageUrl } })
      return res.status(201).json(created)
    } catch (e: any) {
      console.error('create category', e)
      return res.status(400).json({ error: 'No se pudo crear la categoría' })
    }
  }

  return res.status(405).end()
}
