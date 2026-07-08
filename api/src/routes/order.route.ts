import { Router } from 'express';
import { createOrder, getUserOrders, getOrderById } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// all order routes require a valid JWT
router.use(authenticate);

router.post('/add', createOrder);
router.get('/detail/:id', getOrderById);
router.get('/:userId', getUserOrders);

export default router;
