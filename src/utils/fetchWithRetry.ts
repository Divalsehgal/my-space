// src/utils/fetchWithRetry.ts

export async function fetchWithRetry(
    operation: () => Promise<Response>,
    retryCount = 0,
    maxRetries = 3,
    initialRetryDelay = 1000 // 1s
): Promise<Response> {
    try {
        const res = await operation();

        if (!res.ok) {
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

                await new Promise((resolve) => setTimeout(resolve, delay));

                return fetchWithRetry(operation, retryCount + 1, maxRetries, initialRetryDelay);
            }

            // If we’re here, it’s the final failure
            return res; // let caller inspect res.ok and throw a custom error
        }

        // Success
        return res;
    } catch (error: any) {
        // Network-level errors (DNS, timeout, etc.)
        const retryable =
            error?.code === "ECONNRESET" ||
            error?.code === "ENOTFOUND" ||
            error?.code === "ETIMEDOUT";

        if (retryable && retryCount < maxRetries) {
            const delay =
                initialRetryDelay * Math.pow(2, retryCount) +
                Math.random() * 500;

            console.warn(
                `Network error (${error.code}). Retrying in ${Math.round(
                    delay / 1000
                )}s... (attempt ${retryCount + 1}/${maxRetries})`
            );

            await new Promise((resolve) => setTimeout(resolve, delay));

            return fetchWithRetry(operation, retryCount + 1, maxRetries, initialRetryDelay);
        }

        // Non-retryable or out of retries → bubble up
        throw error;
    }
}
