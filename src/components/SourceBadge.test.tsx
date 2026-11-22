import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { makeSnapshot } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { SourceBadge } from "./SourceBadge";

const en = getDictionary("en");

describe("SourceBadge", () => {
  it("shows a live CPCB station with its translated network name", async () => {
    const snapshot = makeSnapshot({
      source: "cpcb",
      sourceLabel: "CPCB · Anand Vihar",
      freshness: "live",
      notes: ["cpcbOfficial", "noHourly"],
    });

    const { container } = renderWithI18n(<SourceBadge snapshot={snapshot} />);

    expect(screen.getByText(en.source.live)).toBeInTheDocument();
    expect(
      screen.getByText(`${en.source.cpcb} · Anand Vihar`),
    ).toBeInTheDocument();
    expect(screen.getByText(en.source.notes.cpcbOfficial)).toBeInTheDocument();
    expect(screen.getByText(en.source.notes.noHourly)).toBeInTheDocument();
    expect(screen.getByText(/^Observed:/)).toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("labels cached and sample data distinctly", () => {
    const { rerender } = renderWithI18n(
      <SourceBadge
        snapshot={makeSnapshot({
          freshness: "cached",
          notes: ["cached"],
        })}
      />,
    );
    expect(screen.getByText(en.source.cached)).toBeInTheDocument();
    expect(screen.getByText(en.source.notes.cached)).toBeInTheDocument();

    rerender(
      <SourceBadge
        snapshot={makeSnapshot({
          source: "demo",
          sourceLabel: "Built-in sample",
          freshness: "sample",
          notes: ["sample"],
          isLive: false,
        })}
      />,
    );
    expect(screen.getByText(en.source.sample)).toBeInTheDocument();
    expect(screen.getByText(en.source.demo)).toBeInTheDocument();
    expect(screen.getByText(en.source.notes.sample)).toBeInTheDocument();
  });
});
