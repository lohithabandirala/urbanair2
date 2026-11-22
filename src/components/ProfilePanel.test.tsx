import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { TEST_PROFILE } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { ProfilePanel } from "./ProfilePanel";

const en = getDictionary("en");

describe("ProfilePanel", () => {
  it("reports commute, cooking, vulnerability and exercise changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReset = vi.fn();
    const { container } = renderWithI18n(
      <ProfilePanel
        profile={TEST_PROFILE}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    await user.click(
      screen.getByLabelText(en.profile.commuteOptions["public-transport"]),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      commuteMode: "public-transport",
    });

    await user.click(
      screen.getByLabelText(en.profile.vulnerableOptions.children),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      vulnerableGroups: ["children"],
    });

    await user.selectOptions(
      screen.getByLabelText(en.profile.cooking),
      "electric",
    );
    expect(onChange).toHaveBeenLastCalledWith({ cookingFuel: "electric" });

    await user.click(screen.getByLabelText(en.profile.exerciseNo));
    expect(onChange).toHaveBeenLastCalledWith({ exercisesOutdoors: false });

    await user.click(screen.getByRole("button", { name: en.profile.reset }));
    expect(onReset).toHaveBeenCalledTimes(1);

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("reflects the supplied profile state", () => {
    renderWithI18n(
      <ProfilePanel
        profile={{
          ...TEST_PROFILE,
          commuteMode: "walk-cycle",
          vulnerableGroups: ["elderly"],
        }}
        onChange={() => {}}
        onReset={() => {}}
      />,
    );

    expect(
      screen.getByLabelText(en.profile.commuteOptions["walk-cycle"]),
    ).toBeChecked();
    expect(
      screen.getByLabelText(en.profile.vulnerableOptions.elderly),
    ).toBeChecked();
    expect(screen.getByText(en.profile.privacy)).toBeInTheDocument();
  });
});
