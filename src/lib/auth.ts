import { SignJWT, jwtVerify } from 'jose';

const TOKEN_EXPIRY = '8h';
const ALGORITHM = 'HS256';

function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signToken(secret: string): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecretKey(secret));
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey(secret));
    return true;
  } catch {
    return false;
  }
}

export const COOKIE_NAME = 'oc_admin_token';
