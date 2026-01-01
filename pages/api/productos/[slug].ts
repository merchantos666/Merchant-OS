// pages/api/productos/[slug].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getStoreSlugFromHost } from '@/lib/store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug inválido' })
  }

  const supabase = getSupabaseServerClient(req as any, res as any)
  const resolveImageUrl = async (pathOrUrl?: string | null) => {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http')) return pathOrUrl
    const { data, error } = await supabase.storage.from('product-assets').createSignedUrl(pathOrUrl, 60 * 60 * 24)
    if (error) return null
    return data?.signedUrl ?? null
  }
  const storeSlug = (typeof req.query.store === 'string' && req.query.store.trim()) || getStoreSlugFromHost(req.headers.host)

  try {
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', storeSlug)
      .eq('is_active', true)
      .maybeSingle()

    if (!store) return res.status(404).json({ error: 'Producto no encontrado' })

    const { data: productRow, error } = await supabase
      .from('products')
      .select(`
        id, store_id, category_id, name, slug, description, ignition_method, duration_seconds, colors_available, video_url, image_url, for_outdoor_use, age_restriction, metadata, is_published,
        category:categories ( id, name, slug ),
        pricing_tiers (id, min_qty, max_qty, price)
      `)
      .eq('store_id', store.id)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()

    if (error || !productRow) return res.status(404).json({ error: 'Producto no encontrado' })

    const response = {
      id: productRow.id,
      name: productRow.name,
      slug: productRow.slug,
      description: productRow.description,
      ignitionMethod: productRow.ignition_method,
      durationSeconds: productRow.duration_seconds,
      colorsAvailable: productRow.colors_available || [],
      videoUrl: productRow.video_url,
      imageUrl: await resolveImageUrl(productRow.image_url),
      forOutdoorUse: productRow.for_outdoor_use,
      ageRestriction: productRow.age_restriction,
      metadata: productRow.metadata,
      category: productRow.category,
      pricingTiers: (productRow.pricing_tiers || []).map((t: any) => ({
        id: t.id,
        minQty: t.min_qty,
        maxQty: t.max_qty,
        price: Number(t.price),
      })),
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('❌ Error al obtener producto:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
