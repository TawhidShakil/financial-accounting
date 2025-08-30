import JournalEntry from "../models/JournalEntry.js";

export const createEntry = async (req,res,next)=>{
  try {
    const entry = await JournalEntry.create(req.body);
    res.status(201).json(entry);
  } catch(e){ next(e); }
};

export const listEntries = async (req,res,next)=>{
  try {
    const { from, to } = req.query;
    const q = {};
    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to)   q.date.$lte = new Date(to);
    const items = await JournalEntry.find(q).populate("lines.account").sort({ date: 1, _id: 1 });
    res.json(items);
  } catch(e){ next(e); }
};
