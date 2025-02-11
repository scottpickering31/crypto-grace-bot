const express = require("express");
require("dotenv").config();
const router = require("./routes/tokenRoutes.js");
const db = require("./integration/database/db.js");
require("./integration/telegramApi/telegramButtons.js");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use("/api", router);

// Test database connection before starting the server
async function testDbConnection() {
  try {
    await db.query("SELECT 1"); // Simple query to check if DB is accessible
    console.log("✅ Database connection successful");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Exit the app if DB connection fails
  }
}

// Start server only after verifying DB connection
testDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
