import { betterAuth } from "better-auth";
import { Pool } from "pg";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize PostgreSQL pool with error handling
let pool: Pool | null = null;
let auth: any = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1, // Limit connections in serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

function getAuth() {
  if (!auth) {
    const dbPool = getPool();

    auth = betterAuth({
      database: dbPool,
      secret: process.env.BETTER_AUTH_SECRET || "",
      baseURL: process.env.BETTER_AUTH_URL || "",
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Refresh if accessed within 1 day
      },
      trustedOrigins: (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(o => o.trim())
        .filter(Boolean),
    });
  }
  return auth;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Enable CORS
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    const origin = req.headers.origin || "";

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

    // Handle preflight
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Get auth instance
    const authInstance = getAuth();

    // Construct full URL
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    console.log(`[Auth] ${req.method} ${url}`);
    console.log(`[Auth] Origin: ${origin}`);
    console.log(`[Auth] Headers:`, JSON.stringify(Object.keys(req.headers)));

    // Build headers for Web Request
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
      }
    });

    // Handle request body
    let body: string | undefined = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body) {
        // If body is already parsed by Vercel, stringify it
        body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }
    }

    console.log(`[Auth] Body type:`, typeof req.body);
    console.log(`[Auth] Body:`, body ? body.substring(0, 100) : "none");

    // Create Web Request
    const webRequest = new Request(url, {
      method: req.method || "GET",
      headers: headers,
      body: body,
    });

    // Call Better Auth handler
    console.log(`[Auth] Calling auth.handler...`);
    const webResponse = await authInstance.handler(webRequest);

    console.log(`[Auth] Response status: ${webResponse.status}`);

    // Set response headers (but avoid duplicate CORS headers)
    webResponse.headers.forEach((value, key) => {
      // Skip CORS headers as we already set them
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, value);
      }
    });

    // Send response
    const responseBody = await webResponse.text();
    console.log(`[Auth] Response body length: ${responseBody.length}`);

    res.status(webResponse.status).send(responseBody);
  } catch (error) {
    console.error("[Auth] Handler error:", error);
    console.error("[Auth] Error stack:", error instanceof Error ? error.stack : "No stack");

    res.status(500).json({
      error: "Authentication error",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}
