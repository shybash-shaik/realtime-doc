import admin from "../firebase/admin.js";

const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || null,
    };

    next(); 
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default verifyJWT;
