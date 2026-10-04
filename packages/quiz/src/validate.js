/**
 * The one definition of a valid quiz question, shared by the quiz editor's UI
 * (before calling the API) and its server (before writing to Contentful).
 * Plain JavaScript so the Node server can import it without a build step;
 * types live in validate.d.ts.
 */

/** Every question offers exactly this many options. */
export const OPTIONS_PER_QUESTION = 4;
/** …and exactly this many of them are correct. */
export const CORRECT_OPTIONS_PER_QUESTION = 1;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

/** Problems with one question (empty when it's valid). `number` is 1-based, for messages. */
export function validateQuestion(question, number) {
  const label = `Question ${number}`;
  const errors = [];
  if (!isNonEmptyString(question?.questionText)) {errors.push(`${label} needs questionText.`);}
  if (!isNonEmptyString(question?.explanation)) {errors.push(`${label} needs an explanation.`);}
  if (!Array.isArray(question?.options) || question.options.length !== OPTIONS_PER_QUESTION) {
    errors.push(`${label} must contain exactly ${OPTIONS_PER_QUESTION} options.`);
    return errors;
  }
  const texts = question.options.map((option) => (typeof option?.text === "string" ? option.text.trim().toLowerCase() : ""));
  if (texts.some((text) => !text)) {errors.push(`${label} has an empty option.`);}
  if (new Set(texts).size !== texts.length) {errors.push(`${label} has duplicate option text.`);}
  const correct = question.options.filter((option) => option?.isCorrect === true).length;
  if (correct !== CORRECT_OPTIONS_PER_QUESTION) {errors.push(`${label} must have exactly one correct option.`);}
  return errors;
}

/** Problems with a list of questions (empty when all are valid). */
export function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {return ["Add at least one question."];}
  return questions.flatMap((question, index) => validateQuestion(question, index + 1));
}

/**
 * Parses editor JSON (`{ "questions": [...] }`) and validates it.
 * Returns the payload, or throws with every problem listed.
 */
export function parseQuizPayload(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
    throw new Error('Payload must be an object with a top-level "questions" array.');
  }
  const errors = validateQuestions(parsed.questions);
  if (errors.length > 0) {throw new Error(errors.join("\n"));}
  return parsed;
}

const FIRST_OPTION_CODE = "A".codePointAt(0);

/** Letter for an option by position: 0 → "A", 1 → "B"… */
export function optionLetter(index) {
  return String.fromCodePoint(FIRST_OPTION_CODE + index);
}
