import { prisma } from "../prismaClient.js";

/**
 * generateMedicationReports - generate MedicationReport rows for the given period.
 * params: { from: Date|null, to: Date|null }
 * If from/to not provided, defaults to last 30 days.
 */
export const generateMedicationReports = async ({
  from = null,
  to = null,
} = {}) => {
  const now = new Date();
  const defaultTo = now;
  const defaultFrom = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30); // last 30 days
  const periodStart = from || defaultFrom;
  const periodEnd = to || defaultTo;

  // Aggregate sales per medicine
  const sales = await prisma.saleItem.groupBy({
    by: ["medicineId"],
    where: { sale: { date: { gte: periodStart, lte: periodEnd } } },
    _sum: { stockQuantity: true, itemTotal: true },
    _count: { id: true },
  });

  // Fetch purchases in period to compute purchased tablets per medicine
  const purchases = await prisma.purchaseItem.findMany({
    where: { purchase: { date: { gte: periodStart, lte: periodEnd } } },
    select: {
      medicineId: true,
      quantityStrips: true,
      tabletsPerStrip: true,
      looseTablets: true,
    },
  });

  const purchasesByMed = {};
  for (const p of purchases) {
    const med = p.medicineId;
    const strips = p.quantityStrips || 0;
    const perStrip = p.tabletsPerStrip || 0;
    const loose = p.looseTablets || 0;
    const tablets = strips * perStrip + loose;
    purchasesByMed[med] = (purchasesByMed[med] || 0) + tablets;
  }

  const createdReports = [];
  for (const s of sales) {
    const medId = s.medicineId;
    const sold = s._sum.stockQuantity || 0;
    const revenue = s._sum.itemTotal || 0;
    const avgSellingPrice = sold ? revenue / sold : null;
    const purchased = purchasesByMed[medId] || 0;

    const report = await prisma.medicationReport.create({
      data: {
        medicineId: medId,
        periodStart,
        periodEnd,
        totalSold: sold,
        totalPurchased: purchased,
        avgSellingPrice: avgSellingPrice,
      },
    });
    createdReports.push(report);
  }

  return {
    periodStart,
    periodEnd,
    count: createdReports.length,
    reports: createdReports,
  };
};

export default generateMedicationReports;
