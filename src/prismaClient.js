  // import { PrismaClient } from './generated/prisma/client'
  // export const prisma = new PrismaClient();
  // export default prisma;

// import pkg from '@prisma/client';
// const { PrismaClient } = pkg;

// const prisma = new PrismaClient();
// export default prisma;

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default prisma;
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "../generated/prisma/index.js";
const connectionString = `${process.env.DATABASE_URL}`


const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({adapter});
// const globalForPrisma = globalThis;

// export const prisma = globalForPrisma.prisma || new PrismaClient({adapter});

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;