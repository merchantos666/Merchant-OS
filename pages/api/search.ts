import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getStoreSlugFromHost } from '@/lib/store'
import { searchProducts } from '@/lib/search'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseServerClient(req as any, res as any)
  const term = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const storeSlugParam = typeof req.query.store === 'string' ? req.query.store.trim() : null
  const storeSlug = storeSlugParam || getStoreSlugFromHost(req.headers.host)

  if (!storeSlug) return res.status(400).json({ error: 'Store no encontrada' })

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', storeSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (storeError || !store) return res.status(404).json({ error: 'Store no encontrada' })

  try {
    const results = await searchProducts(supabase, store.id, term, 50)
    return res.status(200).json({ results })
  } catch (error) {
    console.error('Search error', error)
    return res.status(500).json({ error: 'Error interno' })
  }
}
