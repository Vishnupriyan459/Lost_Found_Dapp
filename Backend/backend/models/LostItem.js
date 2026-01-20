// import { id } from "ethers";
// import { Schema, model } from "mongoose";

// const foundRequestSchema = new Schema(
//   {
//     founderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     founderName: { type: String, required: true },
//     description: { type: String },
//     location: { type: String },
//     image: { type: String }, // optional proof image
//     status: {
//       type: String,
//       enum: ["Pending", "Accepted", "Rejected"],
//       default: "Pending",
//     },
//     date: { type: Date, default: Date.now },
//   },
//   { _id: true }
// );

// const itemsSchema = new Schema(
//   {
//     id:{type:Schema.Types.ObjectId, auto:true},
//     finder_id: { type: Schema.Types.ObjectId, ref: "User", required: true },

//   }
// )