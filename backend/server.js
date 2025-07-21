import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import admin from "./firebase/admin.js";
import { getFirestore } from "firebase-admin/firestore";
import { Server as SocketIOServer } from "socket.io";
import { encodeStateAsUpdate, applyUpdate, Doc } from "yjs";
import { Buffer } from "buffer";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import docsRoutes from "./routes/docs.routes.js";
import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate } from "y-protocols/awareness.js";
import commentRoutes from './routes/comments.routes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const db = getFirestore();
const docs = new Map();

async function saveYDocToFirestore(roomName) {
  const room = docs.get(roomName);
  if (!room || !room.doc) return;
  const update = encodeStateAsUpdate(room.doc);
  const docId = roomName.replace(/^document-/, "");
  await db
    .collection("documents")
    .doc(docId)
    .set(
      {
        content: Buffer.from(update).toString("base64"),
        updatedAt: new Date(),
      },
      { merge: true }
    );
}

async function loadYDocFromFirestore(roomName) {
  const docId = roomName.replace(/^document-/, "");
  const docSnap = await db.collection("documents").doc(docId).get();
  if (!docSnap.exists) return null;
  const data = docSnap.data();
  if (typeof data.content === "string" && data.content.length > 0) {
    try {
      const ydoc = new Doc();
      const update = Buffer.from(data.content, "base64");
      applyUpdate(ydoc, update);
      return ydoc;
    } catch (e) {
      console.error("Failed to decode Yjs update from Firestore:", e);
      await db
        .collection("documents")
        .doc(docId)
        .update({ content: "", updatedAt: new Date() });
      return new Doc();
    }
  }
  return null;
}

const getYDoc = async (roomName) => {
  if (!docs.has(roomName)) {
    let doc = await loadYDocFromFirestore(roomName);
    if (!doc) doc = new Y.Doc();
    const awareness = new Awareness(doc);
    awareness.setLocalStateField("user", {
      name: "Anonymous",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      id: Math.random().toString(36).substr(2, 9),
    });
    docs.set(roomName, { doc, awareness, users: new Set() });
  }
  return docs.get(roomName);
};

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api', commentRoutes);
app.use("/api/docs", docsRoutes);


app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-document", async (roomName, userInfo) => {
    socket.join(roomName);
    const room = await getYDoc(roomName);
    room.users.add(socket.id);
    const { doc, awareness } = room;

    if (userInfo) {
      awareness.setLocalStateField("user", {
        name: userInfo.name || "Anonymous",
        color:
          userInfo.color ||
          "#" + Math.floor(Math.random() * 16777215).toString(16),
        id: userInfo.id || Math.random().toString(36).substr(2, 9),
      });
    }

    console.log(`User joined document: ${roomName}`);

    const update = Y.encodeStateAsUpdate(doc);
    socket.emit("document-state", {
      content: Buffer.from(update).toString("base64"),
      users: Array.from(awareness.getStates().values()),
    });
  });

  socket.on("yjs-update", async (roomName, update) => {
    const room = await getYDoc(roomName);
    Y.applyUpdate(room.doc, new Uint8Array(update));
    socket.to(roomName).emit("yjs-update", update);
  });

  socket.on("leave-document", async (roomName) => {
    socket.leave(roomName);
    const room = docs.get(roomName);
    if (room) {
      room.users.delete(socket.id);
      if (room.users.size === 0) {
        await saveYDocToFirestore(roomName);
        docs.delete(roomName);
      }
    }
    console.log(`User left document: ${roomName}`);
  });

  socket.on("awareness-update", (roomName, update) => {
    socket.to(roomName).emit("awareness-update", update);
  });

  socket.on("disconnect", async () => {
    for (const [roomName, room] of docs.entries()) {
      room.users.delete(socket.id);
      if (room.users.size === 0) {
        await saveYDocToFirestore(roomName);
        docs.delete(roomName);
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
