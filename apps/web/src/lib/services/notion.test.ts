type NotionModule = typeof import("./notion");

const ENV = { ...process.env };

function load(env: Record<string, string | undefined>): NotionModule {
  process.env = { ...ENV, ...env };
  let mod!: NotionModule;
  jest.isolateModules(() => {
    mod = jest.requireActual("./notion");
  });
  return mod;
}

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response;
const submission = { name: "Ann", email: "ann@example.com", message: "Hello" };

describe("createContactSubmission", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = ENV;
  });

  it("throws when the API key is missing", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: undefined, NOTION_CONTACT_DB_ID: "db" });
    await expect(createContactSubmission(submission)).rejects.toThrow("NOTION_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the database id is missing", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: "key", NOTION_CONTACT_DB_ID: "" });
    await expect(createContactSubmission(submission)).rejects.toThrow("NOTION_CONTACT_DB_ID");
  });

  it("maps fields onto the detected properties and creates a page", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: "key", NOTION_CONTACT_DB_ID: "db" });
    fetchMock
      .mockResolvedValueOnce(
        ok({
          properties: {
            Name: { type: "title" },
            Email: { type: "email" },
            Notes: { type: "rich_text" },
            Message: { type: "rich_text" },
          },
        }),
      )
      .mockResolvedValueOnce(ok({ id: "page" }));

    await createContactSubmission(submission);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.notion.com/v1/databases/db",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Authorization: "Bearer key", "Notion-Version": "2022-06-28" }),
      }),
    );
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://api.notion.com/v1/pages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      parent: { database_id: "db" },
      properties: {
        Name: { title: [{ text: { content: "Ann" } }] },
        Email: { email: "ann@example.com" },
        Message: { rich_text: [{ text: { content: "Hello" } }] },
      },
    });
  });

  it("falls back to any rich_text property and skips missing email", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: "key", NOTION_CONTACT_DB_ID: "db" });
    fetchMock
      .mockResolvedValueOnce(ok({ properties: { Title: { type: "title" }, Body: { type: "rich_text" } } }))
      .mockResolvedValueOnce(ok({}));
    await createContactSubmission(submission);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).properties).toEqual({
      Title: { title: [{ text: { content: "Ann" } }] },
      Body: { rich_text: [{ text: { content: "Hello" } }] },
    });
  });

  it("sends only the title when no email or text properties exist", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: "key", NOTION_CONTACT_DB_ID: "db" });
    fetchMock.mockResolvedValueOnce(ok({ properties: { Title: { type: "title" } } })).mockResolvedValueOnce(ok({}));
    await createContactSubmission(submission);
    expect(Object.keys(JSON.parse(fetchMock.mock.calls[1][1].body).properties)).toEqual(["Title"]);
  });

  it("throws when the database has no title property", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: "key", NOTION_CONTACT_DB_ID: "db" });
    fetchMock.mockResolvedValueOnce(ok({ properties: { Email: { type: "email" } } }));
    await expect(createContactSubmission(submission)).rejects.toThrow("No 'title' property");
  });

  it("surfaces Notion API errors, with or without a JSON body", async () => {
    const { createContactSubmission } = load({ NOTION_API_KEY: "key", NOTION_CONTACT_DB_ID: "db" });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: "unauthorized" }) });
    await expect(createContactSubmission(submission)).rejects.toThrow('Notion API Error: 401 - {"message":"unauthorized"}');

    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error("not json"); } });
    await expect(createContactSubmission(submission)).rejects.toThrow("Unknown error");
  });
});
