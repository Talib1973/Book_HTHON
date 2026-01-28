import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Cached instances  
let pool = null;
let authInstance = null;
let initError = null;

async function initializeAuth() {
  if (authInstance) return authInstance;
  if (initError) throw initError;

  try {
    console.log("[Auth Init] Starting initialization...");

    // Create pool
    if (!pool) {
      console.log("[Auth Init] Creating database pool...");
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      console.log("[Auth Init] Testing database connection...");
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log("[Auth Init] Database connected successfully");
    }

    // Create Better Auth instance
    console.log("[Auth Init] Creating Better Auth instance...");

    const trustedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
    console.log("[Auth Init] Trusted origins:", trustedOrigins);
    console.log("[Auth Init] Base URL:", process.env.BETTER_AUTH_URL);

    authInstance = betterAuth({
      database: pool,
      secret: process.env.BETTER_AUTH_SECRET || "",
      baseURL: process.env.BETTER_AUTH_URL || "",
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 60 * 60 * 24 * 7,
        },
      },
      advanced: {
        cookiePrefix: "better-auth",
        useSecureCookies: true,
        crossSubDomainCookies: {
          enabled: false, // Disable because we're on different domains
        },
      },
      trustedOrigins: trustedOrigins,
    });

    console.log("[Auth Init] Better Auth instance created successfully");
    return authInstance;
  } catch (error) {
    console.error("[Auth Init] Initialization failed:", error);
    initError = error;
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    console.log(`[Auth Handler] ${req.method} ${req.url}`);

    // CORS
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
      console.log("[Auth Handler] Handling OPTIONS preflight");
      return res.status(200).end();
    }

    // Initialize auth
    console.log("[Auth Handler] Initializing auth...");
    const auth = await initializeAuth();
    console.log("[Auth Handler] Auth initialized");

    // Build Web Request
    // Vercel provides route params in req.query for dynamic routes
    // For [...path].mjs, req.query.path is an array of path segments
    const pathSegments = req.query.path || [];
    const pathArray = Array.isArray(pathSegments) ? pathSegments : [pathSegments];
    const pathString = pathArray.length > 0 ? `/${pathArray.join('/')}` : '';
    const fullPath = `/api/auth${pathString}`;

    // Get any other query params (excluding 'path')
    const urlObj = new URL(req.url, `https://${req.headers.host}`);
    const queryParams = new URLSearchParams();
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (key !== 'path') {
        queryParams.append(key, value);
      }
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const baseURL = process.env.BETTER_AUTH_URL || `https://${req.headers.host}`;
    const url = `${baseURL}${fullPath}${queryString}`;

    console.log(`[Auth Handler] Original req.url: ${req.url}`);
    console.log(`[Auth Handler] Path segments: ${JSON.stringify(pathArray)}`);
    console.log(`[Auth Handler] Full path: ${fullPath}`);
    console.log(`[Auth Handler] Constructed URL: ${url}`);

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
    });

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      console.log(`[Auth Handler] Request body length: ${body.length}`);
    }

    const webRequest = new Request(url, {
      method: req.method || "GET",
      headers,
      body,
    });

    // Call Better Auth
    console.log("[Auth Handler] Calling auth.handler...");
    const webResponse = await auth.handler(webRequest);
    console.log(`[Auth Handler] Response status: ${webResponse.status}`);

    // Set response headers
    webResponse.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, value);
        // Log cookie headers for debugging
        if (key.toLowerCase() === 'set-cookie') {
          console.log(`[Auth Handler] Setting cookie: ${value}`);
        }
      }
    });

    // Log all response headers for debugging
    console.log("[Auth Handler] Response headers:", Object.fromEntries(webResponse.headers.entries()));

    // Send response
    const responseBody = await webResponse.text();
    console.log(`[Auth Handler] Sending response, body length: ${responseBody.length}`);
    res.status(webResponse.status).send(responseBody);

  } catch (error) {
    console.error("[Auth Handler] Error:", error);
    return res.status(500).json({
      error: "Authentication service error",
      message: error.message || "Unknown error"
    });
  }
}
