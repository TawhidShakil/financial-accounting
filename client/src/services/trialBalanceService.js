import { api } from "../lib/api";
export const getTrialBalance = (to) => api.get("/trial-balance",{ params: to?{to}:{}}).then(r=>r.data);