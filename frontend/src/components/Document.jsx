import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { useAuth } from './AuthContext';
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
import api from '../api/docs'; // Use your pre-configured axios instance
import { Awareness } from 'y-protocols/awareness';

// Custom Socket.IO provider for Yjs
class SocketIOProvider {
  constructor(socket, roomName, doc) {
    this.socket = socket;
    this.roomName = roomName;
    this.doc = doc;
    this.awareness = doc.awareness;
    this.connected = false;

    // Listen for Yjs document updates
    this.socket.on('yjs-update', (update) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
    });

    // Listen for awareness updates from the server
    this.socket.on('awareness-update', ({ states }) => {
      // states is an array of [clientID, state] pairs
      if (Array.isArray(states)) {
        this.awareness.setStates(new Map(states));
      }
    });

    // Broadcast local awareness changes to the server
    this.awareness.on('update', () => {
      const states = Array.from(this.awareness.getStates().entries());
      this.socket.emit('awareness-update', this.roomName, states);
    });

    // Broadcast Yjs document updates
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
    this.socket.off('yjs-update');
    this.socket.off('awareness-update');
    this.awareness.off('update');
  }
}

const Document = ({ onSave }) => {
  const { id: paramId } = useParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const doc = location.state?.doc;
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [documentContent, setDocumentContent] = useState(doc?.content || '');
  const [isLoading, setIsLoading] = useState(!doc);
  const [isYjsReady, setIsYjsReady] = useState(false);
  const [docObj, setDocObj] = useState(doc || null); // Use passed doc if present
  const socketRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [permissionsError, setPermissionsError] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState('editor');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved'
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Use passed doc or fallback to paramId
  const documentId = doc?.id || paramId;
  const documentTitle = doc?.title || '';

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

  // Only fetch if not provided
  const loadDocument = async () => {
    if (!documentId || doc) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/docs/${documentId}`);
      setDocObj(response.data);
      setDocumentContent(response.data.content || '');
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute user role for this document
  const userId = user?.uid;
  const myRole = docObj?.permissions?.find(p => p.userId === userId)?.role || 'viewer';
  const canEdit = ['admin', 'editor'].includes(myRole);
  const isAdmin = myRole === 'admin';

  // Debug output
  console.log('userId:', userId);
  console.log('myRole:', myRole);
  console.log('isAdmin:', isAdmin);
  console.log('docObj:', docObj);
  console.log('permissions:', docObj?.permissions);

  // Auto-save function
  const autoSave = (editorInstance) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setSaveStatus('saving');
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDocument(editorInstance);
    }, 3000);
  };

  // Initialize TipTap editor with collaboration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
        codeBlock: false,
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
    editable: canEdit,
    onUpdate: ({ editor }) => {
      autoSave(editor);
    },
  }, [isYjsReady, ydocRef.current, providerRef.current, canEdit]);

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!documentId) return;

    const ydoc = new Y.Doc();
    ydoc.awareness = new Awareness(ydoc);
    ydoc.awareness.setLocalStateField('user', {
      name: user?.displayName || user?.email || 'Anonymous',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      id: userId || Math.random().toString(36).substr(2, 9)
    });
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
        name: user?.name || 'User',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        id: userId || Math.random().toString(36).substr(2, 9)
      });
      
      setIsYjsReady(true);
    });

    // Apply initial Yjs state from Firestore if present
    socket.on('document-state', (data) => {
      if (data.content) {
        // Decode base64 to Uint8Array
        const binary = atob(data.content);
        const update = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          update[i] = binary.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, update);
      }
      // Optionally handle users: data.users
    });

    // Awareness tracking for online users
    let awareness = null;
    if (providerRef.current) {
      awareness = providerRef.current.doc.awareness || null;
    }
    // Fallback: try to get awareness from ydoc
    if (!awareness && ydocRef.current) {
      awareness = ydocRef.current.awareness || null;
    }
    if (awareness) {
      const updateOnlineUsers = () => {
        const states = Array.from(awareness.getStates().values());
        setOnlineUsers(states.map(s => s.user).filter(Boolean));
      };
      awareness.on('change', updateOnlineUsers);
      updateOnlineUsers();
      // Cleanup
      return () => {
        awareness.off('change', updateOnlineUsers);
      };
    }

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
  }, [documentId, userId, user?.name]);



  // Load document on mount (only if not provided)
  useEffect(() => {
    if (!doc) loadDocument();
  }, [documentId]);

  // Update editor content when document content is loaded
  useEffect(() => {
    if (
      editor &&
      isYjsReady &&
      docObj &&
      docObj.content &&
      editor.getHTML().trim() === '' // Only set if empty
    ) {
      editor.commands.setContent(docObj.content);
    }
  }, [editor, isYjsReady, docObj]);

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

  // Permissions management handlers
  const handleChangeRole = async (userId, newRole) => {
    if (!docObj) return;
    const updatedPermissions = docObj.permissions.map(perm =>
      perm.userId === userId ? { ...perm, role: newRole } : perm
    );
    await updatePermissions(updatedPermissions);
  };

  const handleRemoveUser = async (userId) => {
    if (!docObj) return;
    const updatedPermissions = docObj.permissions.filter(perm => perm.userId !== userId);
    await updatePermissions(updatedPermissions);
  };

  const handleAddUserByEmail = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupLoading(true);
    try {
      const res = await api.post('/auth/lookup-uid', { email: newUserEmail });
      const uid = res.data.uid;
      if (docObj.permissions.some(perm => perm.userId === uid)) {
        setLookupError('User already has a role');
        setLookupLoading(false);
        return;
      }
      const updatedPermissions = [
        ...docObj.permissions,
        { userId: uid, role: newUserRole }
      ];
      await updatePermissions(updatedPermissions);
      setNewUserEmail('');
      setNewUserRole('editor');
    } catch (err) {
      setLookupError(err?.response?.data?.error || 'User not found');
    }
    setLookupLoading(false);
  };

  const updatePermissions = async (updatedPermissions) => {
    try {
      const response = await api.put(`/docs/${docObj.id}/permissions`, { permissions: updatedPermissions });
      setDocObj(response.data);
    } catch (error) {
      setPermissionsError('Failed to update permissions');
      console.error('Failed to update permissions:', error);
    }
  };

  const saveDocument = async (editorInstance = editor) => {
    if (!editorInstance || !documentId) return;
    try {
      const content = editorInstance.getHTML();
      console.log('Saving document:', documentId, content);
      const response = await api.put(`/docs/${documentId}`, {
        content: content
      });
      console.log('Document saved successfully:', response.data);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving document:', error);
      alert('Failed to save document: ' + (error?.response?.data?.error || error.message));
    }
  };

  // Fetch user info for permissions list
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!docObj?.permissions?.length) return;
      const uids = docObj.permissions.map(p => p.userId);
      try {
        const res = await api.post('/auth/user-info', { uids });
        const map = {};
        res.data.users.forEach(u => {
          map[u.uid] = u;
        });
        setUserInfoMap(map);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };
    fetchUserInfo();
  }, [docObj?.permissions]);

  // Wait for auth to load and user to be present
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view this document.</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">{docObj?.title || documentTitle || 'Untitled Document'}</h1>
            <span className="ml-4 text-xs text-gray-500">Your role: <b>{myRole}</b></span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connected Users (detailed) */}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              {onlineUsers.length === 0 ? (
                <span className="text-sm text-gray-600">No users online</span>
              ) : (
                <div className="flex -space-x-2">
                  {onlineUsers.map((u, idx) => (
                    <div key={u.id || idx} className="flex items-center space-x-1 mr-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: u.color || '#888' }}
                        title={u.name || u.id}
                      ></span>
                      <span className="text-xs text-gray-700" title={u.name || u.id}>{u.name || 'User'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Auto-save indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${saveStatus === 'saving' ? 'bg-yellow-400 animate-pulse' : saveStatus === 'saved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'All changes saved' : 'Save failed'}
              </span>
            </div>
            {/* Delete Button (only if isAdmin) */}
            {isAdmin && (
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={undefined} // TODO: implement delete handler
              >
                <span>Delete</span>
              </button>
            )}
            {/* Read-only indicator */}
            {!canEdit && <span className="text-gray-400">Read-only</span>}
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
      {isAdmin && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-bold mb-2">Manage Permissions</h3>
          {permissionsError && <div className="text-red-500 mb-2">{permissionsError}</div>}
          <ul>
            {docObj?.permissions?.map((perm, idx) => {
              const userInfo = userInfoMap[perm.userId];
              return (
                <li key={perm.userId} className="flex items-center space-x-2 mb-1">
                  <span>
                    {userInfo?.name || userInfo?.email || perm.userId}
                    {userInfo?.email && <span className="text-xs text-gray-500 ml-1">({userInfo.email})</span>}
                  </span>
                  <select
                    value={perm.role}
                    onChange={e => handleChangeRole(perm.userId, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  {perm.userId !== user.uid && (
                    <button onClick={() => handleRemoveUser(perm.userId)} className="text-red-500">Remove</button>
                  )}
                </li>
              );
            })}
          </ul>
          <form onSubmit={handleAddUserByEmail} className="mt-2 flex space-x-2">
            <input
              type="email"
              placeholder="User email"
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
              className="border px-2 py-1 rounded"
              required
            />
            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={lookupLoading}>
              {lookupLoading ? 'Adding...' : 'Add'}
            </button>
          </form>
          {lookupError && <div className="text-red-500 mt-1">{lookupError}</div>}
        </div>
      )}
    </div>
  );
};

export default Document;