import { prisma } from "../prismaClient.js";

// GET /api/reports/batches/:batchId/transactions
export const getBatchTransactions = async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    if (!batchId)
      return res
        .status(400)
        .json({ success: false, message: "batchId required" });

    const transactions = await prisma.saleItem.findMany({
      where: { batchId },
      include: {
        sale: {
          select: { id: true, invoiceNo: true, date: true, customerName: true },
        },
        medicine: { select: { id: true, name: true } },
        batch: { select: { id: true, batchNo: true, expiryDate: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Internal error" });
  }
};

// GET /api/reports/medicines/:medicineId?from=&to=
export const getMedicineSummary = async (req, res) => {
  try {
    const medicineId = parseInt(req.params.medicineId);
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    if (!medicineId)
      return res
        .status(400)
        .json({ success: false, message: "medicineId required" });

    // Aggregate sales for this medicine
    const salesAgg = await prisma.saleItem.groupBy({
      by: ["medicineId"],
      where: { medicineId, sale: { date: { gte: from, lte: to } } },
      _sum: { stockQuantity: true, itemTotal: true },
      _count: { id: true },
    });

    // Aggregate purchases for this medicine (fetch then compute tablets)
    const purchases = await prisma.purchaseItem.findMany({
      where: { medicineId, purchase: { date: { gte: from, lte: to } } },
      select: {
        id: true,
        medicineId: true,
        quantityStrips: true,
        tabletsPerStrip: true,
        looseTablets: true,
        ptr: true,
        mrp: true,
      },
    });

    let purchasedTablets = 0;
    for (const p of purchases) {
      const strips = p.quantityStrips || 0;
      const perStrip = p.tabletsPerStrip || 0;
      const loose = p.looseTablets || 0;
      purchasedTablets += strips * perStrip + loose;
    }

    const agg = salesAgg[0] || { _sum: {}, _count: {} };
    const soldTablets = agg._sum.stockQuantity || 0;
    const totalRevenue = agg._sum.itemTotal || 0;
    const avgSellingPrice = soldTablets ? totalRevenue / soldTablets : null;

    res.json({
      success: true,
      data: {
        medicineId,
        soldTablets,
        totalRevenue,
        avgSellingPrice,
        purchasedTablets,
        salesCount: agg._count.id || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Internal error" });
  }
};

import { generateMedicationReports } from "../jobs/generateMedicationReports.js";

// POST /api/reports/generate?from=&to=
export const triggerGenerateReports = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const result = await generateMedicationReports({ from, to });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Internal error" });
  }
};

// GET /api/reports/list?from=&to=&medicineId=
export const getReports = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const medicineId = req.query.medicineId
      ? parseInt(req.query.medicineId)
      : undefined;
    const where = { periodStart: { gte: from }, periodEnd: { lte: to } };
    if (medicineId) where.medicineId = medicineId;
    const reports = await prisma.medicationReport.findMany({
      where,
      orderBy: { periodStart: "desc" },
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Internal error" });
  }
};

// GET /api/reports/sales?startDate=&endDate=
export const getSalesReport = async (req, res) => {
  try {
    const start = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(0);
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const sales = await prisma.saleTransaction.findMany({
      where: { date: { gte: start, lte: end } },
      select: {
        invoiceNo: true,
        customerName: true,
        date: true,
        totalAmount: true,
      },
      orderBy: { date: "desc" },
    });

    // Format response to match frontend expectation: response.data.report
    const report = sales.map((s) => ({
      invoiceNo: s.invoiceNo,
      customerName: s.customerName,
      saleDate: s.date,
      totalAmount: s.totalAmount,
    }));

    res.json({ success: true, report });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Internal error" });
  }
};

// GET /api/reports/profit?startDate=&endDate=
export const getProfitReport = async (req, res) => {
  try {
    const start = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(0);
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Fetch sales with items and batch info to compute profit
    const sales = await prisma.saleTransaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { items: { include: { batch: true } } },
      orderBy: { date: "desc" },
    });

    const report = [];
    let totalProfit = 0;
    let totalRevenue = 0;

    for (const s of sales) {
      let saleProfit = 0;
      let saleRevenue = 0;
      for (const it of s.items) {
        const qty = it.stockQuantity || 0;
        const sellingPer =
          it.sellingPrice || (it.itemTotal && qty ? it.itemTotal / qty : 0);
        const costPer = it.batch && it.batch.costPrice ? it.batch.costPrice : 0;
        const itemRevenue = it.itemTotal || sellingPer * qty || 0;
        const itemCost = costPer * qty;
        const itemProfit = itemRevenue - itemCost;
        saleProfit += itemProfit;
        saleRevenue += itemRevenue;
      }
      totalProfit += saleProfit;
      totalRevenue += saleRevenue;
      report.push({
        invoiceNo: s.invoiceNo,
        customerName: s.customerName,
        saleDate: s.date,
        totalAmount: s.totalAmount,
        revenue: saleRevenue,
        profit: saleProfit,
      });
    }

    res.json({
      success: true,
      report,
      totals: { totalRevenue, totalProfit, count: report.length },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Internal error" });
  }
};

export default {
  getBatchTransactions,
  getMedicineSummary,
  triggerGenerateReports,
  getReports,
  getSalesReport,
  getProfitReport,
};
