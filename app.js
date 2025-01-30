const express = require("express");
require("dotenv").config();
const router = require("./routes/tokenRoutes.js");
const db = require("./integration/database/db.js");
require("./integration/telegramApi/telegramButtons.js");

// Create express app
const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use("/api", router);

db.connect();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
