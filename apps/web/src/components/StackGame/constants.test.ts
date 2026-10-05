import { BASE_BLOCK, BASE_SIZE, BLOCK_HEIGHT, colorFor, DEBRIS, debrisSpin, DEMO, DEMO_TOWER } from "./constants";

describe("stack game constants", () => {
  it("colours the base darker and drifts hue per block, wrapping at 360°", () => {
    expect(colorFor(0)).toBe("hsl(232, 46%, 34%)");
    expect(colorFor(1)).toBe("hsl(240, 46%, 62%)");
    expect(colorFor(20)).toBe("hsl(32, 46%, 62%)");
  });

  it("gives every piece a deterministic spin within ±spinScale/2", () => {
    expect(debrisSpin(5)).toBe(debrisSpin(5));
    for (let id = 0; id < 50; id++) {
      expect(Math.abs(debrisSpin(id))).toBeLessThanOrEqual(DEBRIS.spinScale / 2);
    }
  });

  it("builds a shrinking demo tower on the base block", () => {
    expect(DEMO_TOWER[0]).toBe(BASE_BLOCK);
    expect(DEMO_TOWER).toHaveLength(DEMO.shifts.length + 1);
    const top = DEMO_TOWER.at(-1)!;
    expect(top.y).toBeCloseTo(DEMO.shifts.length * BLOCK_HEIGHT);
    expect(top.w).toBeLessThan(BASE_SIZE);
    expect(new Set(DEMO_TOWER.map((b) => b.id)).size).toBe(DEMO_TOWER.length);
  });
});
