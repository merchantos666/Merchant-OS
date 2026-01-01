import { NextApiRequest, NextApiResponse } from 'next'
import { getSessionPayload, requireCsrf } from './session'

function isSameOrigin(req: NextApiRequest) {
  const host = (req.headers['host'] as string) || ''
  if (!host) return false
  const origin = (req.headers['origin'] as string) || ''
  const referer = (req.headers['referer'] as string) || ''
  const http = `http://${host}`
  const https = `https://${host}`
  if (origin && (origin === http || origin === https)) return true
  if (referer && (referer.startsWith(http + '/') || referer.startsWith(https + '/'))) return true
  return false
}

export function requireAdminAuth(req: NextApiRequest, res: NextApiResponse): { ok: true } | { ok: false } {
  const payload = getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ error: 'No autorizado' })
    return { ok: false }
  }
  // For non-GET, require CSRF token (with same-origin fallback)
  if (req.method && req.method !== 'GET') {
    if (!requireCsrf(req) && !isSameOrigin(req)) {
      res.status(403).json({ error: 'CSRF inválido' })
      return { ok: false }
    }
  }
  return { ok: true }
}
