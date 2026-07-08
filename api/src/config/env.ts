import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || '8000',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IP_ADDRESS: process.env.IP_ADDRESS || '0.0.0.0',
};
