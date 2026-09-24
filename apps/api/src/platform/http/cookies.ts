import type { CookieOptions, Response } from 'express';
import type { Env } from '../config/env';

const base = (env: Env): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
});

export function setAuthCookies(res: Response, env: Env, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, {
    ...base(env),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    ...base(env),
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response, env: Env): void {
  res.clearCookie('access_token', base(env));
  res.clearCookie('refresh_token', base(env));
}
