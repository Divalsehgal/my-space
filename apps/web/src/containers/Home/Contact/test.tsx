/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

import Contact from "./index";
import { portfolioService } from "@/features/portfolio";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";

// Mock analytics
jest.mock("@/utils/analytics", () => {
  const actual = jest.requireActual("@/utils/analytics");
  return {
    ...actual,
    trackInteraction: jest.fn(),
  };
});

// Mock portfolio service
jest.mock("@/features/portfolio", () => ({
  portfolioService: {
    getConfig: jest.fn(),
  },
}));

jest.mock("@/context/ToastContext", () => ({
  ToastContext: React.createContext({ showToast: jest.fn() }),
}));

// Dynamic Action State Mock
let currentActionState = { status: "idle", message: "", errors: {} };
let currentIsPending = false;
const currentShowToast = jest.fn();

// Mock React 19 Hooks
jest.mock("react", () => {
    const actualReact = jest.requireActual("react");
  return {
    ...actualReact,
    useActionState: jest.fn(() => [currentActionState, jest.fn(), currentIsPending]),
    use: jest.fn(() => ({ showToast: currentShowToast })),
  };
});

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(() => ({ pending: false })),
}));

describe("Contact Container", () => {
  beforeEach(() => {
    jest.mocked(portfolioService.getConfig).mockResolvedValue({
        config: {
            contact: {
                title: "Get in Touch",
                subtitle: "Feel free to reach out for collaborations or just a friendly hello!"
            },
            socials: []
        }
    } as any);
    currentActionState = { status: "idle", message: "", errors: {} };
    currentIsPending = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders form elements correctly", async () => {
    render(await Contact());

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Message" })).toBeInTheDocument();
  });

  it("renders with context overrides and social items", async () => {
    jest.mocked(portfolioService.getConfig).mockResolvedValue({
      config: {
        contact: {
          title: "Say Hello",
          subtitle: "Drop a line",
        },
        socials: [
          { label: "GitHub", href: "https://github.com", icon: "github" },
          { label: "Unknown", href: "https://unknown.com", icon: "unknown_icon" },
        ]
      }
    } as any);

    render(await Contact());

    expect(screen.getByText("Say Hello")).toBeInTheDocument();
    expect(screen.getByText("Drop a line")).toBeInTheDocument();

    // GitHub Icon maps successfully
    expect(screen.getByTestId("GitHubIcon")).toBeInTheDocument();
    // Unknown Icon falls back to text "UN"
    expect(screen.getByText("UN")).toBeInTheDocument();
  });

  it("tracks event on successful form submission", async () => {
    currentActionState = { status: "success", message: "Sent successfully", errors: {} };
    render(await Contact());

    expect(currentShowToast).toHaveBeenCalledWith("Sent successfully", "success");
    expect(trackInteraction).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.CONTACT_SUBMIT,
      { status: "success", message: "Sent successfully" }
    );
  });

  it("tracks event on form submission error", async () => {
    currentActionState = { status: "error", message: "Failed to send", errors: { name: ["Name is required"] } };
    render(await Contact());

    expect(currentShowToast).toHaveBeenCalledWith("Failed to send", "error");
    expect(trackInteraction).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.CONTACT_SUBMIT,
      { status: "error", message: "Failed to send" }
    );
  });

  it("updates message character count on change", async () => {
    render(await Contact());
    const messageInput = screen.getByLabelText(/Message/i);
    
    fireEvent.change(messageInput, { target: { value: "Hello world" } });
    expect(screen.getByText("11 / 1000")).toBeInTheDocument();
  });

  it("uses fallback text for socials in header when icon is unknown or missing", async () => {
    jest.mocked(portfolioService.getConfig).mockResolvedValue({
      config: {
        socials: [
            { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
            { label: "Website", href: "https://dival.me" }, // missing icon property
        ]
      }
    } as any);
    render(await Contact());
    expect(screen.getByText("TW")).toBeInTheDocument();
    expect(screen.getByText("WE")).toBeInTheDocument();
  });

  it("renders defaults when context is empty", async () => {
    jest.mocked(portfolioService.getConfig).mockResolvedValue({ config: {} } as any);
    render(await Contact());
    expect(screen.getByText("Get in Touch")).toBeInTheDocument();
    expect(screen.getByText(/Feel free to reach out/i)).toBeInTheDocument();
  });

  it("shows sending state when form is pending", async () => {
    currentIsPending = true;
    
    render(await Contact());
    expect(screen.getByRole("button", { name: "Sending..." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  });
});
