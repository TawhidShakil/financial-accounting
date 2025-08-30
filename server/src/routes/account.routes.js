import { Router } from "express";
import { createAccount, listAccounts } from "../controllers/account.controller.js";
const route = Router();
route.post("/", createAccount);
route.get("/", listAccounts);
export default route;
