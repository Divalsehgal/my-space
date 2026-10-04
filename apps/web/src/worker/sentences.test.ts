import { splitIntoSentences } from "./sentences";
import { validateContact } from "./guards";

// The regexes these linear scans replaced (they could backtrack super-linearly).
const legacySplit = (text: string) =>
  text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [text];
const legacyEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Deterministic pseudo-random strings over a small alphabet (LCG). */
function* samples(alphabet: string, count: number, maxLength: number) {
  let seed = 42;
  const next = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed;
  };
  for (let i = 0; i < count; i++) {
    const length = next() % (maxLength + 1);
    yield Array.from({ length }, () => alphabet[next() % alphabet.length]).join("");
  }
}

describe("splitIntoSentences", () => {
  it("splits on terminal punctuation followed by whitespace", () => {
    expect(splitIntoSentences("Hello there. How are you? Fine!")).toEqual(["Hello there.", "How are you?", "Fine!"]);
  });

  it("keeps trailing text without punctuation", () => {
    expect(splitIntoSentences("One. Two")).toEqual(["One.", "Two"]);
  });

  it("returns the input when nothing matches", () => {
    expect(splitIntoSentences("...")).toEqual(["..."]);
  });

  it("matches the legacy regex on edge cases", () => {
    for (const text of ["", " ", "a.b", "version 1.5 is great.", "Wait... what?! Ok.", ". a", "a. ", "a.\n\nb"]) {
      expect(splitIntoSentences(text)).toEqual(legacySplit(text));
    }
  });

  it("matches the legacy regex on generated input", () => {
    for (const text of samples("ab .!?\n", 5000, 16)) {
      expect(splitIntoSentences(text)).toEqual(legacySplit(text));
    }
  });

  it("stays linear on long input without terminators", () => {
    const text = "a".repeat(200_000);
    expect(splitIntoSentences(text)).toEqual([text]);
  });
});

describe("validateContact email check", () => {
  const contact = (email: string) => validateContact({ name: "Ada", email, message: "Hi" });

  it("matches the legacy regex", () => {
    for (const email of [...samples("a@. \t", 5000, 10), "a@b.c", "a@b", "@b.c", "a@.c", "a@b.", "a@@b.c", "a b@c.d"]) {
      expect(Boolean(contact(email))).toBe(email.trim().length > 0 && legacyEmail(email.trim()));
    }
  });
});
