type HostLike = string | undefined | null

export function getStoreSlugFromHost(host?: HostLike) {
  const fallback = process.env.NEXT_PUBLIC_DEFAULT_STORE_SLUG || 'default'
  if (!host) return fallback
  const cleanHost = String(host).split(':')[0].toLowerCase()
  const parts = cleanHost.split('.')
  // Support <slug>.localhost in dev and subdomains in prod
  if (parts.length >= 3) return parts[0]
  if (cleanHost.endsWith('.localhost') && parts.length >= 2) return parts[0]
  if (cleanHost === 'localhost') return fallback
  return fallback
}
