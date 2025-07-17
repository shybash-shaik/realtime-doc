// --- client/src/AuthContext.jsx ---
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase"; 
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    withCredentials: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/protected");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const emailLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    await api.post("/auth/login", { idToken });

    const res = await api.get("/auth/protected");
    setUser(res.data);
  };

const register = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    await api.post("/auth/login", { idToken });

    const res = await api.get("/auth/protected");
    setUser(res.data);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      alert("This email is already registered. Please login instead.");
    } else {
      alert("Registration failed: " + err.message);
    }
    console.error(err);
  }
};


  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, emailLogin, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
