import { api } from "../lib/api";

export const listEntries = (params) =>
  api.get("/journal-entries", { params }).then(r => r.data);

export const createEntry = (payload) =>
  api.post("/journal-entries", payload).then(r => r.data);
