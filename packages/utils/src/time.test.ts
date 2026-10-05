import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, SECONDS_PER_DAY, SECONDS_PER_YEAR } from "./time";

describe("time units", () => {
  it("derives larger units from smaller ones", () => {
    expect(MS_PER_MINUTE).toBe(60_000);
    expect(MS_PER_HOUR).toBe(3_600_000);
    expect(MS_PER_DAY).toBe(86_400_000);
    expect(SECONDS_PER_DAY).toBe(86_400);
    expect(SECONDS_PER_YEAR).toBe(31_536_000);
  });
});
