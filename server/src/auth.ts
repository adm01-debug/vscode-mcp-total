/**
 * auth.ts — Token-in-path authentication
 *
 * Security model: the full URL is the secret.
 * Token is embedded in the request path: POST /mcp/:token
 *
 * NEVER commit the actual token. Store it in .env (MCP_TOKEN).
 * The token must be at least 64 characters of cryptographic randomness.
 */

import crypto from 'crypto';

let _token: string | null = null;

export function initAuth(token: string): void {
  if (token.length < 32) {
    throw new Error('[auth] MCP_TOKEN must be at least 32 characters. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  }
  _token = token;
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function validateToken(candidate: string): boolean {
  if (!_token) return false;
  if (candidate.length !== _token.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidate, 'utf8'),
      Buffer.from(_token, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Express middleware — validates the :token route param.
 * Returns 404 (not 401) to avoid revealing that the endpoint exists.
 */
export function authMiddleware(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
): void {
  const token = req.params.token ?? '';
  if (!validateToken(token)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  next();
}

/**
 * Generate a cryptographically secure token.
 * Usage: node -e "require('./dist/auth').generateToken().then(console.log)"
 */
export function generateToken(): string {
  return crypto.randomBytes(48).toString('hex'); // 96 hex chars
}
