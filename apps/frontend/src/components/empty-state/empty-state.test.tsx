import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders heading text", () => {
    render(<EmptyState />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<EmptyState />);
    expect(
      screen.getByText("Add your first task above to get started.")
    ).toBeInTheDocument();
  });
});
