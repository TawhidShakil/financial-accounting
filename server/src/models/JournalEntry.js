import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const LineSchema = new Schema({
  account: { type: Types.ObjectId, ref: "Account", required: true },
  debit:  { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 }
}, { _id: false });

const JournalEntrySchema = new Schema({
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  lines: { type: [LineSchema], validate: v => v && v.length >= 2 }
}, { timestamps: true });

// Double-entry rule
JournalEntrySchema.pre("validate", function(next) {
  const totalDebit  = this.lines.reduce((s,l)=>s+(l.debit||0),0);
  const totalCredit = this.lines.reduce((s,l)=>s+(l.credit||0),0);
  if (Number(totalDebit.toFixed(2)) !== Number(totalCredit.toFixed(2))) {
    return next(new Error("Debits and credits must be equal."));
  }
  next();
});

export default mongoose.model("JournalEntry", JournalEntrySchema);
