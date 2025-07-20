import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import DocumentList from './components/DocumentList';
import Document from './components/Document';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  const handleDocumentSelect = (doc) => {
    navigate(`/documents/${doc.id}`, { state: { doc } });
  };

  const handleCreateDocument = (doc) => {
    navigate(`/documents/${doc.id}`, { state: { doc } });
  };

  const handleSaveDocument = (content) => {
    console.log('Saving document:', content);
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Protected routes */}
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <DocumentList
              onDocumentSelect={handleDocumentSelect}
              onCreateDocument={handleCreateDocument}
            />
          </PrivateRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <PrivateRoute>
            <Document onSave={handleSaveDocument} />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


