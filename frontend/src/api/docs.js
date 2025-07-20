// frontend/src/utils/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api", // Update if your backend uses a different path
  withCredentials: true, // allow sending cookies (for JWT auth)
});

export default instance;


// // Fetch all documents
// export const fetchDocuments = () => API_BASE.get('/');

// // Fetch single document by id
// export const fetchDocument = (id) => API_BASE.get(`/${id}`);

// // Fetch blocks of a document
// export const fetchBlocks = (docId) => API_BASE.get(`/${docId}/blocks`);

// // Create a new block
// export const createBlock = (block) => API_BASE.post('/blocks', block);

// // Update a block by id
// export const updateBlock = (blockId, data) => API_BASE.put(`/blocks/${blockId}`, data);

// // Delete a block by id
// export const deleteBlock = (blockId) => API_BASE.delete(`/blocks/${blockId}`);

// // Create a new document
// export const createDocument = (data) => API_BASE.post('/', data);

// // Update document by id
// export const updateDocument = (id, data) => API_BASE.put(`/${id}`, data);

// // Delete document by id
// export const deleteDocument = (id) => API_BASE.delete(`/${id}`);
