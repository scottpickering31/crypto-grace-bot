const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true, // Wait instead of throwing errors if all connections are in use
  connectionLimit: 10, // Max number of connections
  queueLimit: 0, // No limit on waiting queries
});

db.on("error", (err) => {
  console.error("MySQL Pool Error:", err);
});

module.exports = db.promise();
