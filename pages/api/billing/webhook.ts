import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'
import { getStripeClient } from '@/lib/stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readBuffer(req: NextApiRequest) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET no configurado' })

  const stripe = getStripeClient()
  const signature = req.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') return res.status(400).send('Missing signature')

  let event
  try {
    const body = await readBuffer(req)
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('stripe webhook error', err?.message || err)
    return res.status(400).send(`Webhook Error: ${err?.message || 'invalid payload'}`)
  }

  const supabase = getSupabaseServiceClient()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const storeId = session.metadata?.storeId
      if (storeId) {
        await supabase.from('stores').update({ plan: 'paid' }).eq('id', storeId)
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any
      const storeId = subscription.metadata?.storeId
      const status = subscription.status
      if (!storeId) return res.status(200).json({ received: true })

      if (event.type === 'customer.subscription.deleted' || status === 'canceled' || status === 'unpaid') {
        await supabase.from('stores').update({ plan: 'free' }).eq('id', storeId)
      } else if (['active', 'trialing', 'past_due', 'incomplete'].includes(status)) {
        await supabase.from('stores').update({ plan: 'paid' }).eq('id', storeId)
      }
    }
  } catch (err) {
    console.error('webhook handling error', err)
    return res.status(500).send('Webhook handling failed')
  }

  return res.status(200).json({ received: true })
}
