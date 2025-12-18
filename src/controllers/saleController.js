import { prisma } from "../prismaClient.js";

export const createSale = async (req, res) => {
  try {
    const { invoiceNo, customerId, customerName, items, totalAmount, saleDate } =
      req.body;
    // console.log(req.body);
    console.log("hii rajesh", customerId);
    // console.log(customerName)
    // process each item in items array: create sale items
    const saleItemsCreate = [];
    for (const it of items || []) {
      const medicineId = parseInt(it.medicineId || it.id);
      const batchNo = it.batchNo || it.batchNumber;
      const quantityStrips = it.quantityStrips || 0;
      const stockQuantity = parseInt(it.totalTabletStocks || 0);
      const looseTablets = parseInt(it.loose || 0);
      const mrp = parseFloat(it.mrp || 0);
      const discount = parseFloat(it.discount || 0);
      const gst = isNaN(parseFloat(it.gst)) ? 0 : parseFloat(it.gst);
      const itemTotal = parseFloat(it.total || it.itemTotal || 0);
      const sellingPrice = stockQuantity
        ? itemTotal / stockQuantity
        : itemTotal;
      const customerId = req.body.customerId;
      // console.log(
      //   customerId,
      //   medicineId,
      //   batchNo,
      //   stockQuantity,
      //   looseTablets,
      //   mrp,
      //   discount,
      //   gst,
      //   itemTotal,
      //   customerName
      // );
      if (!medicineId)
        throw { status: 400, message: "medicineId is required for each item" };
      if (!stockQuantity || stockQuantity <= 0)
        throw { status: 400, message: "stockQuantity must be > 0" };
      const medicine = await prisma.medicineItem.findUnique({
        where: { id: medicineId },
      });
      if (!medicine)
        throw {
          status: 404,
          message: `Medicine with id ${medicineId} not found`,
        };

      // Prefer explicit batchNo if provided, otherwise pick earliest-expiry batch with stock
      const batch = batchNo
        ? await prisma.medicineBatch.findFirst({
            where: { MedicineItemId: medicineId, batchNo },
          })
        : await prisma.medicineBatch.findFirst({
            where: { MedicineItemId: medicineId, stockQuantity: { gt: 0 } },
            orderBy: { expiryDate: "asc" },
          });

      if (!batch)
        throw {
          status: 404,
          message: `Batch not found for medicine ${medicine.name}`,
        };

      if (batch.stockQuantity < stockQuantity)
        throw {
          status: 400,
          message: `Insufficient stock for ${medicine.name} (batch ${batch.batchNo})`,
        };

      // Deduct the strips from the batch
      await prisma.medicineBatch.update({
        where: { id: batch.id },
        data: { stockQuantity: batch.stockQuantity - stockQuantity },
      });

      saleItemsCreate.push({
        medicineId: medicineId,
        batchId: batch.id,
        quantityStrips: quantityStrips,
        stockQuantity: stockQuantity,
        looseTablets: looseTablets,
        mrp: mrp,
        discount: discount,
        sellingPrice: sellingPrice,
        gst: gst,
        itemTotal: itemTotal,
      });
    }

    const created = await prisma.saleTransaction.create({
      data: {
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
        // If schema defines a relation `customer` (no scalar `customerId`), connect it.
        customerId: customerId ?? null,
        customerName: customerName || null,
        totalAmount: parseFloat(totalAmount),
        date: saleDate ? new Date(saleDate) : new Date(),
        items: { create: saleItemsCreate },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error && error.status && error.message) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export default { createSale };
