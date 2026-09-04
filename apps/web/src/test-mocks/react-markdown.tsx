// Jest test stub for the ESM-only `react-markdown` package (see jest.config.mjs
// moduleNameMapper). Renders children as plain text so component tests can
// assert on message content without pulling in the real remark/unified chain.
export default function ReactMarkdownStub({ children }: { children: string }) {
  return <>{children}</>;
}
