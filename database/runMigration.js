const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function runSeed() {
  try {
    const filePath = path.join(__dirname, "seedTopics.sql");
    const sql = fs.readFileSync(filePath, "utf8");

    await pool.query(sql);

    console.log("Topics seeded successfully.");
  } catch (error) {
    console.error("Seed Error:", error.message);
  } finally {
    await pool.end();
  }
}

runSeed();