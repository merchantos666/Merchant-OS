import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'
import { getSignedPutUrl, getSignedGetUrl } from '@/lib/s3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = getSupabaseServerClient(req, res)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return res.status(401).json({ error: 'No autenticado' })

  const { storeId, fileName, contentType } = req.body || {}
  if (!storeId || !fileName || !contentType) return res.status(400).json({ error: 'storeId, fileName y contentType requeridos' })

  // Verify membership owner/admin/editor
  const service = getSupabaseServiceClient()
  const { data: membership } = await service
    .from('store_memberships')
    .select('role')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership || !['owner', 'admin', 'editor'].includes((membership as any).role)) {
    return res.status(403).json({ error: 'No autorizado' })
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${storeId}/${Date.now()}-${sanitizedName}`

  try {
    const uploadUrl = await getSignedPutUrl(key, contentType)
    const viewUrl = await getSignedGetUrl(key)
    return res.status(200).json({ key, uploadUrl, viewUrl })
  } catch (err: any) {
    console.error('presign upload error', err)
    return res.status(500).json({ error: err?.message || 'No se pudo generar URL de subida' })
  }
}
