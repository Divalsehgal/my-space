import { emitSiteEvent, SITE_EVENTS } from "./site-events";

describe("emitSiteEvent", () => {
  it("dispatches a CustomEvent with detail on window", () => {
    const listener = jest.fn();
    window.addEventListener(SITE_EVENTS.openChat, listener);
    emitSiteEvent(SITE_EVENTS.openChat, { question: "hi" });
    window.removeEventListener(SITE_EVENTS.openChat, listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ question: "hi" });
  });
});
