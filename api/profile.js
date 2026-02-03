// Serverless profile endpoint: GET /api/profile, POST /api/profile
// Raw .js — Vercel does not auto-parse body or compile this file.
// Session validation: forwards the session cookie to auth-service.

const AUTH_SERVICE_URL = "https://auth-service-one-eta.vercel.app";
const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

async function getPool() {
  if (pool) return pool;
  const { Pool } = await import("pg");
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// Validate session by calling auth-service with the cookie.
// Returns user ID string or null.
async function validateSession(req) {
  const token =
    req.cookies?.["__Secure-better-auth.session_token"] ||
    req.cookies?.["better-auth.session_token"];
  if (!token) return null;

  // Parse cookies manually if req.cookies is undefined (raw .js handler)
  let sessionToken = token;
  if (!req.cookies) {
    const cookieHeader = req.headers.cookie || "";
    const match =
      cookieHeader.match(/__Secure-better-auth\.session_token=([^;]+)/) ||
      cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    sessionToken = match ? decodeURIComponent(match[1]) : null;
    if (!sessionToken) return null;
  }

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
      headers: {
        cookie: `__Secure-better-auth.session_token=${sessionToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || "";
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Validate session
  const userId = await validateSession(req);
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const db = await getPool();

  try {
    if (req.method === "GET") {
      const row = await db.query(
        `SELECT python_experience, ros_experience, has_rtx_gpu, gpu_model,
                has_jetson, jetson_model, robot_type, learning_goals,
                created_at, updated_at
         FROM user_profile WHERE user_id = $1`,
        [userId]
      );
      if (row.rows.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }
      const p = row.rows[0];
      return res.status(200).json({
        python_experience: p.python_experience,
        ros_experience: p.ros_experience,
        has_rtx_gpu: p.has_rtx_gpu,
        gpu_model: p.gpu_model,
        has_jetson: p.has_jetson,
        jetson_model: p.jetson_model,
        robot_type: p.robot_type,
        learning_goals: p.learning_goals || [],
        created_at: p.created_at?.toISOString(),
        updated_at: p.updated_at?.toISOString(),
      });
    }

    if (req.method === "POST") {
      const raw = await readBody(req);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return res.status(400).json({ error: "Invalid JSON" });
      }

      await db.query(
        `INSERT INTO user_profile (
           user_id, python_experience, ros_experience,
           has_rtx_gpu, gpu_model, has_jetson, jetson_model,
           robot_type, learning_goals
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
           python_experience = EXCLUDED.python_experience,
           ros_experience    = EXCLUDED.ros_experience,
           has_rtx_gpu       = EXCLUDED.has_rtx_gpu,
           gpu_model         = EXCLUDED.gpu_model,
           has_jetson        = EXCLUDED.has_jetson,
           jetson_model      = EXCLUDED.jetson_model,
           robot_type        = EXCLUDED.robot_type,
           learning_goals    = EXCLUDED.learning_goals,
           updated_at        = CURRENT_TIMESTAMP`,
        [
          userId,
          body.python_experience || "beginner",
          body.ros_experience || "none",
          body.has_rtx_gpu === true,
          body.gpu_model || null,
          body.has_jetson === true,
          body.jetson_model || null,
          body.robot_type || null,
          body.learning_goals || [],
        ]
      );

      return res.status(201).json({ success: true, message: "Profile saved" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[Profile] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
