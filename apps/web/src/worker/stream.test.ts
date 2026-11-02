/** @jest-environment node */
import { pipeGuarded, readTokens, staticStream, visibleLength } from "./stream";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function body(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
}

async function* tokens(list: string[]) {
  yield* list;
}

function collect() {
  const events: unknown[] = [];
  const write = (chunk: Uint8Array) => {
    const line = decoder.decode(chunk).replace(/^data: /, "").trim();
    events.push(line === "[DONE]" ? line : JSON.parse(line));
  };
  return { events, write };
}

describe("readTokens", () => {
  it("reads OpenAI-style deltas and legacy responses across split chunks", async () => {
    const stream = body([
      'data: {"choices":[{"delta":{"content":"He"}}],"response":"He"}\n\ndata: {"choi',
      'ces":[{"delta":{"content":"llo"}}]}\n\n',
      'data: {"response":"!"}\n\ndata: [DONE]\n\n',
    ]);
    const out: string[] = [];
    for await (const token of readTokens(stream)) {
      out.push(token);
    }
    expect(out).toEqual(["He", "llo", "!"]);
  });
});

describe("visibleLength", () => {
  it("holds back full and partial contact markers but not markdown links", () => {
    expect(visibleLength("Sure [SUBMIT_CONTACT: {}]")).toBe(5);
    expect(visibleLength("Sure [SUBM")).toBe(5);
    expect(visibleLength("See [Post](/blogs/post)")).toBe(23);
  });
});

describe("pipeGuarded", () => {
  it("forwards text as it arrives and never shows the contact token", async () => {
    const { events, write } = collect();
    const result = await pipeGuarded(tokens(["Sending ", "now. [", "SUBMIT_CONTACT: ", '{"a":1}]']), write, "leak");
    expect(events).toEqual([{ response: "Sending " }, { response: "now. " }]);
    expect(result).toMatchObject({ shown: "Sending now. ", leaked: false });
    expect(result.raw).toContain("SUBMIT_CONTACT");
  });

  it("replaces the reply and stops as soon as a leak pattern appears", async () => {
    const { events, write } = collect();
    const result = await pipeGuarded(tokens(["Here are my ", "VERIFIED REFERENCE FACTS", " ..."]), write, "nope");
    expect(events).toEqual([{ response: "Here are my " }, { replace: "nope" }]);
    expect(result.leaked).toBe(true);
  });
});

describe("staticStream", () => {
  it("emits one response event, optional sources, then DONE", () => {
    expect(staticStream("Hi", [{ title: "T", url: "/u" }])).toBe(
      'data: {"response":"Hi"}\n\ndata: {"sources":[{"title":"T","url":"/u"}]}\n\ndata: [DONE]\n\n',
    );
  });
});
