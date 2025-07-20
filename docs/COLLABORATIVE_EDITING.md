# Collaborative Document Editing

This project implements a Notion-like collaborative document editing feature using real-time WebSocket connections and Yjs for conflict resolution.

## Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Live Cursor Tracking**: See where other users are typing in real-time
- **Rich Text Editor**: Powered by TipTap with support for:
  - Bold, italic text
  - Bullet and numbered lists
  - Code blocks with syntax highlighting
  - Tables
  - Headers
- **Document Management**: Create, view, and delete documents
- **User Awareness**: See who's currently editing the document

## Technology Stack

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **Yjs** for conflict resolution and document synchronization
- **WebSocket** for Yjs protocol
- **Firebase Firestore** for document metadata storage

### Frontend
- **React** with Vite
- **TipTap** rich text editor
- **Yjs** for client-side document management
- **Socket.IO Client** for real-time updates
- **Tailwind CSS** for styling

## How It Works

1. **Document Creation**: Users can create new documents through the web interface
2. **Real-time Editing**: When a user opens a document, they connect to a WebSocket room
3. **Conflict Resolution**: Yjs handles merging concurrent edits automatically
4. **Cursor Tracking**: Collaboration cursors show where other users are typing
5. **Persistence**: Document metadata is stored in Firestore

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Firebase project with Firestore enabled

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase credentials:
   - Create a Firebase service account key
   - Place it in `backend/firebase/serviceAccountKey.json`
   - Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

4. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Usage

1. **Access the Application**: Open `http://localhost:5173` in your browser
2. **Create a Document**: Click "New Document" and enter a title
3. **Start Editing**: The document will open in the collaborative editor
4. **Invite Others**: Share the document URL with others
5. **Real-time Collaboration**: See other users' cursors and edits in real-time

## API Endpoints

### Documents
- `GET /api/docs` - Get all documents
- `GET /api/docs/:id` - Get a specific document
- `POST /api/docs` - Create a new document
- `PUT /api/docs/:id` - Update document metadata
- `DELETE /api/docs/:id` - Delete a document

### WebSocket Events
- `join-document` - Join a document room
- `leave-document` - Leave a document room
- `document-state` - Receive current document state

## Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Frontend      │ ◄─────────────► │    Backend      │
│   (React)       │                 │   (Node.js)     │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   Yjs Client    │                 │   Yjs Server    │
│   (TipTap)      │                 │   (WebSocket)   │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   Local State   │                 │   Firestore     │
│   (In-Memory)   │                 │   (Database)    │
└─────────────────┘                 └─────────────────┘
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the backend server is running on port 5000
   - Check firewall settings
   - Verify CORS configuration

2. **Yjs Sync Issues**
   - Check browser console for errors
   - Ensure WebSocket server is properly configured
   - Verify room names are consistent

3. **Firebase Connection Issues**
   - Verify Firebase credentials are properly set up
   - Check Firestore rules allow read/write access
   - Ensure the service account has proper permissions

### Debug Mode

To enable debug logging, set the following environment variables:
```bash
DEBUG=yjs:*
DEBUG=socket.io:*
```

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Document versioning and history
- [ ] Comments and annotations
- [ ] File attachments
- [ ] Export to different formats (PDF, DOCX)
- [ ] Offline editing support
- [ ] Mobile responsive design
- [ ] Advanced formatting options
- [ ] Document templates
- [ ] Real-time notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 