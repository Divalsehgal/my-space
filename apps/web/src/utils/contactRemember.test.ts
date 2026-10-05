import { getRememberedContact, saveRememberedContact } from "./contactRemember";

describe("contactRemember", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a saved contact", () => {
    saveRememberedContact({ name: "Ann", email: "ann@example.com" });
    expect(getRememberedContact()).toEqual({ name: "Ann", email: "ann@example.com" });
  });

  it("returns null when nothing, malformed or invalid data is stored", () => {
    expect(getRememberedContact()).toBeNull();
    localStorage.setItem("contact:remembered-contact", "{not json");
    expect(getRememberedContact()).toBeNull();
    localStorage.setItem("contact:remembered-contact", JSON.stringify({ name: 1, email: "a@b.co" }));
    expect(getRememberedContact()).toBeNull();
    localStorage.setItem("contact:remembered-contact", "null");
    expect(getRememberedContact()).toBeNull();
  });

  it("ignores storage failures", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveRememberedContact({ name: "A", email: "a@b.co" })).not.toThrow();
    setItem.mockRestore();
  });
});
