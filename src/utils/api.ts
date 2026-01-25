/**
 * Get the backend API URL from Docusaurus customFields
 */
export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    // @ts-ignore - customFields is set in docusaurus.config.ts
    const customUrl = window.docusaurus?.siteConfig?.customFields?.BACKEND_API_URL;
    if (customUrl) {
      return customUrl;
    }
  }

  // Fallback to localhost for development
  return 'http://localhost:8000';
};
