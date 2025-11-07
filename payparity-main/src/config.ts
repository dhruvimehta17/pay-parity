// src/config.ts
export const BACKEND_URL: string =
  (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8000";

