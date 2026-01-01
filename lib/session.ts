import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { verifyJWT, signJWT, newRandomToken } from './security'

const SESSION_COOKIE = 'admin_session'
const CSRF_COOKIE = 'admin_csrf'
const SESSION_TTL = 60 * 60 * 8 // 8h
const RENEW_THRESHOLD = 60 * 30 // 30m

function isProd() {
  return process.env.NODE_ENV === 'production'
}

function appendSetCookie(res: NextApiResponse, cookie: string) {
  const existing = res.getHeader('Set-Cookie')
  if (!existing) {
    res.setHeader('Set-Cookie', cookie)
    return
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie])
    return
  }
  res.setHeader('Set-Cookie', [existing as string, cookie])
}

export function setSessionCookie(res: NextApiResponse, token: string) {
  const attrs = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_TTL}`,
    'HttpOnly',
    'SameSite=Strict',
  ]
  if (isProd()) attrs.push('Secure')
  appendSetCookie(res, attrs.join('; '))
}

export function clearSessionCookie(res: NextApiResponse) {
  const cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${isProd() ? '; Secure' : ''}`
  appendSetCookie(res, cookie)
}

export function setCsrfCookie(res: NextApiResponse, token: string) {
  const attrs = [
    `${CSRF_COOKIE}=${token}`,
    'Path=/',
    'Max-Age=3600',
    'SameSite=Strict',
  ]
  if (isProd()) attrs.push('Secure')
  appendSetCookie(res, attrs.join('; '))
}

export function clearCsrfCookie(res: NextApiResponse) {
  const cookie = `${CSRF_COOKIE}=; Path=/; Max-Age=0; SameSite=Strict${isProd() ? '; Secure' : ''}`
  appendSetCookie(res, cookie)
}

export function getCookies(req: NextApiRequest) {
  const cookie = req.headers.cookie || ''
  const obj: Record<string, string> = {}
  cookie.split(';').forEach((p) => {
    const [k, ...v] = p.trim().split('=')
    if (!k) return
    obj[k] = decodeURIComponent(v.join('='))
  })
  return obj
}

export function getSessionPayload(req: NextApiRequest) {
  const cookies = getCookies(req)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const { valid, payload } = verifyJWT(token)
  if (!valid) return null
  return payload as { sub: string; username: string; role: string; iat: number; exp: number }
}

export function maybeRenewSession(req: NextApiRequest, res: NextApiResponse) {
  const payload = getSessionPayload(req)
  if (!payload) return
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp - now < RENEW_THRESHOLD) {
    const newToken = signJWT({ sub: payload.sub, username: payload.username, role: payload.role }, SESSION_TTL)
    setSessionCookie(res, newToken)
  }
}

export function issueSession(res: NextApiResponse, user: { id: string; username: string }) {
  const token = signJWT({ sub: user.id, username: user.username, role: 'admin' }, SESSION_TTL)
  setSessionCookie(res, token)
}

export function issueCsrf(res: NextApiResponse) {
  const token = newRandomToken(16)
  setCsrfCookie(res, token)
  return token
}

export function requireCsrf(req: NextApiRequest) {
  const cookies = getCookies(req)
  const cookieToken = cookies[CSRF_COOKIE]
  const headerToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string | undefined
  if (!cookieToken || !headerToken) return false
  // Timing safe compare
  const a = Buffer.from(cookieToken)
  const b = Buffer.from(headerToken)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
