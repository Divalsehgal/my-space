import { lockScroll, unlockScroll } from "./index";

describe("scroll lock", () => {
  it("locks and unlocks the document", () => {
    lockScroll();
    expect(document.documentElement.style.overflow).toBe("hidden");
    unlockScroll();
    expect(document.documentElement.style.overflow).toBe("");
  });
});
