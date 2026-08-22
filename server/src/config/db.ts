import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function connectDB(): Promise<typeof mongoose | null> {
  let uri = env.MONGODB_URI;

  if (uri) {
    try {
      const conn = await timeoutPromise(5000, mongoose.connect(uri));
      console.log(`✅ MongoDB connected successfully to: ${mongoose.connection.host}`);
      isConnected = true;
      return conn;
    } catch (error: any) {
      console.warn('⚠️ MONGODB_URI connection unavailable:', error.message);
    }
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    console.log('ℹ️ Attempting to start in-memory MongoDB (5s limit)...');
    const mongod = await timeoutPromise(5000, MongoMemoryServer.create());
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`✅ In-memory MongoDB connected successfully to: ${memoryUri}`);
    isConnected = true;
    return conn;
  } catch (err: any) {
    console.log('ℹ️ Operating in resilient in-memory mode for services, records, and policies.');
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  if (isConnected && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
