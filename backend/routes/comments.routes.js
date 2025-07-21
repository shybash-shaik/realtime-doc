import express from 'express';
import { addComment, getComments, updateComment, deleteComment } from '../controllers/commentController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/docs/:docId/comments', auth, addComment);
router.get('/docs/:docId/comments', auth, getComments);
router.patch('/docs/:docId/comments/:commentId', auth, updateComment);
router.delete('/docs/:docId/comments/:commentId', auth, deleteComment);

export default router; 