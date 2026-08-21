import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prefer DIRECT_URL for migrations (non-pooler). Fall back to DATABASE_URL, then a
// local placeholder so `prisma generate` and CI builds never require a real DB URL.
const datasourceUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
