# Collaborative Document App

## Prerequisites
- Node.js (v18+ recommended)
- npm
- Firebase project with Firestore enabled
- Service account credentials for Firebase Admin SDK

## Setup

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd project-root
```

### 2. Backend Setup
```sh
cd backend
npm install
# Copy .env.example to .env and fill in your Firebase credentials
cp env.example .env
npm start
```

### 3. Frontend Setup
```sh
cd ../frontend
npm install
# Copy env.example to .env and set VITE_API_URL if needed
cp env.example .env
npm run dev
```

### 4. Environment Variables

**backend/.env**
```
PORT=5000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

---

## API Documentation

See [api.md](./api.md) for detailed endpoint documentation.

## Architecture

### System Overview
- **Frontend:** React + Vite with real-time collaboration via Socket.IO
- **Backend:** Node.js + Express with Firebase Admin SDK
- **Database:** Firestore (NoSQL)
- **Real-time:** Yjs + Socket.IO for collaborative editing

### Database Schema

**Documents Collection:**
```javascript
{
  id: "auto-generated",
  title: "string",
  content: "string (HTML)",
  folder: "string",
  userId: "string (creator)",
  permissions: [{ userId: "string", role: "admin|editor|viewer" }],
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

**Folders Collection:**
```javascript
{
  id: "auto-generated", 
  name: "string",
  userId: "string (owner)",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### Permission Roles
- **Admin:** Full control (CRUD + permissions)
- **Editor:** Read and edit content
- **Viewer:** Read-only access

## Deployment Guide

- Deploy backend to a Node.js-compatible host (Heroku, Render, GCP, etc.)
- Deploy frontend to Vercel, Netlify, or Firebase Hosting
- Set environment variables in your deployment environment
- Make sure backend and frontend URLs are set correctly for CORS 