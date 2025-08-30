import { Router } from "express";
import account from "./account.routes.js";
import journal from "./journal.routes.js";
import trialBalance from "./trialBalance.routes.js";

const router = Router();
router.use("/accounts", account);
router.use("/journal-entries", journal);
router.use("/trial-balance", trialBalance);
export default router;
