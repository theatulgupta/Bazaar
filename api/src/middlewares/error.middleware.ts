import { Request, Response, NextFunction } from 'express';

// Catches any unhandled errors thrown in async route handlers
const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};

export default errorHandler;
