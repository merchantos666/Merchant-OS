import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'
import { getStripeClient } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = getSupabaseServerClient(req, res)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return res.status(401).json({ error: 'No autenticado' })

  const { storeId } = req.body || {}
  if (!storeId) return res.status(400).json({ error: 'storeId requerido' })

  const service = getSupabaseServiceClient()
  const { data: membership } = await service
    .from('store_memberships')
    .select('role, store_id, store:stores(slug, plan)')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership || !['owner', 'admin'].includes((membership as any).role)) {
    return res.status(403).json({ error: 'Solo owner o admin pueden comprar el plan' })
  }

  const storeSlug = (membership as any)?.store?.slug
  const stripePrice = process.env.STRIPE_PRICE_ID
  if (!stripePrice) return res.status(500).json({ error: 'Falta STRIPE_PRICE_ID en el servidor' })

  try {
    const stripe = getStripeClient()
    const origin = req.headers.origin || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`
    const sessionCheckout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: stripePrice, quantity: 1 }],
      success_url: `${origin}/admin/content?store=${storeSlug || ''}&billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/admin/content?store=${storeSlug || ''}&billing=cancel`,
      subscription_data: { metadata: { storeId } },
      metadata: { storeId },
    })
    return res.status(200).json({ url: sessionCheckout.url })
  } catch (err: any) {
    console.error('stripe checkout error', err)
    return res.status(500).json({ error: err?.message || 'No se pudo crear checkout' })
  }
}
