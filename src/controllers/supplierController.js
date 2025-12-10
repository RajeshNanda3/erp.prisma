import {prisma} from '../prismaClient.js';


export const addSupplier   = async (req, res) => {
  try {
    const { name, contactPerson, contact, email,drugLicenseNo,gstNumber, address } = req.body;
    console.log(req.body)
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        OR: [
          { name },
          { email }
        ]
      },
    });
    if (existingSupplier) {
      return res.status(400).json({ success: false, message: "Supplier with this name or email already exists" });
    }
    const supplier = await prisma.supplier.create({
      data: {
        name,contactPerson,contact,email,drugLicenseNo,gstNumber,address
      },
    });
    res.status(201).json({ success: true, supplier });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }};
  // get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.status(200).json({ success: true, suppliers });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }};