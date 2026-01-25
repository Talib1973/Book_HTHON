import { betterAuth } from "better-auth";
import { Pool } from "pg";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize PostgreSQL pool (reused across invocations)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Better Auth instance
const auth = betterAuth({
  database: pool,
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
  trustedOrigins: (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
  const origin = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Construct full URL for the request
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    console.log(`[Auth] ${req.method} ${url}`);
    console.log(`[Auth] Origin: ${origin}`);

    // Convert Vercel request to Web Request API
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    const webRequest = new Request(url, {
      method: req.method || "GET",
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    // Call Better Auth handler
    const webResponse = await auth.handler(webRequest);

    console.log(`[Auth] Response status: ${webResponse.status}`);

    // Copy response headers
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response
    const responseBody = await webResponse.text();
    res.status(webResponse.status).send(responseBody);
  } catch (error) {
    console.error("[Auth] Handler error:", error);
    res.status(500).json({
      error: "Authentication error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
