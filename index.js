import express from "express";
import prisma from "./DB/db.config.js";
import dotenv from "dotenv";
import cors from "cors";

import cookieParser from "cookie-parser";
import authRoutes from './routes/authRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import saleRoutes from './routes/saleRoutes.js';

dotenv.config();

const app = express();


app.use(cors({ origin: "http://localhost:5174", credentials: true }));
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 8000;

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);

app.get("/", (req, res) => {
  res.send("ERP Backend with Prisma Running");
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
