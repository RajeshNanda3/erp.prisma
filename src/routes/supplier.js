import express from 'express';
import {prisma} from '../prismaClient.js';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const supplier = await prisma.supplier.create({ data: { name, phone, address }});
    res.status(201).json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const list = await prisma.supplier.findMany();
  res.json(list);
});

export default router;
