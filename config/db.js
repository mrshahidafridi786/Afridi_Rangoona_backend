import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let memoryServerInstance = null;

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/afridi_rangoona';

  try {
    const isRemote = primaryUri.includes('mongodb+srv') || (!primaryUri.includes('127.0.0.1') && !primaryUri.includes('localhost'));
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: isRemote ? 10000 : 2500,
    });
    console.log(`[Database] Connected successfully to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Primary MongoDB connection failed (${err.message}). Initializing fallback MongoMemoryServer for development/testing...`);
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const inMemoryUri = memoryServerInstance.getUri();
      
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] Embedded in-memory MongoDB initialized successfully at: ${inMemoryUri}`);
      return conn;
    } catch (memErr) {
      console.error(`[Database Critical Error] Failed to boot fallback MongoDB: ${memErr.message}`);
      process.exit(1);
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};
