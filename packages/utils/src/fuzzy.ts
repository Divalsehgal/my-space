/**
 * Ranks `text` against `query`: substring matches score highest (earlier is
 * better), otherwise an in-order subsequence with a bonus for word starts.
 * Returns null for no match and 0 for an empty query.
 */
/** A matched character at the start of a word counts this much (others count 1). */
const WORD_START_SCORE = 3;

export function fuzzyScore(query: string, text: string): number | null {
  if (!query) {return 0;}
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  if (haystack.includes(needle)) {return 100 - haystack.indexOf(needle);}
  let position = 0;
  let total = 0;
  for (const char of needle) {
    const found = haystack.indexOf(char, position);
    if (found === -1) {return null;}
    total += found === 0 || haystack[found - 1] === " " ? WORD_START_SCORE : 1;
    position = found + 1;
  }
  return total;
}
