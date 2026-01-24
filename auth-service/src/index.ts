import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auth } from "./auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "").split(","),
  credentials: true, // REQUIRED for cookies
}));

// Body parsing
app.use(express.json());

// Mount Better Auth routes at /api/auth
// Better Auth handler needs Web Request API, so we convert Express req/res
app.use("/api/auth", async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  console.log(`[Auth] ${req.method} ${url}`);
  console.log(`[Auth] Origin: ${req.get('origin')}`);
  console.log(`[Auth] Trusted Origins:`, process.env.ALLOWED_ORIGINS?.split(","));

  // Build headers, ensuring origin is preserved
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  const webRequest = new Request(url, {
    method: req.method,
    headers: headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  try {
    const webResponse = await auth.handler(webRequest);

    console.log(`[Auth] Response status: ${webResponse.status}`);

    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await webResponse.text();
    res.send(responseBody);
  } catch (error) {
    console.error("Auth handler error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔐 Better Auth service running on http://localhost:${PORT}`);
  console.log(`📍 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});
