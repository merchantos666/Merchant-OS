import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { defaultBrand } from '@/lib/defaultBrand'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  if (typeof slug !== 'string' || !slug.trim()) return res.status(400).json({ error: 'Slug inválido' })
  const supabase = getSupabaseServerClient(req as any, res as any)

  try {
    const { data: store } = await supabase
      .from('stores')
      .select('id, name, slug, plan, brand')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })

    // Always merge stored brand so edits are visible; defaultBrand only fills gaps.
    const appliedBrand = { ...defaultBrand, ...(store.brand || {}) }
    if (appliedBrand.heroBg && !String(appliedBrand.heroBg).startsWith('http')) {
      const { data } = await supabase.storage.from('product-assets').createSignedUrl(appliedBrand.heroBg, 60 * 60 * 24)
      appliedBrand.heroBg = data?.signedUrl || appliedBrand.heroBg
    }
    if (appliedBrand.logoUrl && !String(appliedBrand.logoUrl).startsWith('http')) {
      const { data } = await supabase.storage.from('product-assets').createSignedUrl(appliedBrand.logoUrl, 60 * 60 * 24)
      appliedBrand.logoUrl = data?.signedUrl || appliedBrand.logoUrl
    }

    return res.status(200).json({
      id: store.id,
      name: store.name,
      slug: store.slug,
      plan: store.plan,
      brand: appliedBrand,
    })
  } catch (error) {
    console.error('store-page error', error)
    return res.status(500).json({ error: 'Error interno' })
  }
}
