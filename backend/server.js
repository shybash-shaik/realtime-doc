// server.js or app.js
import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from './firebase/admin.js'; // initializes firebase-admin
import { getFirestore } from 'firebase-admin/firestore';
import { Server as SocketIOServer } from 'socket.io';


import authRoutes from './routes/auth.routes.js';
import docsRoutes from './routes/docs.routes.js';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';


dotenv.config();

// ⚙️ Server Setup
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 🧠 Firestore
const db = getFirestore();
const docs = new Map(); // roomName → { doc, awareness }

// Yjs document management
const getYDoc = (roomName) => {
  if (!docs.has(roomName)) {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    
    // Set up awareness for cursor positions and user info
    awareness.setLocalStateField('user', {
      name: 'Anonymous',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    docs.set(roomName, { doc, awareness });
  }
  return docs.get(roomName);
};





// 🧩 Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// 🔗 Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docsRoutes);

// 🔌 Socket.IO connection for Yjs collaboration
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-document', (roomName, userInfo) => {
    socket.join(roomName);
    const { doc, awareness } = getYDoc(roomName);
    
    // Update user info in awareness
    if (userInfo) {
      awareness.setLocalStateField('user', {
        name: userInfo.name || 'Anonymous',
        color: userInfo.color || '#' + Math.floor(Math.random() * 16777215).toString(16),
        id: userInfo.id || Math.random().toString(36).substr(2, 9)
      });
    }
    
    console.log(`User joined document: ${roomName}`);
    
    // Send current document state to the new user
    socket.emit('document-state', {
      content: '', // For now, start with empty content
      users: Array.from(awareness.getStates().values())
    });
  });
  
  // Handle Yjs document updates
  socket.on('yjs-update', (roomName, update) => {
    const { doc } = getYDoc(roomName);
    Y.applyUpdate(doc, new Uint8Array(update));
    
    // Broadcast to other clients in the same room
    socket.to(roomName).emit('yjs-update', update);
  });
  

  
  socket.on('leave-document', (roomName) => {
    socket.leave(roomName);
    console.log(`User left document: ${roomName}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});



// 🧪 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
