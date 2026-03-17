import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddTodoForm } from "./add-todo-form";

const mockSubmit = () => vi.fn().mockResolvedValue(undefined);

describe("AddTodoForm", () => {
  it("renders input with correct placeholder", () => {
    render(<AddTodoForm onSubmit={mockSubmit()} />);
    expect(screen.getByPlaceholderText("What needs to be done?")).toBeInTheDocument();
  });

  it("input has aria-label 'New todo'", () => {
    render(<AddTodoForm onSubmit={mockSubmit()} />);
    expect(screen.getByRole("textbox", { name: "New todo" })).toBeInTheDocument();
  });

  it("calls onSubmit with trimmed text when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSubmit = mockSubmit();
    render(<AddTodoForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "New todo" });
    await user.type(input, "  Buy milk  ");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("Buy milk");
  });

  it("clears input after submit", async () => {
    const user = userEvent.setup();
    render(<AddTodoForm onSubmit={mockSubmit()} />);
    const input = screen.getByRole("textbox", { name: "New todo" });
    await user.type(input, "Buy milk");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
  });

  it("does not clear input when submit fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<AddTodoForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "New todo" });
    await user.type(input, "Buy milk");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Buy milk");
  });

  it("does not call onSubmit when input is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = mockSubmit();
    render(<AddTodoForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "New todo" });
    await user.click(input);
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when input is whitespace only", async () => {
    const user = userEvent.setup();
    const onSubmit = mockSubmit();
    render(<AddTodoForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "New todo" });
    await user.type(input, "   ");
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
