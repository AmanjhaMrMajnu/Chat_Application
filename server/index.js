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


const chatSocket = require('./chat/socket');

const PORT = process.env.PORT || 8000;

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
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", process.env.FRONTEND_URL], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

chatSocket(io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// 1. CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// SIMPLE HEALTH CHECK ROUTE
app.get('/', (req, res) => {
    res.send("<h1>Server is Running! 🚀</h1><p>Socket.IO and Auth endpoints are ready.</p>");
});

// 2. REGISTER ROUTE (Updated for Name & Email)
app.post('/api/register', registerUser);

// 3. LOGIN ROUTE (Updated for Email)
app.post('/api/login', loginUser);

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});

module.exports = { app, server, io };
