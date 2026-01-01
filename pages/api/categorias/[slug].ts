// pages/api/categorias/[slug].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'
import { getStoreSlugFromHost } from '@/lib/store'

async function resolveImageUrl(supabase: ReturnType<typeof getSupabaseServiceClient>, pathOrUrl?: string | null) {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  const { data, error } = await supabase.storage.from('product-assets').createSignedUrl(pathOrUrl, 60 * 60 * 24)
  if (error) return null
  return data?.signedUrl ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query

  if (typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug inválido' })
  }

  const supabase = getSupabaseServiceClient()
  const storeSlug = (typeof req.query.store === 'string' && req.query.store.trim()) || getStoreSlugFromHost(req.headers.host)

  try {
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', storeSlug)
      .eq('is_active', true)
      .maybeSingle()

    if (!store) return res.status(404).json({ error: 'Categoría no encontrada' })

    const { data: categoryRow, error } = await supabase
      .from('categories')
      .select(`
        id, name, slug, description, image_url,
        products:products (
          id, name, slug, description, ignition_method, duration_seconds, colors_available, video_url, image_url, for_outdoor_use, age_restriction, metadata, is_published,
          pricing_tiers (id, min_qty, max_qty, price)
        )
      `)
      .eq('store_id', store.id)
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('products.is_published', true)
      .maybeSingle()

    if (error || !categoryRow) return res.status(404).json({ error: 'Categoría no encontrada' })

    const products = await Promise.all(
      (categoryRow.products || []).map(async (p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        ignitionMethod: p.ignition_method,
        durationSeconds: p.duration_seconds,
        colorsAvailable: p.colors_available || [],
        videoUrl: p.video_url,
        imageUrl: await resolveImageUrl(supabase, p.image_url),
        forOutdoorUse: p.for_outdoor_use,
        ageRestriction: p.age_restriction,
        metadata: p.metadata,
        pricingTiers: (p.pricing_tiers || []).map((t: any) => ({
          id: t.id,
          minQty: t.min_qty,
          maxQty: t.max_qty,
          price: Number(t.price),
        })),
      }))
    )

    const response = {
      id: categoryRow.id,
      name: categoryRow.name,
      slug: categoryRow.slug,
      description: categoryRow.description,
      imageUrl: categoryRow.image_url,
      products,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('❌ Error en API /categorias/[slug]:', error)
    return res.status(500).json({ error: 'Error del servidor' })
  }
}
