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

/**
 * Utility for executing a fetch operation with a retry mechanism.
 * The operation receives an AbortSignal that merges the user-provided signal
 * with the retry timeout signal.
 */
export async function fetchWithRetry<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { attempt = 0, maxRetries = 3, baseDelay = 1000, signal } = options;

    if (signal?.aborted) {
        throw new Error("Aborted");
    }

    try {
        // Create a controller for this specific attempt if we want to add a timeout
        // But for now we just pass the main signal
        const response = await operation(signal);

        const shouldRetry = response instanceof Response && 
            (response.status === 429 || (response.status >= 500 && response.status < 600));

        if (shouldRetry && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Status ${(response as Response).status}. Retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
            await wait(delay, signal);
            return fetchWithRetry(operation, { ...options, attempt: attempt + 1 });
        }

        return response;
    } catch (error: unknown) {
        const retryableErrors = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"];
        const errorCode = (error as { code?: string })?.code;

        if (attempt < maxRetries && errorCode && retryableErrors.includes(errorCode)) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Network error (${errorCode}). Retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
            await wait(delay, signal);
            return fetchWithRetry(operation, { ...options, attempt: attempt + 1 });
        }

        throw error;
    }
}
