import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = getSupabaseServerClient(req, res)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return res.status(401).json({ error: 'No autenticado' })

  const { storeId, role = 'owner' } = req.body || {}
  if (!storeId) return res.status(400).json({ error: 'storeId requerido' })

  const service = getSupabaseServiceClient()
  try {
    const { error } = await service
      .from('store_memberships')
      .upsert({ store_id: storeId, user_id: userId, role })
      .select('id')
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: 'Error interno' })
  }
}
