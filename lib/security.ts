import crypto from 'crypto'

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEYLEN = 64

export async function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16)
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, dk) => {
      if (err) return reject(err)
      resolve(dk as Buffer)
    })
  })
  return {
    saltHex: salt.toString('hex'),
    hashHex: derivedKey.toString('hex'),
  }
}

export async function verifyPassword(password: string, saltHex: string, hashHex: string) {
  const { hashHex: calcHash } = await hashPassword(password, saltHex)
  const a = Buffer.from(calcHash, 'hex')
  const b = Buffer.from(hashHex, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function base64url(input: Buffer | string) {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function fromBase64url(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64')
}

function getSecret(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET not set')
  return Buffer.from(secret, 'utf8')
}

export function signJWT(payload: Record<string, any>, expiresInSeconds: number) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + expiresInSeconds
  const body = { ...payload, iat, exp }
  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(body))
  const data = `${headerB64}.${payloadB64}`
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest()
  const sigB64 = base64url(sig)
  return `${data}.${sigB64}`
}

export function verifyJWT(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { valid: false }
    const [h, p, s] = parts
    const data = `${h}.${p}`
    const sig = crypto.createHmac('sha256', getSecret()).update(data).digest()
    const expected = base64url(sig)
    const ok = crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))
    if (!ok) return { valid: false }
    const payload = JSON.parse(fromBase64url(p).toString('utf8'))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return { valid: false }
    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}

export function newRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

