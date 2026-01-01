// lib/getBaseUrl.ts
export function getBaseUrl(req: any): string {
    const host = req?.headers?.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }
  