import { NextApiRequest, NextApiResponse } from 'next'
import { setCsrfCookie } from '@/lib/session'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const token = Math.random().toString(36).slice(2)
  setCsrfCookie(res, token)
  return res.status(200).json({ token })
}

