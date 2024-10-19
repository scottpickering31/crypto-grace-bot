import express from "express";
import router from "./routes/tokenRoutes.js";
import db from "./integration/database/db.js";

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
