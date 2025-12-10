import express from 'express';
import { createPurchase } from '../controllers/purchaseController.js';
const router = express.Router();

router.post('/create', createPurchase);

export default router;