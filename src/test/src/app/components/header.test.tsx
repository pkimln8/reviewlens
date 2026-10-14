import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "../../../../app/components/header";

describe("Header", () => {
  it("renders the brand", () => {
    render(<Header onHome={() => {}} />);

    expect(screen.getByText(/ReviewLens/i)).toBeInTheDocument();
  });

  it("calls onHome when the brand is clicked", () => {
    const onHome = vi.fn();

    render(<Header onHome={onHome} />);
    fireEvent.click(screen.getByText(/ReviewLens/i));

    expect(onHome).toHaveBeenCalledOnce();
  });
});
