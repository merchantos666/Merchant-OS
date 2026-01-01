import { NextApiRequest, NextApiResponse } from 'next'
import { getSessionPayload, maybeRenewSession } from '@/lib/session'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  maybeRenewSession(req, res)
  const payload = getSessionPayload(req)
  if (!payload) return res.status(401).json({ authenticated: false })
  return res.status(200).json({ authenticated: true, user: { id: payload.sub, username: payload.username } })
}

