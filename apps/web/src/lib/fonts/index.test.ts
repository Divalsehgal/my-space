import { displayFont } from ".";

jest.mock("next/font/google", () => ({ Space_Grotesk: (opts: { variable: string }) => ({ variable: opts.variable }) }));

it("exposes the display face as a CSS variable", () => {
  expect(displayFont.variable).toBe("--font-display");
});
