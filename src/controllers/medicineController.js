import {prisma} from '../prismaClient.js';

export const addMedicine = async (req, res) => {
  try {
    const {
      name,
      manufacturer,
      itemType,
      gst,
      tabletsPerStrip,
      composition,
      hsnCode,
    } = req.body;
    console.log(req.body);
    const existingMedicine = await prisma.medicineItem.findFirst({
      where: { name },
    });
    if (existingMedicine) {
      return res
        .status(400)
        .json({ success: false, message: "Medicine already exists" });
    }
    const medicine = await prisma.medicineItem.create({
      data: {
        name,
        manufacturer,
        itemType: itemType,
        gst,
        tabletsPerStrip,
        composition,
        HSNCode: hsnCode,
      },
    });
    res.status(201).json({ success: true, medicine });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// get all medicines
export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await prisma.medicineItem.findMany();
    res.status(200).json({ success: true, medicines });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const searchMedicines = async (req, res) => {
  try {
    let { query, limit } = req.query;
    const { includeBatches, batchesLimit } = req.query;
    limit = parseInt(limit) || 10;

    // if query is empty, return empty array
    if (!query || query.trim() === "") {
      return res.status(200).json({ success: true, data: [] });
    }

    const includeBatchesFlag = includeBatches === "true" || includeBatches === "1";
    const takeBatches = parseInt(batchesLimit) || 5;

    const medicines = await prisma.medicineItem.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: limit,
      include: includeBatchesFlag
        ? {
            batches: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: "asc" },
              take: takeBatches,
            },
          }
        : undefined,
    });

    res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// get medicine by id
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await prisma.medicineItem.findUnique({
      where: { id: parseInt(id) },
      include: {
        batches: {
          orderBy: { expiryDate: "asc" },
        },
      },
    });
    if (!medicine) {
      return res
        .status(404)
        .json({ success: false, message: "Medicine not found" });
    }
    res.status(200).json({ success: true, medicine });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
