import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Test endpoint called");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Env vars present:", {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSecret: !!process.env.BETTER_AUTH_SECRET,
    hasBaseUrl: !!process.env.BETTER_AUTH_URL,
  });

  res.status(200).json({
    message: "Test endpoint working",
    method: req.method,
    url: req.url,
    envVarsPresent: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: !!process.env.BETTER_AUTH_URL,
      ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
    }
  });
}
