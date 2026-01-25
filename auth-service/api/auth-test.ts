import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("[Auth Test] Starting test...");

    // Test 1: Can we import Better Auth?
    console.log("[Auth Test] Importing betterAuth...");
    const { betterAuth } = await import("better-auth");
    console.log("[Auth Test] betterAuth imported successfully");

    // Test 2: Can we create a Pool?
    console.log("[Auth Test] Importing Pool...");
    const { Pool } = await import("pg");
    console.log("[Auth Test] Pool imported successfully");

    // Test 3: Can we connect to database?
    console.log("[Auth Test] Creating database pool...");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
    });

    console.log("[Auth Test] Testing database connection...");
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log("[Auth Test] Database query successful:", result.rows[0]);

    // Test 4: Can we create Better Auth instance?
    console.log("[Auth Test] Creating Better Auth instance...");
    const auth = betterAuth({
      database: pool,
      secret: process.env.BETTER_AUTH_SECRET || "test-secret",
      baseURL: process.env.BETTER_AUTH_URL || "https://test.com",
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
      },
    });
    console.log("[Auth Test] Better Auth instance created");

    await pool.end();

    res.status(200).json({
      success: true,
      tests: {
        import_betterAuth: "✓",
        import_pool: "✓",
        database_connection: "✓",
        betterAuth_creation: "✓",
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[Auth Test] Error:", error);
    console.error("[Auth Test] Stack:", error instanceof Error ? error.stack : "No stack");

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
