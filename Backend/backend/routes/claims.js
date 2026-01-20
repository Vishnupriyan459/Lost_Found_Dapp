// routes/claims.js
import express from 'express';
import * as itemsCtrl from '../controllers/itemsController.js';
import { protect, ensureAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/Upload.js';
import { parseClaimFormData } from '../middleware/parseFormData.js';
const router = express.Router();

console.log('protect:', protect, 'typeof:', typeof protect);
console.log('upload:', upload, 'has array?:', typeof upload?.array);
console.log('submitClaimMultipart:', itemsCtrl.submitClaimMultipart, 'typeof:', typeof itemsCtrl.submitClaimMultipart);

// If you use multipart file uploads for evidence photos, use submitClaimMultipart
// (this route expects files under field name 'evidencePhotos')
router.post('/', protect, upload.array('evidence_photos', 6), parseClaimFormData, itemsCtrl.submitClaim);


// If you prefer JSON-based submissions (no files), uncomment below and remove the multipart route above:
// router.post('/', protect, itemsCtrl.submitClaim);

// List claims for an item (owner or admin) -> /claims?item_id=<id>
router.get('/', protect, itemsCtrl.listClaimsForItem);

// Accept / verify a claim (owner only)
router.post('/accept', protect, itemsCtrl.acceptClaim);

// Reject a claim (owner or admin)
router.post('/reject', protect, itemsCtrl.rejectClaim);
// List claims made by the logged-in finder
router.get("/myclaims", protect, itemsCtrl.getClaimsByFinder);
// Optional admin-only: list all claims across system
router.get('/admin/all', protect, ensureAdmin, itemsCtrl.listAllClaimsForAdmin?.bind(itemsCtrl) || ((req,res)=>res.status(404).json({error:'Not implemented'})));

export default router;
