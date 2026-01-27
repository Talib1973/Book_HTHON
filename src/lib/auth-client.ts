import { createAuthClient } from "better-auth/react";

// Use local proxy path - Vercel will rewrite to auth service
// This ensures cookies are set on the same domain (book-hthon.vercel.app)
const AUTH_SERVICE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/api/auth`
  : "https://book-hthon.vercel.app/api/auth";

console.log("🔐 Auth client initialized with base URL:", AUTH_SERVICE_URL);

export const authClient = createAuthClient({
  baseURL: AUTH_SERVICE_URL,
  fetchOptions: {
    credentials: "include", // CRITICAL: Send cookies with requests
  },
});

// Export hooks for convenience
export const useSession = authClient.useSession;
