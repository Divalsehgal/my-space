import { fetchWithRetry } from "./fetchWithRetry";

describe("fetchWithRetry", () => {
  const originalResponse = global.Response;

  beforeAll(() => {
    jest.useFakeTimers();
    // @ts-expect-error - mocking global Response
    global.Response = class Response {
      status: number;
      ok: boolean;
      constructor(_body: unknown, init?: { status?: number }) {
        this.status = init?.status || 200;
        this.ok = this.status >= 200 && this.status < 300;
      }
      async json() { return {}; }
    };
  });

  afterAll(() => {
    jest.useRealTimers();
    global.Response = originalResponse;
  });

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => { /* No-op */ });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves immediately on success", async () => {
    const mockOperation = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    
    const promise = fetchWithRetry(mockOperation);
    const result = await promise;
    
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect((result as Response).status).toBe(200);
  });

  it("retries on a 500 error and resolves if it eventually succeeds", async () => {
    const mockOperation = jest.fn()
      .mockResolvedValueOnce(new Response("error", { status: 500 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
      
    const promise = fetchWithRetry(mockOperation, { maxRetries: 3, baseDelay: 100 });
    
    // Fast-forward to skip delay
    await jest.advanceTimersByTimeAsync(1500); 
    
    const result = await promise;
    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect((result as Response).status).toBe(200);
  });

  it("returns the final failed response if out of retries", async () => {
    const mockOperation = jest.fn().mockResolvedValue(new Response("error", { status: 500 }));
      
    // Max retries = 1
    const promise = fetchWithRetry(mockOperation, { maxRetries: 1, baseDelay: 100 });
    await jest.advanceTimersByTimeAsync(1500); 
    
    const result = await promise;
    expect(mockOperation).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
    expect((result as Response).status).toBe(500);
  });

  it("retries on network error and resolves if it succeeds", async () => {
    const networkError = new Error("Network issue");
    (networkError as unknown as { code: string }).code = "ECONNRESET";
    
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
      
    const promise = fetchWithRetry(mockOperation, { maxRetries: 3, baseDelay: 100 });
    await jest.advanceTimersByTimeAsync(1500); 
    
    const result = await promise;
    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect((result as Response).status).toBe(200);
  });

  it("throws immediately if the error is not retryable", async () => {
    const normalError = new Error("Syntax error");
    const mockOperation = jest.fn().mockRejectedValue(normalError);
      
    await expect(fetchWithRetry(mockOperation)).rejects.toThrow("Syntax error");
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it("aborts when the signal is triggered before executing", async () => {
    const controller = new AbortController();
    controller.abort();
    
    const mockOperation = jest.fn();
    
    await expect(fetchWithRetry(mockOperation, { signal: controller.signal })).rejects.toThrow("Aborted");
    expect(mockOperation).not.toHaveBeenCalled();
  });

  it("aborts during a 500 error retry timeout", async () => {
    const controller = new AbortController();
    const mockOperation = jest.fn().mockResolvedValueOnce(new Response("error", { status: 500 }));
    
    const promise = fetchWithRetry(mockOperation, { baseDelay: 1000, signal: controller.signal });
    
    // Wait for the first call to finish and the timeout to start
    await Promise.resolve(); // flush microtasks
    
    // Abort while waiting
    controller.abort();
    
    await expect(promise).rejects.toThrow("Aborted");
  });

  it("aborts during a network error retry timeout", async () => {
    const controller = new AbortController();
    const networkError = new Error("Network issue");
    (networkError as unknown as { code: string }).code = "ECONNRESET";
    
    const mockOperation = jest.fn().mockRejectedValueOnce(networkError);
    
    const promise = fetchWithRetry(mockOperation, { baseDelay: 1000, signal: controller.signal });
    
    await Promise.resolve(); // flush microtasks
    
    controller.abort();
    
    await expect(promise).rejects.toThrow("Aborted");
  });
});
