import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireDocumentRole } from '../middlewares/documentRole.js';
import verifyJWT from '../middlewares/auth.js';

const router = express.Router();
const db = getFirestore();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Get all documents (with optional search)
router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.toLowerCase() : null;
    const docsSnapshot = await db.collection('documents').get();
    let documents = [];
    docsSnapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    if (q) {
      documents = documents.filter(doc =>
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.content && doc.content.toLowerCase().includes(q))
      );
    }
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific document (requires any role)
router.get('/:id', requireDocumentRole(['admin', 'editor', 'viewer']), async (req, res) => {
  try {
    const doc = req.document;
    res.json({
      id: req.params.id,
      ...doc
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new document (creator is admin)
router.post('/', async (req, res) => {
  try {
    const { title, content = '' } = req.body;
    const userId = req.user?.uid; // Use authenticated user's UID
    if (!title || !userId) {
      return res.status(400).json({ error: 'Title and userId are required' });
    }
    const permissions = [
      { userId, role: 'admin' }
    ];
    const docRef = await db.collection('documents').add({
      title,
      content,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions
    });
    res.status(201).json({
      id: docRef.id,
      title,
      content,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document metadata and content (admin/editor only)
router.put('/:id', requireDocumentRole(['admin', 'editor']), async (req, res) => {
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

// Update document permissions (admin only)
router.put('/:id/permissions', requireDocumentRole(['admin']), async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    const docRef = db.collection('documents').doc(req.params.id);
    await docRef.update({ permissions, updatedAt: new Date() });
    const updatedDoc = await docRef.get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a document (admin only)
router.delete('/:id', requireDocumentRole(['admin']), async (req, res) => {
  try {
    const docRef = db.collection('documents').doc(req.params.id);
    await docRef.delete();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 