// models/audit_log.js
import { Schema, model } from 'mongoose';

const AuditSchema = new Schema({
  _id: { type: String, required: true }, // uuid
  resource_type: { type: String, required: true }, // 'Item' | 'Claim'
  resource_id: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'status_changed','claim_created'
  actor_id: { type: String }, // who did it (owner/admin/system)
  before: { type: Schema.Types.Mixed }, // small snapshot (optional)
  after: { type: Schema.Types.Mixed }, // small snapshot (optional)
  reason: { type: String }, // optional human reason
  created_at: { type: Date, default: Date.now }
});
AuditSchema.index({ resource_type: 1, resource_id: 1, created_at: -1 });

export default model('Audit', AuditSchema);
