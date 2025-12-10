import express from 'express';
import { addMedicine, getAllMedicines,searchMedicines, getMedicineById } from '../controllers/medicineController.js';

const router = express.Router();

router.post('/add', addMedicine);
router.get('/', getAllMedicines);
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

export default router;