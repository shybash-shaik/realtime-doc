import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import api from '../../api/docs';

const CommentSidebar = ({ docId, focusedCommentId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    const q = query(
      collection(db, 'documents', docId, 'comments'),
      orderBy('createdAt')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentList);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [docId]);

  // Fetch user info when comments change
  useEffect(() => {
    const userIds = Array.from(new Set(comments.map(c => c.userId).filter(Boolean)));
    if (userIds.length > 0) {
      api.post('/auth/user-info', { uids: userIds })
        .then(res => {
          const map = {};
          res.data.users.forEach(u => { map[u.uid] = u.email || u.uid; });
          setUserMap(map);
          console.log('User map:', map); // Debug log
        })
        .catch(err => {
          console.error('Failed to fetch user info:', err);
        });
    }
  }, [comments]);

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Comments</h3>
        {/* Show close button on mobile */}
        {onClose && (
          <button
            className="md:hidden text-gray-500 hover:text-gray-800 text-2xl px-2"
            onClick={onClose}
            aria-label="Close comments"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div>Loading comments...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : comments.length === 0 ? (
          <div>No comments yet.</div>
        ) : (
          <ul>
            {comments.map(comment => (
              <li key={comment.id} style={{ background: focusedCommentId === comment.id ? '#fff3cd' : undefined, borderRadius: 4, padding: 4 }}>
                <div><strong>User:</strong> {userMap[comment.userId] || comment.userId}</div>
                <div>{comment.content}</div>
                <div style={{ fontSize: '0.8em', color: '#888' }}>{comment.createdAt?.toDate?.().toLocaleString?.() || ''}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // Mobile: modal overlay; Desktop: sidebar panel
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        {sidebarContent}
      </div>
      {/* Mobile modal */}
      {onClose && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex-1 bg-black bg-opacity-40" onClick={onClose}></div>
          <div className="w-4/5 max-w-xs bg-white h-full shadow-lg p-4">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default CommentSidebar; 