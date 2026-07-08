import { Router } from 'express';
import { getProfile } from '../controllers/profile.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:userId', authenticate, getProfile);

export default router;
