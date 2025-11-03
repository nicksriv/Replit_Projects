import { defineConfig } from "drizzle-kit";

// Minimal configuration using SQLite for cost-effective demos
// This eliminates the need for RDS PostgreSQL, saving ~$20-30/month

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts", 
  dialect: "sqlite",
  dbCredentials: {
    url: "./db.sqlite",
  },
  verbose: true,
  strict: true,
});