// src/config.ts
// Use Vite env var (must be VITE_*). Provide useful local fallback.
export const BACKEND_URL: string =
  (import.meta.env.VITE_BACKEND_URL as string) ||
  // Local dev fallback (use the port you run backend on locally)
  "http://localhost:10000";
