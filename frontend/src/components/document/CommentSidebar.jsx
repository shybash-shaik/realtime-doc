import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import api from '../../api/docs';

const CommentSidebar = ({ docId, focusedCommentId }) => {
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

  if (loading) return <div>Loading comments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Comments</h3>
      {comments.length === 0 ? (
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
  );
};

export default CommentSidebar; 