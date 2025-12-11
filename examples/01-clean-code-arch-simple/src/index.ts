import "dotenv/config";
import { createDatabasePool } from "./adapters/database/postgres-connection.js";
import { createApp } from "./composition-root.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "orders_db",
};

// Create infrastructure dependencies
const pool = createDatabasePool(dbConfig);

// Compose application
const app = createApp(pool);

// Graceful shutdown handler
async function shutdown() {
  console.log("Shutting down gracefully...");
  await pool.end();
  console.log("Database pool closed");
  process.exit(0);
}

// Register shutdown handlers
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
console.log(`Starting server on port ${PORT}...`);
console.log(`Database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);

// Node.js runtime
const { serve } = await import("@hono/node-server");
serve({
  fetch: app.fetch,
  port: PORT,
});
