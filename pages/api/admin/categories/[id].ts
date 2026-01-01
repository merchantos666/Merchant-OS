import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/server/prisma'
import { requireAdminAuth } from '@/lib/adminGuard'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'id requerido' })

  const auth = requireAdminAuth(req, res)
  if (!auth.ok) return

  if (req.method === 'GET') {
    const category = await prisma.category.findUnique({ where: { id }, include: { products: true } })
    if (!category) return res.status(404).json({ error: 'No encontrada' })
    return res.status(200).json(category)
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { name, slug, description, imageUrl } = req.body || {}
    try {
      const updated = await prisma.category.update({ where: { id }, data: { name, slug, description, imageUrl } })
      return res.status(200).json(updated)
    } catch (e) {
      console.error('update category', e)
      return res.status(400).json({ error: 'No se pudo actualizar' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.category.delete({ where: { id } })
      return res.status(204).end()
    } catch (e) {
      console.error('delete category', e)
      return res.status(400).json({ error: 'No se pudo eliminar' })
    }
  }

  return res.status(405).end()
}
