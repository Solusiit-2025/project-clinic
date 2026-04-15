import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Route Imports
import siteSettingRoutes from './routes/siteSetting.routes';
import authRoutes from './routes/auth.routes';
import masterRoutes from './routes/master.routes';
import transactionRoutes from './routes/transaction.routes';
import financeRoutes from './routes/finance.routes';
import backupRoutes from './routes/backup.routes';
import clinicalRoutes from './routes/clinical.routes';
import publicRoutes from './routes/public.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import inventoryRoutes from './routes/inventory.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routers/controllers
app.set('io', io);

// Socket Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  
  socket.on('join-clinic', (clinicId: string) => {
    if (clinicId) {
      socket.join(`clinic:${clinicId}`);
      console.log(`[Socket] User joined clinic room: clinic:${clinicId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/settings', siteSettingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', socketConnected: io.sockets.adapter.rooms.size });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
