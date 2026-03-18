import type { ApiResponse, Todo } from "@bmad-todo/shared";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function getTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE_URL}/api/todos`);
  if (!res.ok) {
    throw new Error(`Failed to fetch todos: ${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<Todo[]> = await res.json();
  return json.data;
}

export async function createTodo(text: string): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/api/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create todo: ${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<Todo> = await res.json();
  return json.data;
}

export async function deleteTodo(id: string): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/api/todos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete todo: ${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<{ id: string }> = await res.json();
  return json.data;
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update todo: ${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<Todo> = await res.json();
  return json.data;
}
