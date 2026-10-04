const isSentenceEnd = (char: string) => char === '.' || char === '!' || char === '?';
const isWhitespace = (char: string) => /\s/.test(char);

// A sentence is text, then terminal punctuation followed by whitespace or the
// end; trailing text without punctuation is the last sentence. A linear scan
// (rather than a backtracking regex) with the same output as
// /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g.
export function splitIntoSentences(text: string): string[] {
    const sentences: string[] = [];
    let start = 0;
    while (start < text.length) {
        let punctStart = start;
        while (punctStart < text.length && !isSentenceEnd(text[punctStart])) {
            punctStart++;
        }
        if (punctStart === text.length) {
            sentences.push(text.slice(start));
            break;
        }
        let punctEnd = punctStart;
        while (punctEnd < text.length && isSentenceEnd(text[punctEnd])) {
            punctEnd++;
        }
        if (punctStart > start && (punctEnd === text.length || isWhitespace(text[punctEnd]))) {
            let end = punctEnd;
            while (end < text.length && isWhitespace(text[end])) {
                end++;
            }
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
