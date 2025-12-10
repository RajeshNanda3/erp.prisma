import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import purchaseRoutes from "./routes/purchageRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";


dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5174", credentials: true }));
app.use(cookieParser());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/suppliers", supplierRoutes);

app.get("/", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
// console.log(process.env.DATABASE_URL)
);
