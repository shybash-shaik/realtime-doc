import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { useState } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import DocumentList from './components/DocumentList';
const Document = lazy(() => import('./components/Document'));
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8 text-center">The page you are looking for does not exist.</p>
      <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Go Home</a>
    </div>
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
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
            <Suspense fallback={<div>Loading document...</div>}>
              <Document onSave={handleSaveDocument} />
            </Suspense>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;


