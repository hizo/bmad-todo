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

const noop = () => {};

describe("TodoItem", () => {
  it("renders checkbox unchecked for active todo", () => {
    render(<TodoItem todo={makeTodo()} onToggle={noop} onDelete={noop} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders checkbox checked for completed todo", () => {
    render(<TodoItem todo={makeTodo({ completed: true })} onToggle={noop} onDelete={noop} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggle with (id, true) when clicking unchecked checkbox", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoItem todo={makeTodo({ id: "abc-123", completed: false })} onToggle={onToggle} onDelete={noop} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("abc-123", true);
  });

  it("calls onToggle with (id, false) when clicking checked checkbox", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoItem todo={makeTodo({ id: "abc-123", completed: true })} onToggle={onToggle} onDelete={noop} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("abc-123", false);
  });

  it("applies strikethrough and muted color for completed todo", () => {
    render(<TodoItem todo={makeTodo({ completed: true, text: "Done task" })} onToggle={noop} onDelete={noop} />);
    const label = screen.getByText("Done task");
    expect(label).toHaveClass("line-through");
    expect(label).toHaveClass("text-[#78716C]");
  });

  it("does not apply strikethrough for active todo", () => {
    render(<TodoItem todo={makeTodo({ completed: false, text: "Active task" })} onToggle={noop} onDelete={noop} />);
    const label = screen.getByText("Active task");
    expect(label).not.toHaveClass("line-through");
    expect(label).toHaveClass("text-[#292524]");
  });

  it("checkbox has accessible label via aria-labelledby", () => {
    render(<TodoItem todo={makeTodo({ id: "abc-123", text: "Labeled task" })} onToggle={noop} onDelete={noop} />);
    expect(screen.getByRole("checkbox", { name: "Labeled task" })).toBeInTheDocument();
  });

  it("renders delete button with accessible label containing todo text", () => {
    render(<TodoItem todo={makeTodo({ text: "Buy milk" })} onToggle={noop} onDelete={noop} />);
    expect(screen.getByRole("button", { name: "Delete Buy milk" })).toBeInTheDocument();
  });

  it("calls onDelete with correct id when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TodoItem todo={makeTodo({ id: "abc-123", text: "Delete me" })} onToggle={noop} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete Delete me" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("abc-123");
  });

  it("delete button is keyboard activatable via Enter", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TodoItem todo={makeTodo({ id: "abc-123", text: "Keyboard delete" })} onToggle={noop} onDelete={onDelete} />);

    const deleteBtn = screen.getByRole("button", { name: "Delete Keyboard delete" });
    deleteBtn.focus();
    await user.keyboard("{Enter}");

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("abc-123");
  });
});
