import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireDocumentRole } from '../middlewares/documentRole.js';
import verifyJWT from '../middlewares/auth.js';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();
const db = getFirestore();

router.use(verifyJWT);

router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.toLowerCase() : null;
    const folder = req.query.folder || null;
    let query = db.collection('documents');
    if (folder) {
      query = query.where('folder', '==', folder);
    }
    const docsSnapshot = await query.get();
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

router.post('/', async (req, res) => {
  try {
    // Sanitize user input
    const title = sanitizeHtml(req.body.title);
    const content = sanitizeHtml(req.body.content || '');
    const folder = req.body.folder ? sanitizeHtml(req.body.folder) : null;
    const userId = req.user?.uid; // Use authenticated user's UID
    if (!title || !userId) {
      return res.status(400).json({ error: 'Title and userId are required' });
    }
    // Add creator as admin in permissions
    const permissions = [
      { userId, role: 'admin' }
    ];
    const docRef = await db.collection('documents').add({
      title,
      content,
      folder,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions
    });
    res.status(201).json({
      id: docRef.id,
      title,
      content,
      folder,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireDocumentRole(['admin', 'editor']), async (req, res) => {
  try {
    const { title, userId, content, folder } = req.body;
    const docRef = db.collection('documents').doc(req.params.id);
    const updateData = {
      updatedAt: new Date()
    };
    if (title) updateData.title = sanitizeHtml(title);
    if (userId) updateData.userId = userId;
    if (content !== undefined) updateData.content = sanitizeHtml(content);
    if (folder !== undefined) updateData.folder = sanitizeHtml(folder);
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

router.delete('/:id', requireDocumentRole(['admin']), async (req, res) => {
  try {
    const docRef = db.collection('documents').doc(req.params.id);
    await docRef.delete();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/folders/all', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const foldersSnapshot = await db.collection('folders').where('userId', '==', userId).get();
    const folders = [];
    foldersSnapshot.forEach(folder => {
      folders.push({ id: folder.id, ...folder.data() });
    });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/folders', async (req, res) => {
  try {
    const name = sanitizeHtml(req.body.name);
    const userId = req.user?.uid;
    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }
    const folderRef = await db.collection('folders').add({
      name,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.status(201).json({ id: folderRef.id, name, userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete('/folders/:id', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const folderId = req.params.id;
    const folderRef = db.collection('folders').doc(folderId);
    const folderSnap = await folderRef.get();
    if (!folderSnap.exists) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    if (folderSnap.data().userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const docsSnapshot = await db.collection('documents').where('folder', '==', folderSnap.data().name).get();
    const batch = db.batch();
    docsSnapshot.forEach(doc => batch.delete(doc.ref));
    batch.delete(folderRef);
    await batch.commit();
    res.json({ message: 'Folder and its documents deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 