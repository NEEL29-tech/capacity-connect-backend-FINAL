const { pool } = require("../config/db");

async function checkNewTables() {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'units',
          'topics',
          'topic_materials',
          'topic_progress'
        )
      ORDER BY table_name;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("Database Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkNewTables();