import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import type { Env } from "../types";
import { runSeed } from "../services/seeder";
import { describeError, json, methodNotAllowed } from "../utils/http";

const sha256 = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));

/** Constant-time compare (on digests, so lengths match) so response timing can't reveal the secret byte by byte. */
async function isAuthorizedSeedRequest(req: Request, env: Env): Promise<boolean> {
    if (!env.SEED_SECRET) {
        return false;
    }
    const [given, expected] = await Promise.all([sha256(req.headers.get('Authorization') ?? ''), sha256(`Bearer ${env.SEED_SECRET}`)]);
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
        diff |= given[i] ^ expected[i];
    }
    return diff === 0;
}

/** POST /api/seed (Bearer SEED_SECRET; `?force=1` re-embeds everything). Called by the site's revalidate webhook. */
export async function seed(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
        return methodNotAllowed(req);
    }

    if (!(await isAuthorizedSeedRequest(req, env))) {
        return json({ error: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED, {}, req);
    }

    try {
        const force = new URL(req.url).searchParams.get('force') === '1';
        const result = await runSeed(env, { force });
        return json({ success: true, ...result }, HTTP_STATUS.OK, {}, req);
    } catch (err: unknown) {
        const message = describeError(err);
        console.error('Seed error:', message);
        return json({ error: 'Seed failed', details: message }, HTTP_STATUS.INTERNAL_SERVER_ERROR, {}, req);
    }
}
