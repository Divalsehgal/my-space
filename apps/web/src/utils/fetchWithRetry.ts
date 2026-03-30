// src/utils/fetchWithRetry.ts

interface NetworkError extends Error {
    code?: string;
}

export async function fetchWithRetry<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    retryCount = 0,
    maxRetries = 3,
    initialRetryDelay = 1000, // 1s
    signal?: AbortSignal
): Promise<T> {
    if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
    }

    try {
        const res = await operation(signal);

        // For standard Response objects, check if they are OK
        if (res instanceof Response && !res.ok) {
            const status = res.status;

            // Decide when to retry (GitHub: 429/403/5xx)
            const shouldRetry =
                status === 429 ||
                status === 403 ||
                (status >= 500 && status < 600);

            if (shouldRetry && retryCount < maxRetries) {
                const delay =
                    initialRetryDelay * Math.pow(2, retryCount) +
                    Math.random() * 500; // jitter

                console.warn(
                    `Fetch failed (${status}). Retrying in ${Math.round(
                        delay / 1000
                    )}s... (attempt ${retryCount + 1}/${maxRetries})`
                );

                await new Promise((resolve, reject) => {
                    const timer = setTimeout(resolve, delay);
                    signal?.addEventListener("abort", () => {
                        clearTimeout(timer);
                        reject(new DOMException("Aborted", "AbortError"));
                    }, { once: true });
                });

                return fetchWithRetry(operation, retryCount + 1, maxRetries, initialRetryDelay, signal);
            }

            // If we’re here, it’s the final failure
            return res; // let caller inspect res.ok and throw a custom error
        }

        // Success
        return res;
    } catch (error: unknown) {
        const err = error as NetworkError;
        if (err.name === "AbortError") throw error;
 
        // Network-level errors (DNS, timeout, etc.)
        const retryable =
            err.code === "ECONNRESET" ||
            err.code === "ETIMEDOUT" ||
            err.code === "ADDRINFO" ||
            err.code === "EAI_AGAIN";
 
        if (retryable && retryCount < maxRetries) {
            const delay =
                initialRetryDelay * Math.pow(2, retryCount) +
                Math.random() * 500;

            console.warn(
                `Network error (${err.code}). Retrying in ${Math.round(
                    delay / 1000
                )}s... (attempt ${retryCount + 1}/${maxRetries})`
            );

            await new Promise((resolve, reject) => {
                const timer = setTimeout(resolve, delay);
                signal?.addEventListener("abort", () => {
                    clearTimeout(timer);
                    reject(new DOMException("Aborted", "AbortError"));
                }, { once: true });
            });

            return fetchWithRetry(operation, retryCount + 1, maxRetries, initialRetryDelay, signal);
        }

        // Non-retryable or out of retries → bubble up
        throw error;
    }
}
