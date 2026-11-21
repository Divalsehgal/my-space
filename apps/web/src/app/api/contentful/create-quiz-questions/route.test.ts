/** @jest-environment node */
import { signRequest } from "@contentful/node-apps-toolkit";
import { OPTIONS, POST } from "./route";
import { contentfulRequest, importQuestions } from "@/lib/contentful/quiz-import";

jest.mock("@/lib/contentful/quiz-import", () => ({
  ...jest.requireActual("@/lib/contentful/quiz-import"),
  getManagementConfig: () => ({ spaceId: "s", accessToken: "t", environmentId: "master" }),
  contentfulRequest: jest.fn(),
  importQuestions: jest.fn(),
}));

const SECRET = "a".repeat(64);
const ROUTE_URL = "https://site.test/api/contentful/create-quiz-questions";
const question = {
  questionText: "Q?",
  explanation: "E",
  options: [
    { text: "a", isCorrect: true },
    { text: "b", isCorrect: false },
    { text: "c", isCorrect: false },
    { text: "d", isCorrect: false },
  ],
};

const signedRequest = (body: string, secret = SECRET) => {
  const headers = { "content-type": "application/json" };
  const signature = signRequest(secret, { method: "POST", path: new URL(ROUTE_URL).pathname, headers, body }, Date.now());
  return new Request(ROUTE_URL, { method: "POST", headers: { ...headers, ...signature }, body });
};

describe("POST /api/contentful/create-quiz-questions", () => {
  beforeEach(() => {
    process.env.CONTENTFUL_APP_SIGNING_SECRET = SECRET;
    jest.clearAllMocks();
  });

  it("rejects unsigned, wrongly signed, or tampered requests before touching Contentful", async () => {
    const body = JSON.stringify({ quizId: "quiz-1", questions: [question] });
    const unsigned = await POST(new Request(ROUTE_URL, { method: "POST", body }));
    const wrongSecret = await POST(signedRequest(body, "b".repeat(64)));
    const signed = signedRequest(body);
    const tampered = await POST(new Request(ROUTE_URL, { method: "POST", headers: signed.headers, body: body.replace("quiz-1", "quiz-2") }));
    expect([unsigned.status, wrongSecret.status, tampered.status]).toEqual([403, 403, 403]);
    expect(contentfulRequest).not.toHaveBeenCalled();
  });

  it("fails closed when no signing secret is configured", async () => {
    const body = JSON.stringify({ quizId: "quiz-1", questions: [question] });
    const req = signedRequest(body);
    delete process.env.CONTENTFUL_APP_SIGNING_SECRET;
    expect((await POST(req)).status).toBe(403);
  });

  it("imports the questions for a signed request", async () => {
    (contentfulRequest as jest.Mock).mockResolvedValue({
      sys: { id: "quiz-1", version: 1, contentType: { sys: { id: "quizComponent" } } },
      fields: { title: { "en-US": "Quiz" } },
    });
    (importQuestions as jest.Mock).mockResolvedValue({ createdQuestionIds: ["q1"], failure: null, quizPublishError: null });
    const res = await POST(signedRequest(JSON.stringify({ quizId: "quiz-1", questions: [question], publish: false })));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(await res.json()).toMatchObject({ success: true, createdQuestionIds: ["q1"], published: false });
    expect(importQuestions).toHaveBeenCalledWith(expect.objectContaining({ locale: "en-US", publish: false }));
  });

  it("validates the body of a signed request", async () => {
    const missingId = await POST(signedRequest(JSON.stringify({ questions: [question] })));
    const badQuestions = await POST(signedRequest(JSON.stringify({ quizId: "quiz-1", questions: [{}] })));
    expect([missingId.status, badQuestions.status]).toEqual([400, 400]);
    (contentfulRequest as jest.Mock).mockResolvedValue({ sys: { id: "x", version: 1, contentType: { sys: { id: "blogPage" } } } });
    expect((await POST(signedRequest(JSON.stringify({ quizId: "x", questions: [question] })))).status).toBe(400);
  });

  it("answers the CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
