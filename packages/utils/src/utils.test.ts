import { padNumber, slugify, splitParagraphs } from "./string";
import { HTTP_STATUS } from "./http";
import { fibonacciSphere, shortestAngle } from "./math";
import { fuzzyScore } from "./fuzzy";
import { isEditableTarget, isInViewport, matchesMedia } from "./dom";

describe("slugify", () => {
  it("makes url-safe slugs", () => {
    expect(slugify("Next.js & React!")).toBe("nextjs-react");
    expect(slugify("  HTTP  Caching -- Basics ")).toBe("http-caching-basics");
  });
});

describe("math", () => {
  it("takes the short way round", () => {
    expect(shortestAngle(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(shortestAngle(0.1, 2 * Math.PI)).toBeCloseTo(-0.1);
  });

  it("spreads points on the unit sphere", () => {
    const points = fibonacciSphere(50);
    expect(points).toHaveLength(50);
    for (const { x, y, z } of points) {expect(Math.hypot(x, y, z)).toBeCloseTo(1);}
  });
});

describe("fuzzyScore", () => {
  it("prefers substring matches, then word-start subsequences", () => {
    expect(fuzzyScore("", "anything")).toBe(0);
    expect(fuzzyScore("cach", "HTTP caching")).toBeGreaterThan(fuzzyScore("htc", "HTTP caching") ?? 0);
    expect(fuzzyScore("zz", "HTTP caching")).toBeNull();
  });
});

describe("dom", () => {
  it("detects editable targets", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });

  it("checks viewport overlap and media queries safely", () => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({ top: 10, bottom: 50 }) as DOMRect;
    expect(isInViewport(el)).toBe(true);
    el.getBoundingClientRect = () => ({ top: -100, bottom: -10 }) as DOMRect;
    expect(isInViewport(el)).toBe(false);
    expect(typeof matchesMedia("(min-width: 1px)")).toBe("boolean");
  });
});

describe("string helpers", () => {
  it("splits paragraphs on blank lines and drops empties", () => {
    expect(splitParagraphs(" One.\n\n  \n\nTwo. \n")).toEqual(["One.", "Two."]);
  });

  it("zero-pads counters", () => {
    expect(padNumber(3)).toBe("03");
    expect(padNumber(7, 3)).toBe("007");
  });

  it("trims edge hyphens", () => {
    expect(slugify("-edge-")).toBe("edge");
  });
});

it("exposes the HTTP status codes", () => {
  expect(HTTP_STATUS).toMatchObject({ OK: 200, NOT_FOUND: 404, SERVICE_UNAVAILABLE: 503 });
});
