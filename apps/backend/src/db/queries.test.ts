import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTodo, getAllTodos } from "./queries.js";

function makePool(rows: { id: string; text: string; completed: boolean; created_at: Date }[]) {
  return {
    query: async () => ({ rows }),
  };
}

describe("createTodo", () => {
  it("returns a correctly shaped Todo object", async () => {
    const fakeRow = {
      id: "00000000-0000-0000-0000-000000000001",
      text: "Buy groceries",
      completed: false,
      created_at: new Date("2024-01-15T10:00:00.000Z"),
    };

    const todo = await createTodo("Buy groceries", makePool([fakeRow]));

    assert.equal(todo.id, fakeRow.id);
    assert.equal(todo.text, "Buy groceries");
    assert.equal(todo.completed, false);
    assert.equal(todo.createdAt, "2024-01-15T10:00:00.000Z");
  });

  it("maps snake_case created_at to camelCase createdAt", async () => {
    const fakeRow = {
      id: "uuid",
      text: "Test",
      completed: false,
      created_at: new Date("2024-06-01T00:00:00.000Z"),
    };

    const todo = await createTodo("Test", makePool([fakeRow]));

    assert.ok("createdAt" in todo);
    assert.ok(!("created_at" in todo));
    assert.equal(todo.createdAt, "2024-06-01T00:00:00.000Z");
  });

  it("passes text as a parameterized query argument", async () => {
    let capturedParams: unknown[] = [];
    const capturingPool = {
      query: async (sql: string, params?: unknown[]) => {
        capturedParams = params ?? [];
        return {
          rows: [{ id: "uuid", text: sql, completed: false, created_at: new Date() }],
        };
      },
    };

    await createTodo("Captured", capturingPool);

    assert.ok(Array.isArray(capturedParams));
    assert.equal(capturedParams[0], "Captured");
  });

  it("uses a parameterized placeholder in the SQL (not string interpolation)", async () => {
    let capturedSql = "";
    const capturingPool = {
      query: async (sql: string) => {
        capturedSql = sql;
        return {
          rows: [{ id: "uuid", text: "x", completed: false, created_at: new Date() }],
        };
      },
    };

    await createTodo("x", capturingPool);

    assert.ok(capturedSql.includes("$1"), "SQL should use $1 placeholder");
    assert.ok(capturedSql.toUpperCase().includes("RETURNING"), "SQL should include RETURNING");
  });
});

describe("getAllTodos", () => {
  it("returns an empty array when there are no rows", async () => {
    const todos = await getAllTodos(makePool([]));
    assert.deepEqual(todos, []);
  });

  it("maps multiple rows to camelCase Todo objects", async () => {
    const fakeRows = [
      { id: "uuid-1", text: "First", completed: false, created_at: new Date("2024-01-01T00:00:00.000Z") },
      { id: "uuid-2", text: "Second", completed: true, created_at: new Date("2024-01-02T00:00:00.000Z") },
    ];

    const todos = await getAllTodos(makePool(fakeRows));

    assert.equal(todos.length, 2);
    assert.equal(todos[0].id, "uuid-1");
    assert.equal(todos[0].text, "First");
    assert.equal(todos[0].completed, false);
    assert.equal(todos[0].createdAt, "2024-01-01T00:00:00.000Z");
    assert.equal(todos[1].id, "uuid-2");
    assert.equal(todos[1].completed, true);
  });

  it("maps snake_case created_at to camelCase createdAt for all rows", async () => {
    const fakeRows = [{ id: "uuid", text: "Test", completed: false, created_at: new Date() }];

    const todos = await getAllTodos(makePool(fakeRows));

    assert.ok("createdAt" in todos[0]);
    assert.ok(!("created_at" in todos[0]));
  });

  it("uses ORDER BY in the SQL query", async () => {
    let capturedSql = "";
    const capturingPool = {
      query: async (sql: string) => {
        capturedSql = sql;
        return { rows: [] };
      },
    };

    await getAllTodos(capturingPool);

    assert.ok(capturedSql.toUpperCase().includes("ORDER BY"), "SQL should include ORDER BY");
  });
});
