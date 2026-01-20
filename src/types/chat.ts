/**
 * TypeScript interfaces for FastAPI chatbot integration
 *
 * These types match the Pydantic models in backend/api.py to ensure
 * type-safe communication between frontend and backend.
 */

/**
 * Request payload for POST /chat endpoint
 */
export interface ChatRequest {
  /** User's question (1-2000 characters) */
  message: string;

  /** Optional selected text from textbook for context (max 5000 characters) */
  context?: string | null;
}

/**
 * Source citation for textbook content
 */
export interface Citation {
  /** Textbook page title */
  title: string;

  /** Full HTTPS URL to source page */
  url: string;
}

/**
 * Response from POST /chat endpoint
 */
export interface ChatResponse {
  /** Agent's generated answer (1-10000 characters) */
  response: string;

  /** Array of citations (0-10 sources) */
  sources: Citation[];
}

/**
 * Error response for HTTP errors (400/500/503)
 */
export interface ErrorResponse {
  /** Error category for programmatic handling */
  error: "validation_error" | "server_error" | "service_unavailable";

  /** Human-readable error message */
  message: string;

  /** Whether client should retry the request */
  retryable: boolean;

  /** Unique error ID for support lookup (UUID v4, only for 500/503 errors) */
  error_id?: string | null;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ChatResponse | ErrorResponse
): response is ErrorResponse {
  return "error" in response;
}
