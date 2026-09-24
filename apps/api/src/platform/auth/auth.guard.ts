import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { forbidden, unauthorized } from '../../shared/domain-error';
import { IS_PUBLIC, PERMISSIONS_KEY, type AuthUser } from './current-user';
import { permissionsFor, type Permission } from './permissions';
import { UserLookup } from './user-lookup';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UserLookup,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.readToken(request);
    if (!token) throw unauthorized('Sign in to continue');

    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      userId = payload.sub;
    } catch {
      throw unauthorized('Sign in to continue');
    }

    const user = await this.users.findById(userId);
    if (!user) throw unauthorized('Sign in to continue');

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: permissionsFor(user.role),
      emailVerified: user.emailVerified,
    };
    request.user = authUser;

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length && !required.every((permission) => authUser.permissions.includes(permission))) {
      throw forbidden('You do not have permission to do that');
    }
    return true;
  }

  private readToken(request: Request): string | undefined {
    const header = request.header('authorization');
    if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
    const cookie = request.cookies?.access_token;
    return typeof cookie === 'string' ? cookie : undefined;
  }
}
