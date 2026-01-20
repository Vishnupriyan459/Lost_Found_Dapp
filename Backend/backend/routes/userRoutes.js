// routes/userRoute.js
import express from "express";
import { registerUser,loginUser } from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// POST /api/users/register
router.post("/register", registerUser);
router.post("/login", loginUser);

// Example protected route
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
