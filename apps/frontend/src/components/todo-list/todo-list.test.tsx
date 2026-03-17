import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Todo } from "@bmad-todo/shared";
import { TodoList } from "./todo-list";

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: "1",
  text: "Test todo",
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("TodoList", () => {
  it("renders a list item for each todo", () => {
    const todos: Todo[] = [
      makeTodo({ id: "1", text: "Buy milk" }),
      makeTodo({ id: "2", text: "Walk the dog" }),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("renders empty message when todos array is empty", () => {
    render(<TodoList todos={[]} />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it("displays todo text correctly", () => {
    const todos: Todo[] = [makeTodo({ text: "Read a book" })];
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Read a book")).toBeInTheDocument();
  });
});
