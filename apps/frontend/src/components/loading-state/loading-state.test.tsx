import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  it("renders with role='status' attribute", () => {
    render(<LoadingState />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with aria-busy='true' attribute", () => {
    render(<LoadingState />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("renders skeleton placeholder items (3 list items)", () => {
    render(<LoadingState />);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(3);
  });

  it("renders visually-hidden loading text for screen readers", () => {
    render(<LoadingState />);
    expect(screen.getByText("Loading todos...")).toBeInTheDocument();
  });
});
