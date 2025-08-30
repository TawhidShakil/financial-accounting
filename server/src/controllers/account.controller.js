import Account from "../models/Account.js";

export const createAccount = async (req,res,next)=>{
  try {
    const acc = await Account.create(req.body);
    res.status(201).json(acc);
  } catch(e){ next(e); }
};

export const listAccounts = async (req,res,next)=>{
  try {
    const q = {};
    if (req.query.type) q.type = req.query.type;
    const items = await Account.find(q).sort({ code: 1 });
    res.json(items);
  } catch(e){ next(e); }
};
