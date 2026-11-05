import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { initializeSocketIO } from './config/socket.js';
import { roomManager } from './rooms/roomManager.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app);

// Security & Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allow embedding and rich media
}));

app.use(cors({
  origin: true, // Allow any valid origin or Render domain
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health Check API
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'CineMate Real-Time Engine',
  });
});

// Room Status Check API
app.get('/api/rooms/:roomId/status', (req, res) => {
  const roomId = req.params.roomId.toUpperCase().trim();
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ exists: false, message: 'Room not found' });
  }

  const activeParticipants = room.participants.filter((p) => p.connectionStatus === 'connected');
  return res.json({
    exists: true,
    roomId: room.roomId,
    participantCount: activeParticipants.length,
    isFull: activeParticipants.length >= config.maxParticipantsPerRoom,
    hasMedia: !!room.mediaUrl,
  });
});

// WebRTC ICE / TURN Configuration API for clients
app.get('/api/webrtc/config', (_req, res) => {
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  if (config.turnUrl && config.turnUsername && config.turnCredential) {
    iceServers.push({
      urls: config.turnUrl,
      username: config.turnUsername,
      credential: config.turnCredential,
    });
  }

  res.json({ iceServers });
});

// Serve frontend static files if built (for unified deployment on Render)
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
const altClientDistPath = path.resolve(process.cwd(), 'client/dist');
const finalDistPath = fs.existsSync(altClientDistPath) ? altClientDistPath : clientDistPath;

if (fs.existsSync(finalDistPath)) {
  logger.info(`Serving static client files from ${finalDistPath}`);
  app.use(express.static(finalDistPath));

  app.get('*', (req, res, next) => {
    // Skip API or socket routes
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(finalDistPath, 'index.html'));
  });
}

// Initialize WebSockets
initializeSocketIO(server);

// Start Server
const PORT = process.env.PORT || config.port;
server.listen(PORT, () => {
  logger.info(`🎬 CineMate Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server };
