import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { QuestionEngine } from './questionEngine.js';
import { RoomManager } from './roomManager.js';
import { ClientToServerEvents, ServerToClientEvents } from './types.js';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 2e7, // 20MB for photos, videos, and voice notes
  pingTimeout: 30000,
  pingInterval: 15000
});

const questionEngine = new QuestionEngine();
const roomManager = new RoomManager(io, questionEngine);

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend static build in production
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

app.get('/api/stats', (req, res) => {
  const counts = questionEngine.getTotalCounts();
  res.json({
    truthsCount: counts.truths,
    daresCount: counts.dares,
    totalQuestions: counts.total,
    activeRooms: (roomManager as any).rooms?.size || 0
  });
});

app.get('/api/categories', (req, res) => {
  res.json({
    truthCategories: questionEngine.getCategories('truth'),
    dareCategories: questionEngine.getCategories('dare')
  });
});

app.get('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = roomManager.getRoom(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    code: room.code,
    phase: room.phase,
    playerCount: room.players.length,
    settings: room.settings
  });
});

// WebSocket connection lifecycle
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('createRoom', (data, callback) => {
    try {
      const { code, token, room } = roomManager.createRoom(
        socket.id, 
        data.name, 
        data.avatar, 
        data.settings
      );
      socket.join(code);
      socket.data = { roomCode: code, token };
      callback({ success: true, code, token, state: room });
      roomManager.broadcastRoom(code);
    } catch (err: any) {
      console.error('[Socket] createRoom error:', err);
      callback({ success: false, error: err.message || 'Failed to create room.' });
    }
  });

  socket.on('joinRoom', (data, callback) => {
    try {
      const code = data.code.toUpperCase().trim();
      const res = roomManager.joinRoom(
        code, 
        socket.id, 
        data.name, 
        data.avatar, 
        data.token
      );

      if (res.success && res.room) {
        socket.join(code);
        socket.data = { roomCode: code, token: res.token };
        callback({ success: true, state: res.room, token: res.token });
        roomManager.broadcastRoom(code);
      } else {
        callback({ success: false, error: res.error || 'Failed to join room.' });
      }
    } catch (err: any) {
      console.error('[Socket] joinRoom error:', err);
      callback({ success: false, error: 'Internal error joining room.' });
    }
  });

  socket.on('reconnectSession', (data, callback) => {
    try {
      const code = data.code.toUpperCase().trim();
      const res = roomManager.joinRoom(code, socket.id, '', '', data.token);
      if (res.success && res.room) {
        socket.join(code);
        socket.data = { roomCode: code, token: data.token };
        callback({ success: true, state: res.room });
        roomManager.broadcastRoom(code);
      } else {
        callback({ success: false, error: res.error || 'Session expired or not found.' });
      }
    } catch (err: any) {
      console.error('[Socket] reconnectSession error:', err);
      callback({ success: false, error: 'Reconnection failed.' });
    }
  });

  const resolveCode = (data?: any): string | undefined => {
    return data?.code || socket.data?.roomCode || roomManager.findRoomBySocketId(socket.id)?.code;
  };

  socket.on('toggleReady', (data) => {
    const code = resolveCode(data);
    if (code) {
      roomManager.toggleReady(code, socket.id);
    }
  });

  socket.on('updateSettings', (settings) => {
    const code = resolveCode(settings);
    if (code) {
      roomManager.updateSettings(code, socket.id, settings);
    }
  });

  socket.on('addCustomQuestion', (q) => {
    const code = resolveCode(q);
    if (code) {
      roomManager.addCustomQuestion(code, socket.id, q);
    }
  });

  socket.on('startGame', (data) => {
    const code = resolveCode(data);
    console.log(`[Socket] Received startGame request for room: ${code} from socket ${socket.id}`);
    if (code) {
      roomManager.startGame(code, socket.id);
    } else {
      console.warn(`[Socket] startGame failed: unable to resolve room code for socket ${socket.id}`);
    }
  });

  socket.on('chooseType', (data) => {
    const choice = typeof data === 'string' ? data : data?.choice;
    const code = resolveCode(data);
    if (code && choice) {
      roomManager.chooseType(code, socket.id, choice);
    }
  });

  socket.on('typeAnswer', (data) => {
    const text = typeof data === 'string' ? data : data?.text;
    const code = resolveCode(data);
    if (code) {
      roomManager.handleTypeAnswer(code, socket.id, text);
    }
  });

  socket.on('completeQuestion', (data) => {
    const code = resolveCode(data);
    if (code) {
      roomManager.completeQuestion(code, socket.id, data);
    }
  });

  socket.on('skipQuestion', (data) => {
    const code = resolveCode(data);
    if (code) {
      roomManager.skipQuestion(code, socket.id);
    }
  });

  socket.on('sendChatMessage', (data) => {
    const code = resolveCode(data);
    if (code) {
      roomManager.sendChatMessage(code, socket.id, data);
    }
  });

  socket.on('sendReaction', (data) => {
    const emoji = typeof data === 'string' ? data : data?.emoji;
    const code = resolveCode(data);
    if (code && emoji) {
      roomManager.sendReaction(code, socket.id, emoji);
    }
  });

  socket.on('playAgain', (data) => {
    const code = resolveCode(data);
    if (code) {
      roomManager.playAgain(code, socket.id);
    }
  });

  socket.on('resetToLobby', (data) => {
    const code = resolveCode(data);
    if (code) {
      roomManager.resetToLobby(code);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

// Wildcard SPA route to serve client index.html
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath);
});

httpServer.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 TRUTH & DARE Server running on http://localhost:${PORT}`);
  console.log(`✨ Real-time multiplayer engine initialized`);
  console.log(`=================================================\n`);
});
