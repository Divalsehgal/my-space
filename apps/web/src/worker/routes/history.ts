import { HTTP_STATUS } from "@dival-sehgal/utils/http";
import type { Env } from "../types";
import { getSession, readSessionId, sessionCookie } from "../services/storage";
import { json } from "../utils/http";

/** GET /api/history returns the visible turns; DELETE /api/history forgets the session. */
export async function history(req: Request, env: Env): Promise<Response> {
    const sid = readSessionId(req);
    if (req.method === 'DELETE') {
        if (sid) {
            await env.CHAT_SESSIONS.delete(sid);
        }
        return json({ success: true }, HTTP_STATUS.OK, sid ? { 'Set-Cookie': sessionCookie(req, '', 0) } : {}, req);
    }
    const sess = await getSession(env, sid);
    // Only what the widget renders: no timestamps, ids or contact counters.
    const messages = (sess?.messages ?? []).map(({ role, content, sources }) => ({ role, content, ...(sources ? { sources } : {}) }));
    return json({ messages }, HTTP_STATUS.OK, { 'Cache-Control': 'no-store' }, req);
}
