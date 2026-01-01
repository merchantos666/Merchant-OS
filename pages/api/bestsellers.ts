import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getStoreSlugFromHost } from '@/lib/store'
import { resolveSignedUrl } from '@/lib/search'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseServerClient(req as any, res as any)
  const storeSlugParam = typeof req.query.store === 'string' ? req.query.store.trim() : null
  const storeSlug = storeSlugParam || getStoreSlugFromHost(req.headers.host)

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', storeSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (storeError || !store) return res.status(404).json({ error: 'Store no encontrada' })

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, image_url, pricing_tiers (price)')
    .eq('store_id', store.id)
    .eq('is_published', true)
    .order('name')
    .limit(12)

  if (error || !data) return res.status(200).json({ results: [] })

  const results = await Promise.all(
    data.map(async (p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      imageUrl: await resolveSignedUrl(supabase, p.image_url),
      price: p.pricing_tiers?.[0]?.price ? Number(p.pricing_tiers[0].price) : null,
    }))
  )

  return res.status(200).json({ results })
}
