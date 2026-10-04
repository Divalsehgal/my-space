import stylelint from "stylelint";

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = "dival/max-lines";

const messages = ruleMessages(ruleName, {
  expected: (lines, max) =>
    `Stylesheet has ${lines} code lines (max ${max}). Split it: give each sub-component its own stylesheet, or move repeated rules into a mixin.`,
});

/** Lines that hold code: no blank lines, `//` comments or `/* … *\/` blocks — same counting as ESLint's max-lines. */
export function countCodeLines(source) {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutBlocks.split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed !== "" && !trimmed.startsWith("//");
  }).length;
}

const rule = (max) => (root, result) => {
  const valid = validateOptions(result, ruleName, {
    actual: max,
    possible: [(value) => Number.isInteger(value) && value > 0],
  });
  if (!valid) {return;}
  const lines = countCodeLines(root.source?.input.css ?? "");
  if (lines > max) {
    report({ ruleName, result, node: root, message: messages.expected(lines, max) });
  }
};

rule.ruleName = ruleName;
rule.messages = messages;

export default createPlugin(ruleName, rule);
