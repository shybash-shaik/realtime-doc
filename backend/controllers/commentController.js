import admin from '../firebase/admin.js';
const db = admin.firestore();

// Add a comment
export const addComment = async (req, res) => {
  try {
    const { docId } = req.params;
    const { anchor, content, parentId } = req.body;
    const userId = req.user.uid;

    const comment = {
      userId,
      anchor,
      content,
      parentId: parentId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('documents').doc(docId).collection('comments').add(comment);
    const newComment = await ref.get();
    res.status(201).json({ id: ref.id, ...newComment.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all comments for a document
export const getComments = async (req, res) => {
  try {
    const { docId } = req.params;
    const snapshot = await db.collection('documents').doc(docId).collection('comments').orderBy('createdAt').get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { docId, commentId } = req.params;
    const { content } = req.body;
    const ref = db.collection('documents').doc(docId).collection('comments').doc(commentId);
    await ref.update({
      content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { docId, commentId } = req.params;
    await db.collection('documents').doc(docId).collection('comments').doc(commentId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 