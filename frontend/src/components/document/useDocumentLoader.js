import { useState, useCallback } from 'react';
import api from '../../api/docs';

const useDocumentLoader = (documentId, initialDoc) => {
  const [docObj, setDocObj] = useState(initialDoc || null);
  const [isLoading, setIsLoading] = useState(!initialDoc);

  const loadDocument = useCallback(async () => {
    if (!documentId || initialDoc) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/docs/${documentId}`);
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