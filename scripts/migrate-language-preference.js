/**
 * T005: Run language_preference migration against Neon Postgres.
 * Usage: DATABASE_URL=<neon-url> node scripts/migrate-language-preference.js
 */
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await pool.query(`
      ALTER TABLE user_profile
        ADD COLUMN IF NOT EXISTS language_preference varchar(2) NOT NULL DEFAULT 'en'
    `);
    console.log("[migrate] ALTER TABLE: OK");

    const { rows } = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_profile' AND column_name = 'language_preference'
    `);
    console.log("[migrate] Verification:", rows[0] || "COLUMN NOT FOUND");

    if (rows.length === 0) {
      console.error("[migrate] FAIL: column not present after migration");
      process.exit(1);
    }
    console.log("[migrate] PASS");
  } catch (err) {
    console.error("[migrate] ERROR:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
