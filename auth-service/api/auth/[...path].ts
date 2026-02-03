import type { VercelRequest, VercelResponse } from "@vercel/node";

// Cached across invocations within the same serverless instance
let pool: any = null;
let authInstance: any = null;
let initError: Error | null = null;

async function initializeAuth() {
  if (authInstance) return authInstance;
  if (initError) throw initError;

  try {
    const { Pool } = await import("pg");
    const { betterAuth } = await import("better-auth");

    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await pool.connect();
      await client.query("SELECT NOW()");
      client.release();
    }

    const trustedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o: string) => o.trim())
      .filter(Boolean);

    // IMPORTANT: BETTER_AUTH_URL must be set to the FRONTEND domain
    // (e.g. https://book-hthon.vercel.app) so cookies are scoped correctly
    // when the main site proxies /api/auth/* via Vercel rewrites.
    authInstance = betterAuth({
      database: pool,
      secret: process.env.BETTER_AUTH_SECRET || "",
      baseURL: process.env.BETTER_AUTH_URL || "",
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh once per day
        cookieCache: {
          enabled: true,
          maxAge: 60 * 60 * 24 * 7,
        },
      },
      advanced: {
        cookiePrefix: "better-auth",
        useSecureCookies: true,
        crossSubDomainCookies: {
          enabled: false,
        },
      },
      trustedOrigins,
    });

    return authInstance;
  } catch (error) {
    initError = error as Error;
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // CORS
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o: string) => o.trim())
      .filter(Boolean);
    const origin = (req.headers.origin as string) || "";

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const auth = await initializeAuth();

    // Reconstruct path from Vercel catch-all param
    const pathSegments = req.query.path || [];
    const pathArray = Array.isArray(pathSegments) ? pathSegments : [pathSegments];
    const pathString = pathArray.length > 0 ? `/${pathArray.join("/")}` : "";
    const fullPath = `/api/auth${pathString}`;

    // Preserve non-path query params
    const urlObj = new URL(req.url || "/", `https://${req.headers.host}`);
    const queryParams = new URLSearchParams();
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (key !== "path") {
        queryParams.append(key, value);
      }
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

    const baseURL = process.env.BETTER_AUTH_URL || `https://${req.headers.host}`;
    const url = `${baseURL}${fullPath}${queryString}`;

    // Build Web API Request from the incoming Vercel request
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
    });

    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const webRequest = new Request(url, {
      method: req.method || "GET",
      headers,
      body,
    });

    // Delegate to Better Auth
    const webResponse = await auth.handler(webRequest);

    // Forward response headers (skip CORS — already set)
    webResponse.headers.forEach((value: string, key: string) => {
      if (!key.toLowerCase().startsWith("access-control-")) {
        res.setHeader(key, value);
      }
    });

    const responseBody = await webResponse.text();
    res.status(webResponse.status).send(responseBody);
  } catch (error) {
    console.error("[Auth] Handler error:", error);
    return res.status(500).json({
      error: "Authentication service error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
