// app.js
import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import bodyParser from "body-parser";
import cors from "cors";
// import lostItemRoutes from "./routes/lostItemRoutes.js";
// Load .env from parent folder
dotenv.config({ path: "../.env" });
import itemsRoutes from './routes/items.js';
import claimsRoutes from './routes/claims.js';    
const app = express();
connectDB();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
// Enable CORS for all routes
app.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));
// Middleware
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
// app.use("/api/lost-items", lostItemRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/claims', claimsRoutes);


export default app;
