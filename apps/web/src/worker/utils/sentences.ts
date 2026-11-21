const isSentenceEnd = (char: string) => char === '.' || char === '!' || char === '?';
const isWhitespace = (char: string) => /\s/.test(char);

// A sentence is text, then terminal punctuation followed by whitespace or the
// end; trailing text without punctuation is the last sentence. A linear scan
// (rather than a backtracking regex) with the same output as
// /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g.
/** Index of the first char at or after `from` that fails `test` (or text.length). */
function skipWhile(text: string, from: number, test: (char: string) => boolean): number {
    let i = from;
    while (i < text.length && test(text[i])) {
        i++;
    }
    return i;
}

/** True when the punctuation run ending at `punctEnd` closes a sentence. */
function endsSentence(text: string, start: number, punctStart: number, punctEnd: number): boolean {
    return punctStart > start && (punctEnd === text.length || isWhitespace(text[punctEnd]));
}

export function splitIntoSentences(text: string): string[] {
    const sentences: string[] = [];
    let start = 0;
    while (start < text.length) {
        const punctStart = skipWhile(text, start, (char) => !isSentenceEnd(char));
        if (punctStart === text.length) {
            sentences.push(text.slice(start));
            break;
        }
        const punctEnd = skipWhile(text, punctStart, isSentenceEnd);
        if (endsSentence(text, start, punctStart, punctEnd)) {
            const end = skipWhile(text, punctEnd, isWhitespace);
            sentences.push(text.slice(start, end));
            start = end;
        } else {
            // Punctuation inside a word (e.g. "1.5"): the regex never matched
            // across it, so skip to the text after it.
            start = punctEnd;
        }
    }
    return sentences.length ? sentences.map((s) => s.trim()).filter(Boolean) : [text];
}
