// routes/items.js
import express from 'express';
import * as itemsCtrl from '../controllers/itemsController.js';
import { protect, ensureAdmin } from '../middleware/authMiddleware.js';
import { parseItemFormData } from '../middleware/parseFormData.js';
import upload from '../middleware/Upload.js';

const router = express.Router();

// Create a new lost item (owner)
router.post('/', protect,upload.array('photos', 8),parseItemFormData,itemsCtrl.createItem);

// Public listing/search of items (no auth)
router.get('/public', itemsCtrl.listPublicItems);

// Close an item (owner marks received / closed)
router.post('/close', protect, itemsCtrl.closeItem);

router.get("/myitems", protect, itemsCtrl.listMyItems);

router.get("/:id", protect, itemsCtrl.getItemById);

// Admin-only: list all items with extra info (example)
router.get('/admin/all', protect, ensureAdmin, itemsCtrl.listAllItemsForAdmin?.bind(itemsCtrl) || ((req,res)=>res.status(404).json({error:'Not implemented'})));

export default router;
