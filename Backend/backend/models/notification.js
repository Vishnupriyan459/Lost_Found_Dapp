// models/notification.js
import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
  _id: { type: String, required: true }, // uuid
  user_id: { type: String, required: true, index: true },
  type: { type: String, required: true }, // e.g., 'claim_created','claim_verified','item_matched'
  payload: { type: Schema.Types.Mixed }, // small JSON payload
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});
NotificationSchema.index({ user_id: 1, read: 1, created_at: -1 });

export default model('Notification', NotificationSchema);
