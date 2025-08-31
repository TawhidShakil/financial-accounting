import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";

const regSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

function cookieOpts() {
  const prod = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: prod,               // prod হলে true
    sameSite: prod ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = regSchema.parse(req.body);

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = signToken(user._id);
    res.cookie("token", token, cookieOpts());
    res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    if (e.name === "ZodError") return res.status(400).json({ message: "Invalid input", issues: e.errors });
    next(e);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    res.cookie("token", token, cookieOpts());
    res.json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    if (e.name === "ZodError") return res.status(400).json({ message: "Invalid input", issues: e.errors });
    next(e);
  }
};

export const me = async (req, res) => {
  const u = req.user;
  res.json({ user: { _id: u._id, name: u.name, email: u.email } });
};

export const logout = async (_req, res) => {
  res.clearCookie("token", { path: "/", sameSite: "none", secure: true });
  res.json({ ok: true });
};
