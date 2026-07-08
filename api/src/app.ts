import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRouter from './routes/auth.route.js';
import addressRouter from './routes/address.route.js';
import orderRouter from './routes/order.route.js';
import profileRouter from './routes/profile.route.js';
import errorHandler from './middlewares/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// only log HTTP requests in development
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use('/api/v1/users', authRouter);
app.use('/api/v1/address', addressRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/user/profile', profileRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

app.use(errorHandler);

export default app;
