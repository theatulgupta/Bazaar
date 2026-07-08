import { Router } from 'express';
import { addAddress, getAddresses, deleteAddress } from '../controllers/address.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// all address routes require a valid JWT
router.use(authenticate);

router.post('/add', addAddress);
router.get('/:userId', getAddresses);
router.delete('/:userId/:addressId', deleteAddress);

export default router;
