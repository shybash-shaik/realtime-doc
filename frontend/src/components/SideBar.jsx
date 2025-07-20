import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const Sidebar = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const docsSnap = await getDocs(collection(db, 'documents'));
        setDocs(docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setDocs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleCreateDoc = async () => {
    const title = prompt('Enter document title:');
    if (!title) return;
    const docRef = await addDoc(collection(db, 'documents'), { title });
    navigate(`/docs/${docRef.id}`);
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-white border-r shadow-lg z-40 flex flex-col justify-between p-4">
      <div>
        <h2 className="text-2xl font-bold mb-6">📝 Docs</h2>
        <button
          className="w-full text-left px-4 py-2 mb-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
          onClick={handleCreateDoc}
        >
          ➕ New Document
        </button>
        <div className="mt-6">
          {loading ? (
            <div>Loading documents...</div>
          ) : docs.length === 0 ? (
            <div className="text-gray-500">No documents found.</div>
          ) : (
            <ul>
              {docs.map(doc => (
                <li
                  key={doc.id}
                  className="cursor-pointer text-blue-600 hover:underline text-sm mb-2"
                  onClick={() => navigate(`/docs/${doc.id}`)}
                >
                  {doc.title || 'Untitled Document'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <button
        className="w-full text-left px-4 py-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
        onClick={handleLogout}
      >
        🔓 Logout
      </button>
    </div>
  );
};

export default Sidebar;
