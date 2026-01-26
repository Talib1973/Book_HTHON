import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load env vars before creating pool
dotenv.config();

console.log("🗄️  Database Connection:");
console.log("   URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const trustedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

console.log("🔧 Better Auth Configuration:");
console.log("   Base URL:", process.env.BETTER_AUTH_URL || "http://localhost:3001");
console.log("   Trusted Origins:", trustedOrigins);

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || "default-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh if accessed within 1 day
  },
  trustedOrigins: trustedOrigins,
});
