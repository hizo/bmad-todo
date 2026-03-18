import { describe, expect, it, vi, beforeEach } from "vitest";
import { getTodos, createTodo, deleteTodo, toggleTodo } from "./todos";

const BASE_URL = "http://localhost:3000";

const mockTodo = {
  id: "abc-123",
  text: "Test todo",
  completed: false,
  createdAt: "2026-01-01T00:00:00Z",
};

function mockFetchOnce(body: unknown, init?: ResponseInit) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status: 200, ...init }),
  );
}

function mockFetchErrorOnce(status: number, statusText: string) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response("", { status, statusText }),
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getTodos", () => {
  it("fetches todos from GET /api/todos", async () => {
    mockFetchOnce({ data: [mockTodo] });

    const result = await getTodos();

    expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/todos`);
    expect(result).toEqual([mockTodo]);
  });

  it("throws on non-ok response", async () => {
    mockFetchErrorOnce(500, "Internal Server Error");

    await expect(getTodos()).rejects.toThrow("Failed to fetch todos: 500 Internal Server Error");
  });
});

describe("createTodo", () => {
  it("posts text to POST /api/todos", async () => {
    mockFetchOnce({ data: mockTodo }, { status: 201 });

    const result = await createTodo("Test todo");

    expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Test todo" }),
    });
    expect(result).toEqual(mockTodo);
  });

  it("throws on non-ok response", async () => {
    mockFetchErrorOnce(400, "Bad Request");

    await expect(createTodo("")).rejects.toThrow("Failed to create todo: 400 Bad Request");
  });
});

describe("deleteTodo", () => {
  it("sends DELETE /api/todos/:id", async () => {
    mockFetchOnce({ data: { id: "abc-123" } });

    const result = await deleteTodo("abc-123");

    expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/todos/abc-123`, {
      method: "DELETE",
    });
    expect(result).toEqual({ id: "abc-123" });
  });

  it("throws on non-ok response", async () => {
    mockFetchErrorOnce(404, "Not Found");

    await expect(deleteTodo("bad-id")).rejects.toThrow("Failed to delete todo: 404 Not Found");
  });
});

describe("toggleTodo", () => {
  it("sends PATCH /api/todos/:id with completed flag", async () => {
    const toggled = { ...mockTodo, completed: true };
    mockFetchOnce({ data: toggled });

    const result = await toggleTodo("abc-123", true);

    expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE_URL}/api/todos/abc-123`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    expect(result).toEqual(toggled);
  });

  it("throws on non-ok response", async () => {
    mockFetchErrorOnce(500, "Internal Server Error");

    await expect(toggleTodo("abc-123", true)).rejects.toThrow(
      "Failed to update todo: 500 Internal Server Error",
    );
  });
});
