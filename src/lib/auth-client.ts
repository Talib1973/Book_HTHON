import { createAuthClient } from "better-auth/react";

// Use customFields from docusaurus.config.ts in browser environment
const getAuthServiceUrl = (): string => {
  if (typeof window !== 'undefined') {
    // @ts-ignore - customFields is set in docusaurus.config.ts
    return window.docusaurus?.siteConfig?.customFields?.AUTH_SERVICE_URL || "https://auth-service-one-eta.vercel.app";
  }
  return "https://auth-service-one-eta.vercel.app";
};

export const authClient = createAuthClient({
  baseURL: getAuthServiceUrl(),
  fetchOptions: {
    credentials: "include", // CRITICAL: Send cookies with requests
  },
});

// Export hooks for convenience
export const useSession = authClient.useSession;
