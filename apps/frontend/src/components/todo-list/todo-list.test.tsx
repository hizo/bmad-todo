import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Todo } from "@bmad-todo/shared";
import { TodoList } from "./todo-list";

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: "1",
  text: "Test todo",
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const noop = () => {};

describe("TodoList", () => {
  it("renders a list item for each todo", () => {
    const todos: Todo[] = [
      makeTodo({ id: "1", text: "Buy milk" }),
      makeTodo({ id: "2", text: "Walk the dog" }),
    ];
    render(<TodoList todos={todos} onToggle={noop} onDelete={noop} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("renders EmptyState when todos array is empty", () => {
    render(<TodoList todos={[]} onToggle={noop} onDelete={noop} />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first task above to get started.")
    ).toBeInTheDocument();
  });

  it("displays todo text correctly", () => {
    const todos: Todo[] = [makeTodo({ text: "Read a book" })];
    render(<TodoList todos={todos} onToggle={noop} onDelete={noop} />);
    expect(screen.getByText("Read a book")).toBeInTheDocument();
  });

  it("passes onToggle down to TodoItem components", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const todos: Todo[] = [makeTodo({ id: "abc-123", text: "Clickable todo" })];
    render(<TodoList todos={todos} onToggle={onToggle} onDelete={noop} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledWith("abc-123", true);
  });

  it("passes onDelete down to TodoItem components", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const todos: Todo[] = [makeTodo({ id: "abc-123", text: "Deletable todo" })];
    render(<TodoList todos={todos} onToggle={noop} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete Deletable todo" }));

    expect(onDelete).toHaveBeenCalledWith("abc-123");
  });
});
