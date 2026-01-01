// pages/api/categorias/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getStoreSlugFromHost } from '@/lib/store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
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

    if (!store) return res.status(200).json([])

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url')
      .eq('store_id', store.id)
      .eq('is_published', true)
      .order('name')

    if (error) throw error
    const mapped = await Promise.all(
      (data || []).map(async (c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: await resolveImageUrl(c.image_url),
      }))
    )
    return res.status(200).json(mapped)
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
