// Single handler for all /api/auth/* routes.
// Vercel rewrites send all /api/auth/:path* here; req.url preserves the original path.
// CJS with dynamic import() for better-auth (ESM-only package).

let pool = null;
let authInstance = null;
let initError = null;

async function initializeAuth() {
  if (authInstance) return authInstance;
  if (initError) throw initError;

  try {
    const pg = await import("pg");
    const betterAuthMod = await import("better-auth");
    const { Pool } = pg;
    const { betterAuth } = betterAuthMod;

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
      .map((o) => o.trim())
      .filter(Boolean);

    // BETTER_AUTH_URL must be the frontend origin (e.g. https://book-hthon.vercel.app)
    // so session cookies are scoped to the domain the browser talks to via Vercel rewrites.
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
          enabled: false,
        },
      },
      trustedOrigins,
    });

    return authInstance;
  } catch (error) {
    initError = error;
    throw error;
  }
}

// Raw .js files on Vercel don't get automatic body parsing.
// Collect the raw POST body from the stream.
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  try {
    // CORS
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const origin = req.headers.origin || "";

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

    // Extract path from the original URL (rewrites preserve req.url).
    // req.url looks like "/api/auth/sign-in/email?foo=bar"
    const urlObj = new URL(req.url || "/", `https://${req.headers.host}`);
    let pathname = urlObj.pathname; // e.g. /api/auth/sign-in/email

    // Better Auth 1.4.x: server endpoint is /get-session but client SDK calls /session.
    if (pathname === "/api/auth/session") {
      pathname = "/api/auth/get-session";
    }

    const baseURL = process.env.BETTER_AUTH_URL || `https://${req.headers.host}`;
    const url = `${baseURL}${pathname}${urlObj.search}`;

    // Build Web API Request
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
    });

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const raw = await readBody(req);
      if (raw) body = raw;
    }

    const webRequest = new Request(url, {
      method: req.method || "GET",
      headers,
      body,
    });

    // Delegate to Better Auth
    const webResponse = await auth.handler(webRequest);

    // Forward response headers (skip CORS — already set above).
    // set-cookie must be handled separately: Headers combines multiple values
    // with commas, but set-cookie headers cannot be combined that way.
    webResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return; // handled below
      if (!key.toLowerCase().startsWith("access-control-")) {
        res.setHeader(key, value);
      }
    });
    const cookies = webResponse.headers.getSetCookie();
    if (cookies.length > 0) {
      res.setHeader("set-cookie", cookies);
    }

    const responseBody = await webResponse.text();
    res.status(webResponse.status).send(responseBody);
  } catch (error) {
    console.error("[Auth] Handler error:", error);
    return res.status(500).json({
      error: "Authentication service error",
      message: error.message || "Unknown error",
    });
  }
};
