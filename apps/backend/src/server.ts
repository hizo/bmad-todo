import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import migrate from "node-pg-migrate";
import { pool } from "./db/pool.js";
import { errorHandler } from "./plugins/error-handler.js";
import { todoRoutes } from "./routes/todo-routes.js";

const PORT = Number(process.env.BACKEND_PORT) || 3000;
const HOST = process.env.BACKEND_HOST || "0.0.0.0";

const app = Fastify({
  logger: true,
});

// Register plugins
await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "BMad Todo API",
      version: "0.1.0",
    },
  },
});

await app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.register(errorHandler);

// Register routes
app.register(todoRoutes, { prefix: "/api/todos" });

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

// Start server
const start = async () => {
  try {
    // Run migrations via node-pg-migrate
    await migrate({
      databaseUrl: process.env.DATABASE_URL as string,
      dir: new URL("./migrations", import.meta.url).pathname,
      direction: "up",
      migrationsTable: "pgmigrations",
      log: app.log.info.bind(app.log),
    });

    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
