import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "./error-state";

describe("ErrorState", () => {
  it("renders error heading", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("heading", { name: "Having trouble connecting" })).toBeInTheDocument();
  });

  it("renders error description", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText("Check your connection and try again")).toBeInTheDocument();
  });

  it("renders retry button", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("calls onRetry callback when retry button clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("has role='alert' for accessibility", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("has aria-live='assertive' region", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });
});
