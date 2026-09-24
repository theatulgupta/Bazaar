import { Body, Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { loginSchema, refreshSchema, registerSchema } from '@bazaar/contracts';
import type { Request, Response } from 'express';
import { CurrentUser, Public, type AuthUser } from '../../../platform/auth/current-user';
import { loadEnv } from '../../../platform/config/env';
import { clearAuthCookies, setAuthCookies } from '../../../platform/http/cookies';
import { parseBody } from '../../../platform/http/parse';
import { invalid } from '../../../shared/domain-error';
import { AddressService } from '../application/address.service';
import { AuthService } from '../application/auth.service';
import { addressInputSchema } from '@bazaar/contracts';
import { Delete, Param } from '@nestjs/common';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(@Body() body: unknown) {
    return { data: await this.auth.register(parseBody(registerSchema, body)) };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const issued = await this.auth.login(parseBody(loginSchema, body));
    setAuthCookies(res, loadEnv(), issued.accessToken, issued.refreshToken);
    return { data: issued };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const parsed = parseBody(refreshSchema, body ?? {});
    const token = parsed.refreshToken ?? readCookie(req, 'refresh_token');
    const issued = await this.auth.refresh(token);
    setAuthCookies(res, loadEnv(), issued.accessToken, issued.refreshToken);
    return { data: issued };
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const parsed = parseBody(refreshSchema, body ?? {});
    await this.auth.logout(parsed.refreshToken ?? readCookie(req, 'refresh_token'));
    clearAuthCookies(res, loadEnv());
    return { data: { ok: true } };
  }

  @Public()
  @Get('verify')
  async verify(@Query('token') token?: string) {
    if (!token) throw invalid('Verification link is invalid or already used');
    await this.auth.verifyEmail(token);
    return { data: { verified: true } };
  }
}

@ApiTags('account')
@Controller('api/v1')
export class AccountController {
  constructor(
    private readonly auth: AuthService,
    private readonly addresses: AddressService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return { data: await this.auth.profile(user.id) };
  }

  @Post('auth/resend-verification')
  async resend(@CurrentUser() user: AuthUser) {
    await this.auth.resendVerification(user.id);
    return { data: { ok: true } };
  }

  @Get('addresses')
  async list(@CurrentUser() user: AuthUser) {
    return { data: await this.addresses.list(user.id) };
  }

  @Post('addresses')
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return { data: await this.addresses.create(user.id, parseBody(addressInputSchema, body)) };
  }

  @Delete('addresses/:id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.addresses.remove(user.id, id);
    return { data: { ok: true } };
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const value = req.cookies?.[name];
  return typeof value === 'string' ? value : undefined;
}
