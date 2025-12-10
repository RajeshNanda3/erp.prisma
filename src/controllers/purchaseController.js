import {prisma} from '../prismaClient.js';

export const createPurchase = async (req, res) => {
  try {
    const {
      invoiceNo,
      supplierId,
      supplier,
      totalAmount,
      items,
      medicineId,
      quantity,
      purchaseDate,
      batchNumber,
      expiryDate,
      unitPrice,
    } = req.body;
    console.log(req.body)

    // Check if invoice number ofperticular supplier already exists
    const existingPurchase = await prisma.purchaseTransaction.findFirst({
      where: { invoiceNo, supplierId },
    });
    console.log(existingPurchase);
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists for this supplier",
      });
    }
    // process each item in items array: create/update batches and prepare purchase items
    const purchaseItemsData = [];
    for (const item of items || []) {
      const medId = item.id;
      const medicine = await prisma.medicineItem.findUnique({
        where: { id: parseInt(medId) },
      });
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${medId} not found`,
        });
      }

      // check if this batch already exists for this medicine
      let batch = await prisma.medicineBatch.findFirst({
        where: { MedicineItemId: medId, batchNo: item.batchNo },
      });

      if (batch) {
        // update existing batch quantity
        console.log("batch is there");
        batch = await prisma.medicineBatch.update({
          where: { id: batch.id },
          data: {
            stockQuantity:
              (batch.quantity || 0) + (Number(item.totalTabletStocks) || 0),
            ptr: parseFloat(item.ptr) || batch.ptr,
            mrp: parseFloat(item.mrp) || batch.mrp,
            discount: parseFloat(item.discount) || batch.discount || 0,
            costPrice: parseFloat(item.cost) || batch.costPrice || 0,
          },
        });
      } else {
        // create new batch and capture it
        console.log("batch is not there");
        batch = await prisma.medicineBatch.create({
          data: {
            MedicineItemId: medId,
            batchNo: item.batchNo,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            stockQuantity: Number(item.totalTabletStocks) || 0,
            ptr: parseFloat(item.ptr) || 0,
            mrp: parseFloat(item.mrp) || 0,
            discount: parseFloat(item.discount) || 0,
            costPrice: parseFloat(item.cost) || 0,
          },
        });
      }

      // prepare PurchaseItem create data
      purchaseItemsData.push({
        medicineId: medId,
        batchId: batch?.id ?? null,
        batchNo: item.batchNo,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
        ptr: parseFloat(item.ptr) || 0,
        mrp: parseFloat(item.mrp) || 0,
        discount: parseFloat(item.discount) || 0,
        gst: parseFloat(item.gst) || 0,
        quantityStrips: Number(item.quantityStrips) || 0,
        tabletsPerStrip:
          Number(item.tabletsPerStrip) || medicine.tabletsPerStrip || 0,
        looseTablets: Number(item.looseTablets) || 0,
        free: Number(item.free) || 0,
      });
    }

    const getSupplierId = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    // create purchase transaction with nested purchase items
    const purchase = await prisma.purchaseTransaction.create({
      data: {
        invoiceNo,
        supplierId: getSupplierId.id,
        totalAmount: parseFloat(totalAmount) || 0,
        date: purchaseDate ? new Date(purchaseDate) : new Date(),
        items: {
          create: purchaseItemsData,
        },
      },
      include: { items: true },
    });
    res.status(201).json({ success: true, purchase });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
