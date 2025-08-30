import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.response.use(
  r => r,
  err => {
    console.error("API Error:", err?.response?.data || err.message);
    throw err;
  }
);
