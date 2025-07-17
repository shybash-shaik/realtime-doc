import express from 'express';
import { firebaseEmailLogin,logout} from '../controllers/authController.js';
import verifyJWT from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', firebaseEmailLogin);
router.post('/logout', logout);
router.get('/protected', verifyJWT, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user, 
  });
});
export default router;
