// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export default prisma;
