import { isOwnerMode } from "./ownerMode";

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
