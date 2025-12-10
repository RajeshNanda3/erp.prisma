import express from 'express';
import {addCustomer,getAllCustomers, searchCustomers} from '../controllers/cusomerController.js';

const router = express.Router();
router.post('/add', addCustomer);
router.get('/', getAllCustomers);
router.get('/search', searchCustomers);
export default router;


