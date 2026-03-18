import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Todo } from "@bmad-todo/shared";
import type { ReactNode } from "react";

// Mock the API module
vi.mock("@/api/todos", () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

import { getTodos, createTodo, toggleTodo, deleteTodo } from "@/api/todos";
import { useTodos } from "./use-todos";

const mockGetTodos = vi.mocked(getTodos);
const mockCreateTodo = vi.mocked(createTodo);
const mockToggleTodo = vi.mocked(toggleTodo);
const mockDeleteTodo = vi.mocked(deleteTodo);

const seedTodos: Todo[] = [
  { id: "1", text: "First", completed: false, createdAt: "2026-01-01T00:00:00Z" },
  { id: "2", text: "Second", completed: true, createdAt: "2026-01-02T00:00:00Z" },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(["todos"], seedTodos);

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

beforeEach(() => {
  vi.resetAllMocks();
  // For invalidateQueries after mutation settles
  mockGetTodos.mockResolvedValue(seedTodos);
});

describe("useTodos — mutation error rollback", () => {
  it("create mutation rolls back on error (todo removed from cache)", async () => {
    mockCreateTodo.mockRejectedValueOnce(new Error("Network error"));
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });

    act(() => {
      result.current.createMutation.mutate("New todo");
    });

    // Wait for error state and rollback
    await waitFor(() => {
      expect(result.current.createMutation.isError).toBe(true);
    });

    // After rollback + refetch with seed data, temp todo should not be in cache
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(["todos"]);
      expect(cached?.some((t) => t.text === "New todo")).toBe(false);
    });
  });

  it("toggle mutation rolls back on error (state reverts)", async () => {
    mockToggleTodo.mockRejectedValueOnce(new Error("Network error"));
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });

    act(() => {
      result.current.toggleMutation.mutate({ id: "1", completed: true });
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.toggleMutation.isError).toBe(true);
    });

    // After rollback + refetch, todo 1 should be back to completed: false
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(["todos"]);
      expect(cached?.find((t) => t.id === "1")?.completed).toBe(false);
    });
  });

  it("delete mutation rolls back on error (todo reappears)", async () => {
    mockDeleteTodo.mockRejectedValueOnce(new Error("Network error"));
    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });

    act(() => {
      result.current.deleteMutation.mutate("1");
    });

    // Wait for error
    await waitFor(() => {
      expect(result.current.deleteMutation.isError).toBe(true);
    });

    // After rollback + refetch, todo 1 should be back
    await waitFor(() => {
      const cached = queryClient.getQueryData<Todo[]>(["todos"]);
      expect(cached?.find((t) => t.id === "1")).toBeDefined();
    });
  });

  it("error state exposed from hook after mutation failure", async () => {
    mockToggleTodo.mockRejectedValueOnce(new Error("Network error"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTodos(), { wrapper: Wrapper });

    act(() => {
      result.current.toggleMutation.mutate({ id: "1", completed: true });
    });

    await waitFor(() => {
      expect(result.current.toggleMutation.isError).toBe(true);
      expect(result.current.toggleMutation.error).toBeInstanceOf(Error);
    });
  });
});
