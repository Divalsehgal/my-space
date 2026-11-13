/** @jest-environment node */
import worker from "./index";
import { runSeed } from "./seed";
import type { Env } from "./types";

jest.mock("./seed", () => ({ ...jest.requireActual("./seed"), runSeed: jest.fn() }));

describe("worker.scheduled", () => {
  it("logs reseed success and failure", async () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const pending: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p) };
    (runSeed as jest.Mock).mockResolvedValueOnce({ count: 1, upserted: 1, deleted: 0 }).mockRejectedValueOnce(new Error("down"));
    worker.scheduled({ cron: "0 * * * *", scheduledTime: 0 }, {} as Env, ctx);
    worker.scheduled({ cron: "0 * * * *", scheduledTime: 0 }, {} as Env, ctx);
    await Promise.all(pending);
    expect(info).toHaveBeenCalledWith(expect.stringContaining("Scheduled reseed complete"));
    expect(error).toHaveBeenCalledWith("Scheduled reseed failed:", expect.any(Error));
  });
});
