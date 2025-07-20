import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import DocumentList from './components/DocumentList';
import Document from './components/Document';

function App() {
  const [currentDocument, setCurrentDocument] = useState(null);

  const handleDocumentSelect = (document) => {
    setCurrentDocument(document);
  };

  const handleCreateDocument = (document) => {
    setCurrentDocument(document);
  };

  const handleSaveDocument = (content) => {
    // Here you would typically save the document content to your backend
    console.log('Saving document:', content);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Document routes */}
        <Route 
          path="/documents" 
          element={
            currentDocument ? (
              <Document 
                documentId={currentDocument.id}
                documentTitle={currentDocument.title}
                onSave={handleSaveDocument}
              />
            ) : (
              <DocumentList 
                onDocumentSelect={handleDocumentSelect}
                onCreateDocument={handleCreateDocument}
              />
            )
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


