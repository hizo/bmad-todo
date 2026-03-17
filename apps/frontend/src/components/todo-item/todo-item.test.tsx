import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Todo } from "@bmad-todo/shared";
import { TodoItem } from "./todo-item";

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: "abc-123",
  text: "Test todo",
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("TodoItem", () => {
  it("renders checkbox unchecked for active todo", () => {
    render(<TodoItem todo={makeTodo()} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders checkbox checked for completed todo", () => {
    render(<TodoItem todo={makeTodo({ completed: true })} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggle with (id, true) when clicking unchecked checkbox", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoItem todo={makeTodo({ id: "abc-123", completed: false })} onToggle={onToggle} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("abc-123", true);
  });

  it("calls onToggle with (id, false) when clicking checked checkbox", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoItem todo={makeTodo({ id: "abc-123", completed: true })} onToggle={onToggle} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("abc-123", false);
  });

  it("applies strikethrough and muted color for completed todo", () => {
    render(<TodoItem todo={makeTodo({ completed: true, text: "Done task" })} onToggle={() => {}} />);
    const label = screen.getByText("Done task");
    expect(label).toHaveClass("line-through");
    expect(label).toHaveClass("text-[#78716C]");
  });

  it("does not apply strikethrough for active todo", () => {
    render(<TodoItem todo={makeTodo({ completed: false, text: "Active task" })} onToggle={() => {}} />);
    const label = screen.getByText("Active task");
    expect(label).not.toHaveClass("line-through");
    expect(label).toHaveClass("text-[#292524]");
  });

  it("checkbox has accessible label via aria-labelledby", () => {
    render(<TodoItem todo={makeTodo({ id: "abc-123", text: "Labeled task" })} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Labeled task" })).toBeInTheDocument();
  });
});
