import express from 'express';
import { firebaseEmailLogin,logout} from '../controllers/authController.js';
import verifyJWT from '../middlewares/auth.js';
import admin from '../firebase/admin.js';

const router = express.Router();

router.post('/login', firebaseEmailLogin);
router.post('/logout', logout);
router.get('/protected', verifyJWT, (req, res) => {
  res.json(req.user); 
});

router.post('/lookup-uid', verifyJWT, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    res.json({ uid: userRecord.uid, email: userRecord.email, name: userRecord.displayName });
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

router.post('/user-info', verifyJWT, async (req, res) => {
  const { uids } = req.body;
  if (!Array.isArray(uids) || uids.length === 0) {
    return res.status(400).json({ error: 'uids must be a non-empty array' });
  }
  try {
    const users = await Promise.all(
      uids.map(async (uid) => {
        try {
          const userRecord = await admin.auth().getUser(uid);
          return {
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.displayName,
          };
        } catch {
          return { uid, email: null, name: null };
        }
      })
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

export default router;
