import mongoose from "mongoose";
const { Schema } = mongoose;

const AccountSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ["Asset","Liability","Equity","Revenue","Expense"], 
    required: true 
  },
  openingBalance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Account", AccountSchema);
