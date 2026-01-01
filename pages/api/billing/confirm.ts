import type { NextApiRequest, NextApiResponse } from 'next'
import { getStripeClient } from '@/lib/stripe'
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

  const { sessionId } = req.body || {}
  if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' })

  const stripe = getStripeClient()
  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
    const storeId = (checkout.metadata as any)?.storeId
    if (!storeId) return res.status(400).json({ error: 'Checkout sin storeId' })

    const isPaid =
      checkout.payment_status === 'paid' ||
      checkout.status === 'complete' ||
      (checkout.subscription as any)?.status === 'active'

    if (!isPaid) return res.status(400).json({ error: 'Pago no confirmado aún' })

    // Only owner/admin can confirm for the store
    const service = getSupabaseServiceClient()
    const { data: membership } = await service
      .from('store_memberships')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
      return res.status(403).json({ error: 'No autorizado para activar este store' })
    }

    await service.from('stores').update({ plan: 'paid' }).eq('id', storeId)
    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('checkout confirm error', err)
    return res.status(500).json({ error: err?.message || 'Error verificando pago' })
  }
}
