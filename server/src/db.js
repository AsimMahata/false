import mongoose from 'mongoose';
import { config } from './config.js';

let isConnected = false;

export async function connectDB(customUri) {
  // Re-use existing connection in serverless or long-running environments
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  const uri = customUri || config.mongoUri;
  try {
    const conn = await mongoose.connect(uri, {
      dbName: config.dbName,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB Atlas connection error: ${error.message}`);
    // If local network or VPN blocks Atlas connection, fall back so local site works seamlessly
    if (config.nodeEnv !== 'production' || process.env.ALLOW_FALLBACK === 'true') {
      console.log('Activating local MongoDB database for local session...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        const memConn = await mongoose.connect(memUri, { dbName: config.dbName });
        isConnected = true;
        console.log('Connected to local database successfully!');
        return memConn;
      } catch (memErr) {
        console.error('Memory server fallback error:', memErr.message);
      }
    }
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  isConnected = false;
}
