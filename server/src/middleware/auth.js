import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
