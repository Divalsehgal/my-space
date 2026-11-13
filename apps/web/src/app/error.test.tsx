import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorPage from "./error";
import NotFound, { generateMetadata } from "./not-found";
import ModalDefault from "./@modal/default";
import ModalHome from "./@modal/page";
import ModalCatchAll from "./@modal/[...catchAll]/page";

jest.mock("@/components/NotFound", () => jest.requireActual("@/test-utils/server").stub("NotFound"));

describe("app status pages", () => {
  const env = process.env;
  afterEach(() => {
    process.env = env;
  });

  it("retries from the error page and hides the stack outside development", () => {
    const reset = jest.fn();
    render(<ErrorPage error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button"));
    expect(reset).toHaveBeenCalled();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });

  it("shows the stack (or message) in development", () => {
    process.env = { ...env, NODE_ENV: "development" };
    const error = new Error("boom");
    error.stack = "";
    render(<ErrorPage error={error} reset={jest.fn()} />);
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders the not-found page without indexing", () => {
    render(<NotFound />);
    expect(screen.getByTestId("NotFound")).toBeInTheDocument();
    expect(generateMetadata().robots).toEqual({ index: false, follow: true });
  });

  it("renders empty modal slots", () => {
    expect(ModalDefault()).toBeNull();
    expect(ModalHome()).toBeNull();
    expect(ModalCatchAll()).toBeNull();
  });
});
