import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the API module before importing App
vi.mock("@/api/todos", () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

import { getTodos, createTodo, toggleTodo, deleteTodo } from "@/api/todos";
import App from "./App";

const mockGetTodos = vi.mocked(getTodos);
const mockCreateTodo = vi.mocked(createTodo);
const mockToggleTodo = vi.mocked(toggleTodo);
const mockDeleteTodo = vi.mocked(deleteTodo);

const seedTodos = [
  { id: "1", text: "First todo", completed: false, createdAt: "2026-01-01T00:00:00Z" },
  { id: "2", text: "Second todo", completed: true, createdAt: "2026-01-02T00:00:00Z" },
];

beforeEach(() => {
  vi.resetAllMocks();
  mockGetTodos.mockResolvedValue(seedTodos);
});

describe("App", () => {
  it("renders heading and todo list after loading", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "BMad Todo" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });
    expect(screen.getByText("Second todo")).toBeInTheDocument();
  });

  it("shows loading state while fetching", async () => {
    let resolveGetTodos!: (value: typeof seedTodos) => void;
    mockGetTodos.mockReturnValue(new Promise((r) => { resolveGetTodos = r; }));

    render(<App />);

    // Loading/suspense fallback should be visible
    expect(screen.getByRole("status")).toBeInTheDocument();

    resolveGetTodos(seedTodos);
    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });
  });

  it("creates a todo via the form", async () => {
    const newTodo = { id: "3", text: "New todo", completed: false, createdAt: "2026-01-03T00:00:00Z" };
    mockCreateTodo.mockResolvedValue(newTodo);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    await user.type(input, "New todo{Enter}");

    expect(mockCreateTodo).toHaveBeenCalled();
    expect(mockCreateTodo.mock.calls[0][0]).toBe("New todo");
  });

  it("toggles a todo completion", async () => {
    const toggled = { ...seedTodos[0], completed: true };
    mockToggleTodo.mockResolvedValue(toggled);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(mockToggleTodo).toHaveBeenCalledWith("1", true);
  });

  it("announces 'Task completed' after toggle", async () => {
    const toggled = { ...seedTodos[0], completed: true };
    mockToggleTodo.mockResolvedValue(toggled);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    await waitFor(() => {
      const liveRegions = screen.getAllByRole("status");
      const announcement = liveRegions.find((el) => el.textContent === "Task completed");
      expect(announcement).toBeDefined();
    });
  });

  it("deletes a todo", async () => {
    mockDeleteTodo.mockResolvedValue({ id: "1" });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockDeleteTodo).toHaveBeenCalledWith("1");
  });

  it("announces 'Task deleted' after deletion", async () => {
    mockDeleteTodo.mockResolvedValue({ id: "1" });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      const liveRegions = screen.getAllByRole("status");
      const announcement = liveRegions.find((el) => el.textContent === "Task deleted");
      expect(announcement).toBeDefined();
    });
  });

  it("shows create error message on mutation failure", async () => {
    mockCreateTodo.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("First todo")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    await user.type(input, "Fail todo{Enter}");

    await waitFor(() => {
      expect(screen.getByText(/Couldn't save/)).toBeInTheDocument();
    });
  });
});
