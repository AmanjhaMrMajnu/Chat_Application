require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { registerUser, loginUser } = require('./controllers/authController');

// --- SAFETY CHECKS ---
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in .env file");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

// --- GLOBAL ERROR HANDLERS ---
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully...');
  console.error('Error:', error.name, error.message);
  console.error('Stack:', error.stack);
  // Give time for logging before exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION! Promise:', promise, 'Reason:', reason);
  // Log but don't exit - continue running
});

// --- GRACEFUL SHUTDOWN HANDLER ---
let isShuttingDown = false;
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};


const chatSocket = require('./chat/socket');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const PORT = process.env.PORT || 8000;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(requestLogger); // Log all requests

app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", process.env.FRONTEND_URL], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON:', err.message);
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next(err);
});

// Initialize socket with error handling
try {
  chatSocket(io);
  console.log('✅ Socket.IO handlers initialized');
} catch (error) {
  console.error('❌ Failed to initialize Socket.IO handlers:', error);
  // Continue running even if socket initialization fails
}

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 1. CONNECT TO MONGODB WITH RETRY LOGIC
mongoose.set('strictQuery', false);

const connectWithRetry = async (retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log("✅ Connected to MongoDB");
      return;
    } catch (err) {
      console.error(`❌ MongoDB Connection Error (Attempt ${i + 1}/${retries}):`, err.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  console.error('❌ Failed to connect to MongoDB after maximum retries');
  // Don't exit - allow server to run without DB (degraded mode)
};

// MongoDB event handlers
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
  if (!isShuttingDown) {
    setTimeout(() => connectWithRetry(3), RETRY_DELAY);
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Initial connection
connectWithRetry();

// HEALTH CHECK ROUTES
app.get('/', (req, res) => {
    res.send("<h1>Server is Running! 🚀</h1><p>Socket.IO and Auth endpoints are ready.</p>");
});

app.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  const httpStatus = mongoose.connection.readyState === 1 ? 200 : 503;
  res.status(httpStatus).json(health);
});

app.get('/api/status', (req, res) => {
  res.json({
    server: 'online',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

// 2. REGISTER ROUTE (Updated for Name & Email)
app.post('/api/register', async (req, res, next) => {
  try {
    await registerUser(req, res);
  } catch (error) {
    next(error);
  }
});

// 3. LOGIN ROUTE (Updated for Email)
app.post('/api/login', async (req, res, next) => {
  try {
    await loginUser(req, res);
  } catch (error) {
    next(error);
  }
});

// 404 Handler - Must be after all routes
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global Error Handler - Must be last
app.use(errorHandler);

// Start Server with Error Handling
const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🚀 Server started successfully`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Socket.IO: Ready`);
      console.log(`💾 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
      console.log(`${'='.repeat(50)}\n`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Port ${PORT} requires elevated privileges`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
