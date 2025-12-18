import express from "express";
import reportController from "../controllers/reportController.js";

const router = express.Router();

router.get(
  "/batches/:batchId/transactions",
  reportController.getBatchTransactions
);
router.get(
  "/medicines/:medicineId/summary",
  reportController.getMedicineSummary
);
router.post("/generate", reportController.triggerGenerateReports);
router.get("/list", reportController.getReports);
router.get("/sales", reportController.getSalesReport);
router.get("/profit", reportController.getProfitReport);

export default router;
