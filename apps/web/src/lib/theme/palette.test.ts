import { CATEGORICAL_PALETTE } from "./palette";

it("has twelve categorical colours per theme", () => {
  expect(CATEGORICAL_PALETTE.light).toHaveLength(12);
  expect(CATEGORICAL_PALETTE.dark).toHaveLength(12);
  expect(CATEGORICAL_PALETTE.light.every(Boolean)).toBe(true);
});
