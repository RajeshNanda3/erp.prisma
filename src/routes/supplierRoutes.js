import express from 'express';
import { addSupplier, getAllSuppliers } from '../controllers/supplierController.js';

const router = express.Router();

router.post('/add', addSupplier);
router.get('/', getAllSuppliers);
export default router;