import { getRememberedContact, saveRememberedContact } from "./contactRemember";
import { formatDate } from "./date";
import { humanizeSkillKey } from "./humanizeSkillKey";
import { isOwnerMode } from "./ownerMode";

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

describe("formatDate", () => {
  it("formats valid dates and rejects missing or invalid ones", () => {
    expect(formatDate("2024-03-05T12:00:00Z")).toBe("March 5, 2024");
    expect(formatDate("2024-03-05T12:00:00Z", { year: "numeric" })).toBe("2024");
    expect(formatDate(null)).toBeNull();
    expect(formatDate("not a date")).toBeNull();
  });

  it("returns null when the formatter throws", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(formatDate("2024-03-05", undefined, "not_a_locale!!")).toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("humanizeSkillKey", () => {
  it("splits camelCase, keeps acronyms and maps 'and' to '&'", () => {
    expect(humanizeSkillKey("aiEngineering")).toBe("AI Engineering");
    expect(humanizeSkillKey("qualityAndTesting")).toBe("Quality & Testing");
    expect(humanizeSkillKey("cloud_aws-tools")).toBe("Cloud AWS Tools");
  });
});

describe("isOwnerMode", () => {
  afterEach(() => {
    document.cookie = "owner_mode=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.clear();
  });

  it("reads the owner cookie and the legacy localStorage flag", () => {
    expect(isOwnerMode()).toBe(false);
    localStorage.setItem("owner_mode", "true");
    expect(isOwnerMode()).toBe(true);
    localStorage.clear();
    document.cookie = "owner_mode=1";
    expect(isOwnerMode()).toBe(true);
  });

  it("returns false when storage is unavailable", () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(isOwnerMode()).toBe(false);
    getItem.mockRestore();
  });
});
