import { createAuthClient } from "better-auth/react";

// Production auth service URL
const AUTH_SERVICE_URL = "https://auth-service-one-eta.vercel.app";

export const authClient = createAuthClient({
  baseURL: AUTH_SERVICE_URL,
  fetchOptions: {
    credentials: "include", // CRITICAL: Send cookies with requests
  },
});

// Export hooks for convenience
export const useSession = authClient.useSession;
