import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { makeSnapshot } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { SampleDataBanner } from "./SampleDataBanner";

const en = getDictionary("en");

describe("SampleDataBanner", () => {
  it("renders sample data alert with city name and note", async () => {
    const snapshot = makeSnapshot({ freshness: "sample" });
    const { container } = renderWithI18n(
      <SampleDataBanner snapshot={snapshot} />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(en.app.demoData);
    expect(alert).toHaveTextContent(snapshot.location.city);
    expect(alert).toHaveTextContent(en.source.notes.sample);

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });
});
