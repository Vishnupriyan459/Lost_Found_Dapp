import { Schema, model } from 'mongoose';
const ItemSchema = new Schema({
  _id: { type: String, required: true },
  owner_id: { type: String, required: true },

  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },

  photos: [{ type: Buffer }],

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    place: { type: String, default: '' } // [lng, lat]
  },

  // 🔥 Dynamic attributes
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },

  created_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['Open','Matched','Closed'], default: 'Open' },

  preferred_pickup_instructions: String,

  reward: {
    amount: { type: Number, min: 0 },
    currency: { type: String, default: 'FND' }
  },
  reward_sent: {
    type: Boolean,
    default: false
  },

  matched_claim_id: String,
  last_activity_at: { type: Date, default: Date.now },

  meta: {
    visibility: { type: String, enum: ['OwnerOnly','Campus','Public'], default: 'Campus' },
    is_public: { type: Boolean, default: true }
  }
});
export default model('Item', ItemSchema);
