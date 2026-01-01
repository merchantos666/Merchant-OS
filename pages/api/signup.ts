import type { NextApiRequest, NextApiResponse } from 'next'
import slugify from 'slugify'
import { getSupabaseServiceClient } from '@/lib/supabaseServiceClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, name, slug, isPublic = true } = req.body || {}
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const normalizedSlug = (slug as string)?.trim() || slugify(name, { lower: true, strict: true })
  if (!normalizedSlug) {
    return res.status(400).json({ error: 'Slug inválido' })
  }

  const supabase = getSupabaseServiceClient()

  try {
    // Create user without requiring email confirmation.
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (userError || !userData?.user?.id) {
      return res.status(400).json({ error: userError?.message || 'No se pudo crear el usuario' })
    }

    const userId = userData.user.id

    // Create store for this user (service_role bypasses RLS).
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        name,
        slug: normalizedSlug,
        is_public: !!isPublic,
        created_by: userId,
        plan: 'free',
        brand: defaultBrand,
      })
      .select('id')
      .single()

    if (storeError) {
      return res.status(400).json({ error: storeError.message })
    }

    return res.status(200).json({ ok: true, userId, storeId: storeData?.id })
  } catch (error: any) {
    console.error('signup error', error)
    return res.status(500).json({ error: 'Error interno' })
  }
}
import { defaultBrand } from '@/lib/defaultBrand'
