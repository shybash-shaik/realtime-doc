import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { lowlight } from 'lowlight';
import { io } from 'socket.io-client';
import axios from 'axios';
import * as Y from 'yjs';


import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Table as TableIcon,
  Users,
  Save
} from 'lucide-react';
import './Document.css';

// Custom Socket.IO provider for Yjs
class SocketIOProvider {
  constructor(socket, roomName, doc) {
    this.socket = socket;
    this.roomName = roomName;
    this.doc = doc;
    this.connected = false;
    
    this.socket.on('yjs-update', (update) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
    });
    
    this.doc.on('afterTransaction', (transaction) => {
      if (transaction.origin !== this) {
        const update = Y.encodeStateAsUpdate(this.doc);
        this.socket.emit('yjs-update', this.roomName, Array.from(update));
      }
    });
    
    this.connected = true;
  }
  
  destroy() {
    this.connected = false;
  }
}

const Document = ({ documentId, documentTitle, onSave }) => {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isYjsReady, setIsYjsReady] = useState(false);
  const socketRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);

  // Handle missing documentId
  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No document selected</p>
        </div>
      </div>
    );
  }

  // Load document content
  const loadDocument = async () => {
    if (!documentId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/docs/${documentId}`);
      console.log('Loaded document content:', response.data);
      setDocumentContent(response.data.content || '');
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save function
  const autoSave = (editorInstance) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDocument(editorInstance);
    }, 3000); // Auto-save after 3 seconds of inactivity
  };

  // Initialize TipTap editor with collaboration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable history as it's handled by Yjs
        codeBlock: false, // Disable default codeBlock to avoid conflict
      }),
      ...(isYjsReady && ydocRef.current && providerRef.current ? [
        Collaboration.configure({
          document: ydocRef.current,
          field: 'content',
        }),
      ] : []),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      // Trigger auto-save on content change
      autoSave(editor);
    },
  }, [isYjsReady, ydocRef.current, providerRef.current]);

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!documentId) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create Socket.IO connection for Yjs
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('Yjs Socket.IO connected');
      
      // Create custom provider
      const provider = new SocketIOProvider(socket, `document-${documentId}`, ydoc);
      providerRef.current = provider;
      
      // Join the document room
      socket.emit('join-document', `document-${documentId}`, {
        name: 'User',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        id: Math.random().toString(36).substr(2, 9)
      });
      

      
      setIsYjsReady(true);
    });

    socket.on('error', (err) => {
      console.error('Yjs Socket.IO error:', err);
    });

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
      socket.disconnect();
    };
  }, [documentId]);



  // Load document on mount
  useEffect(() => {
    loadDocument();
  }, [documentId]);

  // Update editor content when document content is loaded
  useEffect(() => {
    if (editor && documentContent !== undefined && !isLoading) {
      console.log('Setting editor content:', documentContent);
      editor.commands.setContent(documentContent);
    }
  }, [editor, documentContent, isLoading]);

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument(editor);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // User awareness is now handled by the Yjs Socket.IO connection
  useEffect(() => {
    if (!documentId) {
      console.log('No document ID provided');
      return;
    }

    setIsConnected(true);
    console.log('Connected to server');
  }, [documentId]);

  const saveDocument = async (editorInstance = editor) => {
    if (!editorInstance || !documentId) return;
    
    try {
      const content = editorInstance.getHTML();
      console.log('Saving content:', content);
      const response = await axios.put(`http://localhost:5000/api/docs/${documentId}`, {
        content: content,
        userId: 'user123' // This should come from auth context
      });
      
      console.log('Document saved successfully:', response.data);
      
      // Show success message
      const saveButton = document.querySelector('[data-save-button]');
      if (saveButton) {
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved!';
        saveButton.classList.add('bg-green-600');
        setTimeout(() => {
          saveButton.textContent = originalText;
          saveButton.classList.remove('bg-green-600');
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    }
  };

  if (!editor || isLoading || !isYjsReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading ? 'Loading document...' : !isYjsReady ? 'Initializing collaboration...' : 'Initializing editor...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">{documentTitle || 'Untitled Document'}</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connected Users */}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
              </span>
            </div>
            
            {/* Auto-save indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Auto-save enabled</span>
            </div>
            
            {/* Save Button */}
            <button
              onClick={() => saveDocument(editor)}
              data-save-button
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <Code className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-2 rounded hover:bg-gray-100"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          <EditorContent editor={editor} className="p-8" />
        </div>
      </div>
    </div>
  );
};

export default Document; 