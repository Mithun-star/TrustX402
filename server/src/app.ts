import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiRouter } from './routes/api.js';
import { seedServiceRegistry } from './services/registry/ServiceRegistry.js';

const app = express();

// Security & Cors Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Mounting API Router
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

let serverInstance: Server | null = null;

export async function startServer(): Promise<Server | null> {
  if (serverInstance) return serverInstance;

  await connectDB();
  await seedServiceRegistry();

  return new Promise((resolve) => {
    const s = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 TRUSTX Gateway Server is running!`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`🔗 Network: ${env.X402_NETWORK}`);
      console.log(`⚡ Facilitator: ${env.FACILITATOR_URL}`);
      console.log(`====================================================`);
      serverInstance = s;
      resolve(s);
    });

    s.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`ℹ️ Server port ${env.PORT} already in use. Reusing running server instance.`);
        resolve(null);
      } else {
        console.error('❌ Server listen error:', err);
        resolve(null);
      }
    });
  });
}

if (process.env.AUTO_START === 'true') {
  startServer();
}

export default app;
