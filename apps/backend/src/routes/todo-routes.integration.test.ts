import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { pool } from "../db/pool.js";
import { errorHandler } from "../plugins/error-handler.js";
import { todoRoutes } from "./todo-routes.js";

async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: "Test API", version: "0.0.1" },
    },
  });

  await app.register(fastifySwaggerUi, { routePrefix: "/docs" });

  app.register(errorHandler);
  app.register(todoRoutes, { prefix: "/api/todos" });

  await app.ready();
  return app;
}

describe("todo-routes integration", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  before(async () => {
    app = await buildApp();
    await pool.query("TRUNCATE TABLE todos RESTART IDENTITY CASCADE");
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE todos RESTART IDENTITY CASCADE");
  });

  after(async () => {
    await app.close();
    await pool.end();
  });

  describe("POST /api/todos", () => {
    it("returns 201 with correct response shape for valid body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "Buy groceries" },
      });

      assert.equal(response.statusCode, 201);

      const body = response.json();
      assert.ok("data" in body);
      assert.equal(typeof body.data.id, "string");
      assert.equal(body.data.text, "Buy groceries");
      assert.equal(body.data.completed, false);
      assert.equal(typeof body.data.createdAt, "string");
      assert.ok(!Number.isNaN(Date.parse(body.data.createdAt)));
    });

    it("persists the todo in the database", async () => {
      await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "Persist me" },
      });

      const getResponse = await app.inject({
        method: "GET",
        url: "/api/todos",
      });

      const body = getResponse.json();
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].text, "Persist me");
    });

    it("returns 400 with VALIDATION_ERROR for empty text", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "" },
      });

      assert.equal(response.statusCode, 400);

      const body = response.json();
      assert.ok("error" in body);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.equal(typeof body.error.message, "string");
      // No stack trace in response
      assert.ok(!("stack" in body));
      assert.ok(!("stack" in body.error));
    });

    it("returns 400 with VALIDATION_ERROR for whitespace-only text", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "   " },
      });

      assert.equal(response.statusCode, 400);

      const body = response.json();
      assert.ok("error" in body);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    it("returns 400 with VALIDATION_ERROR for missing text field", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: {},
      });

      assert.equal(response.statusCode, 400);

      const body = response.json();
      assert.ok("error" in body);
      assert.equal(body.error.code, "VALIDATION_ERROR");
    });

    it("does not leak stack traces in error responses", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "" },
      });

      const body = response.json();
      const bodyStr = JSON.stringify(body);
      assert.ok(!bodyStr.includes("at "));
      assert.ok(!bodyStr.includes(".ts:"));
      assert.ok(!bodyStr.includes(".js:"));
    });
  });

  describe("GET /api/todos", () => {
    it("returns 200 with empty array when no todos exist", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/todos",
      });

      assert.equal(response.statusCode, 200);

      const body = response.json();
      assert.ok("data" in body);
      assert.deepEqual(body.data, []);
    });

    it("returns todos in creation order", async () => {
      await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "First" },
      });
      await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "Second" },
      });
      await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "Third" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/todos",
      });

      assert.equal(response.statusCode, 200);

      const body = response.json();
      assert.equal(body.data.length, 3);
      assert.equal(body.data[0].text, "First");
      assert.equal(body.data[1].text, "Second");
      assert.equal(body.data[2].text, "Third");
    });

    it("returns 500 with INTERNAL_ERROR when database fails", async () => {
      // Drop the table to simulate a database error
      await pool.query("DROP TABLE todos");

      const response = await app.inject({
        method: "GET",
        url: "/api/todos",
      });

      assert.equal(response.statusCode, 500);

      const body = response.json();
      assert.ok("error" in body);
      assert.equal(body.error.code, "INTERNAL_ERROR");
      assert.equal(typeof body.error.message, "string");

      // No stack trace leaked
      const bodyStr = JSON.stringify(body);
      assert.ok(!bodyStr.includes(".ts:"));
      assert.ok(!bodyStr.includes(".js:"));

      // Recreate the table for subsequent tests
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query("CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos (created_at)");
    });

    it("returns correctly shaped Todo objects in the array", async () => {
      await app.inject({
        method: "POST",
        url: "/api/todos",
        payload: { text: "Shape test" },
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/todos",
      });

      const body = response.json();
      const todo = body.data[0];

      assert.equal(typeof todo.id, "string");
      assert.equal(typeof todo.text, "string");
      assert.equal(typeof todo.completed, "boolean");
      assert.equal(typeof todo.createdAt, "string");
    });
  });
});
