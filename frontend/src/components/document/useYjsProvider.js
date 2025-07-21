import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
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
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import SocketIOProvider from './SocketIOProvider';
import CommentMark from './extensions/CommentMark';

const useYjsProvider = (documentId, user, userId, canEdit, autoSave, docObj) => {
  const [isYjsReady, setIsYjsReady] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');
  const ydocRef = useRef(null);
  const providerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false, codeBlock: false }),
      ...(isYjsReady && ydocRef.current && providerRef.current ? [
        Collaboration.configure({ document: ydocRef.current, field: 'content' }),
        CollaborationCursor.configure({
          provider: providerRef.current,
          user: {
            name: user?.displayName || user?.email || 'Anonymous',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            id: userId || Math.random().toString(36).substr(2, 9)
          }
        })
      ] : []),
      Placeholder.configure({ placeholder: 'Start writing your document...' }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CommentMark,
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
    const socket = io('http://localhost:5000');
    socket.on('connect', () => {
      const provider = new SocketIOProvider(socket, `document-${documentId}`, ydoc);
      providerRef.current = provider;
      socket.emit('join-document', `document-${documentId}`, {
        name: user?.name || 'User',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        id: userId || Math.random().toString(36).substr(2, 9)
      });
      setIsYjsReady(true);
    });
    socket.on('document-state', (data) => {
      if (data.content) {
        const binary = atob(data.content);
        const update = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          update[i] = binary.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, update);
      }
    });
    let awareness = null;
    if (providerRef.current) {
      awareness = providerRef.current.doc.awareness || null;
    }
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
      return () => {
        awareness.off('change', updateOnlineUsers);
      };
    }
    socket.on('error', (err) => {
      console.error('Yjs Socket.IO error:', err);
    });
    return () => {
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
      socket.disconnect();
    };
  }, [documentId, userId, user?.name]);

  return { editor, isYjsReady, ydocRef, providerRef, onlineUsers, setOnlineUsers, saveStatus, setSaveStatus };
};

export default useYjsProvider; 