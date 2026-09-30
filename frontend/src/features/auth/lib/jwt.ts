import { TOKEN_EXPIRY_LEEWAY_SECONDS } from './constants';


export interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, leewaySeconds = TOKEN_EXPIRY_LEEWAY_SECONDS): boolean {
  const exp = decodeJwt(token)?.exp;
  if (!exp) return true;
  return Date.now() / 1000 >= exp - leewaySeconds;
}
