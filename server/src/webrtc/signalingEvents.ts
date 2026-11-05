import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { webrtcSignalSchema } from '../middleware/validation.js';

export function setupWebRTCEvents(io: Server, socket: Socket) {
  // WebRTC Ready - announced when participant enters call
  socket.on('webrtc:ready', (data: { roomId: string }) => {
    logger.info(`Socket ${socket.id} is ready for WebRTC in room ${data.roomId}`);
    // Notify peer in the room that this socket is ready to initiate or receive offer
    socket.to(data.roomId).emit('webrtc:peer-ready', {
      peerSocketId: socket.id,
    });
  });

  // SDP Offer
  socket.on('webrtc:offer', (data: { roomId: string; targetSocketId?: string; offer: any }) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('webrtc:offer', {
        senderSocketId: socket.id,
        offer: data.offer,
      });
    } else {
      socket.to(data.roomId).emit('webrtc:offer', {
        senderSocketId: socket.id,
        offer: data.offer,
      });
    }
  });

  // SDP Answer
  socket.on('webrtc:answer', (data: { roomId: string; targetSocketId?: string; answer: any }) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('webrtc:answer', {
        senderSocketId: socket.id,
        answer: data.answer,
      });
    } else {
      socket.to(data.roomId).emit('webrtc:answer', {
        senderSocketId: socket.id,
        answer: data.answer,
      });
    }
  });

  // ICE Candidate exchange
  socket.on('webrtc:ice-candidate', (data: { roomId: string; targetSocketId?: string; candidate: any }) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('webrtc:ice-candidate', {
        senderSocketId: socket.id,
        candidate: data.candidate,
      });
    } else {
      socket.to(data.roomId).emit('webrtc:ice-candidate', {
        senderSocketId: socket.id,
        candidate: data.candidate,
      });
    }
  });

  // End Call / Hangup
  socket.on('webrtc:hangup', (data: { roomId: string }) => {
    logger.info(`Socket ${socket.id} hung up call in room ${data.roomId}`);
    socket.to(data.roomId).emit('webrtc:peer-hangup', {
      senderSocketId: socket.id,
    });
  });

  // Media Track toggle states (camera / mic mute sync)
  socket.on('webrtc:media-state', (data: { roomId: string; hasCamera: boolean; hasMic: boolean }) => {
    socket.to(data.roomId).emit('webrtc:peer-media-state', {
      senderSocketId: socket.id,
      hasCamera: data.hasCamera,
      hasMic: data.hasMic,
    });
  });
}

