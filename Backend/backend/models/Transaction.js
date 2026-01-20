import { Schema, model } from "mongoose";

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

  balance: { type: Number, default: 0 },

  history: [
    {
      sender: { type: String, required: true },
      receiver: { type: String, required: true },
      tokenAmount: { type: Number, required: true },
      description: { type: String },
      date: { type: Date, default: Date.now },

      // UUID-based item ID (correct)
      itemId: { type: String },

      // ✅ Domain-driven enum
      type: {
        type: String,
        enum: ["Lost", "Found", "Reward", "Refund","Mint-Reconcile"],
        required: true
      }
    }
  ],

  lastReconciledServerId: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default model("Transaction", transactionSchema);
