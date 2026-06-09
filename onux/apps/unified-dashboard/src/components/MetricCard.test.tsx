import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetricCard from "./MetricCard";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Total Users" value="1,234" />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders positive delta", () => {
    render(
      <MetricCard
        title="Revenue"
        value="$10,000"
        delta={{ value: 15.5, isPositive: true }}
      />
    );
    expect(screen.getByText("15.5%")).toBeInTheDocument();
  });

  it("renders negative delta", () => {
    render(
      <MetricCard
        title="Errors"
        value="42"
        delta={{ value: -8.2, isPositive: false }}
      />
    );
    expect(screen.getByText("8.2%")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<MetricCard title="Loading" value="0" loading={true} />);
    // When loading, value should not be visible
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
