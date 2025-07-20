import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();
const db = getFirestore();

// Get all documents
router.get('/', async (req, res) => {
  try {
    const docsSnapshot = await db.collection('documents').get();
    const documents = [];
    docsSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific document
router.get('/:id', async (req, res) => {
  try {
    const docRef = db.collection('documents').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new document
router.post('/', async (req, res) => {
  try {
    const { title, content = '', userId } = req.body;
    
    if (!title || !userId) {
      return res.status(400).json({ error: 'Title and userId are required' });
    }
    
    const docRef = await db.collection('documents').add({
      title,
      content,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [userId]
    });
    
    res.status(201).json({
      id: docRef.id,
      title,
      content,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [userId]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document metadata and content
router.put('/:id', async (req, res) => {
  try {
    const { title, userId, content } = req.body;
    const docRef = db.collection('documents').doc(req.params.id);
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (title) updateData.title = title;
    if (userId) updateData.userId = userId;
    if (content !== undefined) updateData.content = content;
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('documents').doc(req.params.id);
    await docRef.delete();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 