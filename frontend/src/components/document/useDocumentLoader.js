import { useState, useCallback } from 'react';
import axios from 'axios';

const useDocumentLoader = (documentId, initialDoc) => {
  const [docObj, setDocObj] = useState(initialDoc || null);
  const [isLoading, setIsLoading] = useState(!initialDoc);

  const loadDocument = useCallback(async () => {
    if (!documentId || initialDoc) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/docs/${documentId}`);
      setDocObj(response.data);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, initialDoc]);

  return { docObj, isLoading, setDocObj, setIsLoading, loadDocument };
};

export default useDocumentLoader; 