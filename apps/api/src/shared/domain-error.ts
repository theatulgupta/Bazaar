export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export const notFound = (message = 'Not found') => new DomainError('not_found', message, 404);
export const conflict = (message: string) => new DomainError('conflict', message, 409);
export const forbidden = (message: string) => new DomainError('forbidden', message, 403);
export const unauthorized = (message = 'Unauthorized') => new DomainError('unauthorized', message, 401);
export const invalid = (message: string) => new DomainError('validation', message, 400);
export const invariant = (message: string) => new DomainError('invariant', message, 422);
