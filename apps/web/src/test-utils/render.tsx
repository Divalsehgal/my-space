import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import ClickTracker from "@/components/ClickTracker";

/** Renders like the root layout does: with the delegated analytics listener mounted. */
export function renderWithTracking(ui: ReactElement) {
  return render(
    <>
      <ClickTracker />
      {ui}
    </>,
  );
}
