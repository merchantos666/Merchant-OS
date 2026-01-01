import { NextApiRequest, NextApiResponse } from 'next'
import { clearSessionCookie, clearCsrfCookie } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  clearSessionCookie(res)
  // Clear CSRF cookie as well
  clearCsrfCookie(res)
  return res.status(200).json({ ok: true })
}
