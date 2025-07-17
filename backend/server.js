import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.js'
import admin from 'firebase-admin';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
dotenv.config();
const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cookieParser());
const { auth } = admin;
app.use(
  cors({origin: "http://localhost:5173",credentials: true})
);app.use(express.json());

app.use("/api/auth",authRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


