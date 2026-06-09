import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TimeRangeSelector from "./TimeRangeSelector";

describe("TimeRangeSelector", () => {
  it("renders all time range options", () => {
    render(<TimeRangeSelector value="7d" onChange={() => {}} />);
    expect(screen.getByText("1H")).toBeInTheDocument();
    expect(screen.getByText("24H")).toBeInTheDocument();
    expect(screen.getByText("7D")).toBeInTheDocument();
    expect(screen.getByText("30D")).toBeInTheDocument();
    expect(screen.getByText("90D")).toBeInTheDocument();
  });

  it("calls onChange when clicked", () => {
    const onChange = vi.fn();
    render(<TimeRangeSelector value="7d" onChange={onChange} />);
    
    fireEvent.click(screen.getByText("30D"));
    expect(onChange).toHaveBeenCalledWith("30d");
  });

  it("highlights selected range", () => {
    render(<TimeRangeSelector value="24h" onChange={() => {}} />);
    const selected = screen.getByText("24H");
    expect(selected.className).toContain("bg-[var(--cc-canvas)]");
  });
});
