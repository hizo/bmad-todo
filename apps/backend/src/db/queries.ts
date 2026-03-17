import type { Todo } from "@bmad-todo/shared";
import { pool } from "./pool.js";

interface TodoRow {
  id: string;
  text: string;
  completed: boolean;
  created_at: Date;
}

interface QueryPool {
  query(text: string, values?: unknown[]): Promise<{ rows: TodoRow[] }>;
}

export async function createTodo(text: string, queryPool: QueryPool = pool): Promise<Todo> {
  const result = await queryPool.query(
    "INSERT INTO todos (text) VALUES ($1) RETURNING id, text, completed, created_at",
    [text],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("INSERT did not return a row");
  }
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at.toISOString(),
  };
}

export async function deleteAllTodos(queryPool: QueryPool = pool): Promise<void> {
  await queryPool.query("DELETE FROM todos");
}

export async function getAllTodos(queryPool: QueryPool = pool): Promise<Todo[]> {
  const result = await queryPool.query(
    "SELECT id, text, completed, created_at FROM todos ORDER BY created_at ASC",
  );
  return result.rows.map((row) => ({
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at.toISOString(),
  }));
}
