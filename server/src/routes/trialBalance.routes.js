import { Router } from "express";
import { trialBalance } from "../controllers/trialBalance.controller.js";
const route = Router();
route.get("/", trialBalance);
export default route;
