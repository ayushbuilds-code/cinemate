import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.SERVER_PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  turnUrl: process.env.TURN_URL || '',
  turnUsername: process.env.TURN_USERNAME || '',
  turnCredential: process.env.TURN_CREDENTIAL || '',
  maxParticipantsPerRoom: 2,
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMaxRequests: 200,
};

