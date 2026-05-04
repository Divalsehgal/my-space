interface RetryOptions {
    attempt?: number;
    maxRetries?: number;
    baseDelay?: number;
    signal?: AbortSignal;
}

const wait = (ms: number, signal?: AbortSignal) =>
    new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("Aborted"));
        }, { once: true });
    });

function shouldRetryResponse(response: unknown): boolean {
    return response instanceof Response && 
        (response.status === 429 || (response.status >= 500 && response.status < 600));
}

function isRetryableError(error: unknown): boolean {
    const retryableErrors = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"];
    const errorCode = (error as { code?: string })?.code;
    return Boolean(errorCode && retryableErrors.includes(errorCode));
}

export async function fetchWithRetry<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { attempt = 0, maxRetries = 3, baseDelay = 1000, signal } = options;

    if (signal?.aborted) {
        throw new Error("Aborted");
    }

    try {
        const response = await operation(signal);

        if (shouldRetryResponse(response) && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Status ${(response as Response).status}. Retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
            await wait(delay, signal);
            return fetchWithRetry(operation, { ...options, attempt: attempt + 1 });
        }

        return response;
    } catch (error: unknown) {
        if (attempt < maxRetries && isRetryableError(error)) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Network error. Retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
            await wait(delay, signal);
            return fetchWithRetry(operation, { ...options, attempt: attempt + 1 });
        }

        throw error;
    }
}
