// import express from "express";
// import {
//   createLostItem,
//   submitFoundItem,
//   verifyFoundItem,
//   listLostItems,
//   listVerifyingItems,
//   listAllLostItems,
// } from "../controllers/lostItemController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // -------- Lost items base route --------
// router.route("/")
//   .post(protect, createLostItem)   // Report lost item
//   .get(protect, listAllLostItems); // List all lost items

// // -------- Current user’s lost items --------
// router.get("/my", protect, listLostItems);
// router.get("/verifying", protect, listVerifyingItems);

// // -------- Actions on a specific lost item --------
// router.post("/:id/found", protect, submitFoundItem);  // Founder submits found item
// router.patch("/:id/verify", protect, verifyFoundItem); // Loster verifies found item

// export default router;
