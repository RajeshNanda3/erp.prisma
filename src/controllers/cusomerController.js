import {prisma} from '../prismaClient.js';

export const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: { phone },
    });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ success: false, message: "Customer already exists with this phone" });
    }

    // Prisma auto-generates id via @default(uuid()), so don't pass it
    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone,
        address: address || null,
      },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// search customers by name or phone
export const searchCustomers = async (req, res) => {
  try {
    let { query, limit } = req.query;
    console.log(req.query)
    limit = parseInt(limit) || 10;
    // if query is empty, return empty array
    if (!query || query.trim() === "") {
      return res.status(200).json({ success: true, data: [] });
    }
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      take: limit,
    });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};