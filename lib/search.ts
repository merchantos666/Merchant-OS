import { SupabaseClient } from '@supabase/supabase-js'

export type SearchResult = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  category?: { name: string; slug: string | null }
}

const sanitizeSearchTerm = (term: string) => term.replace(/[%]/g, '\\%').replace(/_/g, '\\_')

export const resolveSignedUrl = async (supabase: SupabaseClient, pathOrUrl?: string | null) => {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  const { data, error } = await supabase.storage.from('product-assets').createSignedUrl(pathOrUrl, 60 * 60 * 24)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function searchProducts(
  supabase: SupabaseClient,
  storeId: string,
  q: string,
  limit = 50
): Promise<SearchResult[]> {
  const term = q.trim()
  if (!term) return []
  const pattern = `%${sanitizeSearchTerm(term)}%`

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, image_url, category:categories ( name, slug )')
    .eq('store_id', storeId)
    .eq('is_published', true)
    .or(`name.ilike.${pattern},description.ilike.${pattern}`)
    .order('name')
    .limit(limit)

  if (error || !data) return []

  return Promise.all(
    data.map(async (p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      imageUrl: await resolveSignedUrl(supabase, p.image_url),
      category: p.category ? { name: p.category.name, slug: p.category.slug } : undefined,
    }))
  )
}
