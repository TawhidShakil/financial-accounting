import { Router } from "express";
import { createEntry, listEntries } from "../controllers/journal.controller.js";
const route = Router();
route.post("/", createEntry);
route.get("/", listEntries);
export default route;
