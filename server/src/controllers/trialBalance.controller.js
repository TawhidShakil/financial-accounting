import JournalEntry from "../models/JournalEntry.js";

export const trialBalance = async (req, res, next) => {
  try {
    const to = req.query.to ? new Date(req.query.to) : null;


    const match = {};
    if (to) match.date = { $lte: to };

    const rows = await JournalEntry.aggregate([
      { $match: match },


      { $project: { lines: { $ifNull: ["$lines", []] } } },

      { $unwind: { path: "$lines", preserveNullAndEmptyArrays: false } },

      { $group: {
          _id: "$lines.account",
          debit:  { $sum: { $ifNull: ["$lines.debit", 0] } },
          credit: { $sum: { $ifNull: ["$lines.credit", 0] } }
      }},

     
      { $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "_id",
          as: "account"
      }},
      { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },

      { $project: {
          _id: 0,
          accountId: "$account._id",
          code:      "$account.code",
          name:      "$account.name",
          type:      "$account.type",
          debit:     1,
          credit:    1
      }},
      { $sort: { code: 1, name: 1 } }
    ]);

    res.json(rows);
  } catch (e) {
    console.error("trialBalance error:", e);
    next(e);
  }
};
