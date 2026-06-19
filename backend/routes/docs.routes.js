import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireDocumentRole } from '../middlewares/documentRole.js';
import verifyJWT from '../middlewares/auth.js';
import sanitizeHtml from 'sanitize-html';
import { nanoid } from 'nanoid';

const router = express.Router();
const db = getFirestore();

router.use(verifyJWT);

router.get('/', async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.toLowerCase() : null;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let query = db.collection('documents').where('allowedUsers', 'array-contains', userId);
    if (!req.query.all) {
      if (req.query.parentId) {
        query = query.where('parentId', '==', sanitizeHtml(req.query.parentId));
      } else {
        query = query.where('parentId', '==', null); // Default to root level
      }
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
    const title = sanitizeHtml(req.body.title);
    const content = sanitizeHtml(req.body.content || '');
    const parentId = req.body.parentId ? sanitizeHtml(req.body.parentId) : null;
    const coverImage = req.body.coverImage ? sanitizeHtml(req.body.coverImage) : null;
    const icon = req.body.icon ? sanitizeHtml(req.body.icon) : null;

    const userId = req.user?.uid; // Use authenticated user's UID
    if (!title || !userId) {
      return res.status(400).json({ error: 'Title and userId are required' });
    }
    const permissions = [
      { userId, role: 'admin' }
    ];
    const allowedUsers = [userId];
    const docRef = await db.collection('documents').add({
      title,
      content,
      parentId,
      coverImage,
      icon,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions,
      allowedUsers
    });
    res.status(201).json({
      id: docRef.id,
      title,
      content,
      parentId,
      coverImage,
      icon,
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
    const { title, userId, content, parentId, coverImage, icon } = req.body;
    const docRef = db.collection('documents').doc(req.params.id);
    const updateData = {
      updatedAt: new Date()
    };
    if (title !== undefined) updateData.title = sanitizeHtml(title);
    if (userId) updateData.userId = userId;
    if (content !== undefined) updateData.content = sanitizeHtml(content);
    if (parentId !== undefined) updateData.parentId = parentId ? sanitizeHtml(parentId) : null;
    if (coverImage !== undefined) updateData.coverImage = sanitizeHtml(coverImage);
    if (icon !== undefined) updateData.icon = sanitizeHtml(icon);

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
    const allowedUsers = permissions.map(p => p.userId);
    await docRef.update({ permissions, allowedUsers, updatedAt: new Date() });
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


router.post('/:id/share', requireDocumentRole(['admin']), async (req, res) => {
  try {
    const { permission } = req.body; // 'viewer', 'commenter', 'editor'
    if (!['viewer', 'commenter', 'editor'].includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission' });
    }
    const docRef = db.collection('documents').doc(req.params.id);
    const shareToken = nanoid(16);
    await docRef.update({ shareToken, sharePermission: permission, updatedAt: new Date() });
    res.json({ shareToken, sharePermission: permission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shared/:token', async (req, res) => {
  try {
    const snapshot = await db.collection('documents').where('shareToken', '==', req.params.token).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Invalid or expired share link' });
    const doc = snapshot.docs[0];
    const data = doc.data();
    res.json({
      id: doc.id,
      ...data,
      sharePermission: data.sharePermission || 'viewer',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 