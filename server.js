/**
 * Standalone Backend Server Runner
 * Capacity Connect LMS (SIH26075)
 */

require("dotenv").config();

const app = require("./app");
const db = require("./config/db");

const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Backend] Capacity Connect LMS API running on port ${PORT}`);
});