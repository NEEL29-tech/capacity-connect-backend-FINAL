const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function resetPassword() {
  const passwordHash = await bcrypt.hash("user@123", 10);

  await db.query(
    "UPDATE users SET password_hash = $1 WHERE id = $2",
    [passwordHash, 5]
  );

  console.log("Password reset successfully");
  process.exit(0);
}

resetPassword();