import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RouteModal from "./index";

const back = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ back }) }));

describe("RouteModal", () => {
  afterEach(() => back.mockClear());

  const renderModal = () =>
    render(
      <RouteModal labelledBy="title" closeLabel="Close">
        <h2 id="title">Architecture</h2>
      </RouteModal>,
    );

  it("is a dialog labelled by its heading", () => {
    renderModal();
    expect(screen.getByRole("dialog", { hidden: true })).toHaveAttribute("aria-labelledby", "title");
    expect(screen.getByText("Architecture")).toBeInTheDocument();
  });

  it("goes back when closed with the button or Escape", () => {
    renderModal();
    fireEvent.click(screen.getByLabelText("Close"));
    fireEvent(screen.getByRole("dialog", { hidden: true }), new Event("cancel", { cancelable: true }));
    expect(back).toHaveBeenCalledTimes(2);
  });
});
