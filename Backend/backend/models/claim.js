// models/claim.js
import { Schema, model } from 'mongoose';

const EvidenceSchema = new Schema({
  photos: [{ type: Buffer }],
  location_found: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [lng, lat],
    place: { type: String, default: '' }
  },
  found_at: { type: Date } // optional timestamp when found
}, { _id: false });

const ClaimSchema = new Schema({
  _id: { type: String, required: true }, // uuid string
  item_id: { type: String, required: true, index: true }, // fk -> items._id
  finder_id: { type: String, required: true }, // uuid of finder
  message: { type: String, default: '' },
  evidence: { type: EvidenceSchema, default: {} },
  // 🔥 Dynamic claim attributes (proof details)
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  status: { type: String, enum: ['Pending','Verified','Received','Rejected'], default: 'Pending' },
  contact_info: { phone: String, email: String }, // visibility controlled by app logic
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
ClaimSchema.index({ item_id: 1, status: 1 });
ClaimSchema.pre('save', function(next) { this.updated_at = new Date(); next(); });

export default model('Claim', ClaimSchema);
