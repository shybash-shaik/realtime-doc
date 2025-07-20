import admin from '../firebase/admin.js';

export const firebaseEmailLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Missing Firebase ID token' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    res.cookie('token', idToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({ uid, email, name: name || null });
  } catch (err) {
    console.error('Firebase login error:', err);
    res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};
