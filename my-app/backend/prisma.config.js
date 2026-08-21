import "dotenv/config";
import { defineConfig, env } from "prisma/config";
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    // Prisma 7 CLI uses this for migrate/introspect — use DIRECT_URL (not pooler)
    datasource: {
        url: env("DIRECT_URL"),
    },
});
//# sourceMappingURL=prisma.config.js.map