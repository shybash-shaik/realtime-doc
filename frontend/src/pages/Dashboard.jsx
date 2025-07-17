// --- frontend/pages/Dashboard.jsx ---
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/docs');
        setDocuments(res.data);
      } catch (err) {
        alert('Failed to load documents');
      }
    };
    fetchDocs();
  }, []);

  const createDocument = async () => {
    if (!newTitle) return;
    try {
      setCreating(true);
      const res = await api.post('/docs', { title: newTitle });
      //navigate(`/editor/${res.data.id}`);
    } catch (err) {
      alert('Error creating document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">📄 Your Documents</h1>

      <div className="flex items-center gap-4 mb-8">
        <input
          className="border rounded px-4 py-2 w-full"
          placeholder="Enter new document title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={createDocument}
          disabled={creating}
        >
          {creating ? 'Creating...' : 'New Doc'}
        </button>
      </div>

      <ul className="space-y-3">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="border rounded p-4 cursor-pointer hover:bg-gray-100"
            onClick={() => navigate(`/editor/${doc.id}`)}
          >
            <h2 className="text-xl font-medium">{doc.title || 'Untitled'}</h2>
            <p className="text-sm text-gray-500">Last updated: {new Date(doc.updatedAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
