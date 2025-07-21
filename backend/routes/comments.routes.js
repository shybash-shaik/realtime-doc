import express from 'express';
import { addComment, getComments, updateComment, deleteComment } from '../controllers/commentController.js';
import auth from '../middlewares/auth.js';

console.log('Comment routes loaded');

// All routes require authentication
router.post('/docs/:docId/comments', auth, addComment);
router.get('/docs/:docId/comments', auth, getComments);
router.patch('/docs/:docId/comments/:commentId', auth, updateComment);
router.delete('/docs/:docId/comments/:commentId', auth, deleteComment);

// Test route to confirm router is loaded
router.get('/test', (req, res) => res.send('Test route works!'));

export default router; 