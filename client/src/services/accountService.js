import { api } from "../lib/api";

export const getAccounts = (type) =>
  api.get("/accounts", { params: type ? { type } : {} }).then(r => r.data);

export const createAccount = (payload) =>
  api.post("/accounts", payload).then(r => r.data);
