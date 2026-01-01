import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'
import { getSignedGetUrl } from '@/lib/s3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const key = req.query.key as string
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'key requerido' })

  const storeId = key.split('/')[0]
  if (!storeId) return res.status(400).json({ error: 'key inválido' })

  const service = getSupabaseServiceClient()
  const { data: store } = await service
    .from('stores')
    .select('id, is_public, is_active')
    .eq('id', storeId)
    .maybeSingle()

  if (!store || !store.is_active) return res.status(404).json({ error: 'Tienda no encontrada' })

  // If store is not public, require membership
  if (!store.is_public) {
    const supabase = getSupabaseServerClient(req, res)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return res.status(401).json({ error: 'No autorizado' })
    const { data: membership } = await service
      .from('store_memberships')
      .select('id')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle()
    if (!membership) return res.status(403).json({ error: 'No autorizado' })
  }

  try {
    const url = await getSignedGetUrl(key)
    return res.status(200).json({ url })
  } catch (err: any) {
    console.error('signed url error', err)
    return res.status(500).json({ error: err?.message || 'No se pudo firmar URL' })
  }
}
