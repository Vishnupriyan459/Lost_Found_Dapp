import express from "express";
import { getAccount, addTransaction } from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/balance", protect, getAccount);
router.post("/", protect, addTransaction);

export default router;
