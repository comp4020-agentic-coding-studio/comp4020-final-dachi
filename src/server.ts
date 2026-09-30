import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { addMark, listMarks } from "./db.ts";
import { validateMark } from "./marks.ts";
import { renderReadme } from "./readme.ts";

const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_DIR = new URL("../public/", import.meta.url);

// A hand-rolled cap, not framework config, but the same lesson: a 256MB
// machine has no defence against a body an order of magnitude past what the
// form itself ever sends (a note plus a color is well under 1KB).
const MAX_BODY_BYTES = 8 * 1024;

// A hand is only ever an identity token, never content — but the cookie it
// rides in is exactly as client-controlled as any body field, and unlike the
// note it had no cap at all: a request that isn't the form could set a
// multi-kilobyte "hand" that then sits in the append-only store forever,
// once per request, with no edit or delete path to ever remove it. The only
// shape a hand should ever take is the one this server itself mints below.
const HAND_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidHand(value: string | undefined): value is string {
  return typeof value === "string" && HAND_PATTERN.test(value);
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!key) continue;
    // A cookie header is client-supplied input like any other: malformed
    // percent-encoding must degrade to "no hand", not throw and 500 the
    // whole request.
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      continue;
    }
  }
  return out;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let rejected = false;
    // Reject on an oversized body, but don't destroy the socket here: that
    // would drop the connection before the 413 response below ever reaches
    // the client. The caller destroys it, after writing that response.
    req.on("data", (chunk: Buffer) => {
      if (rejected) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        rejected = true;
        reject(new Error("body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!rejected) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

async function serveStatic(res: ServerResponse, filename: string, contentType: string) {
  const data = await readFile(new URL(filename, PUBLIC_DIR));
  res.writeHead(200, { "content-type": `${contentType}; charset=utf-8` });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/") {
      await serveStatic(res, "index.html", "text/html");
      return;
    }
    if (req.method === "GET" && url.pathname === "/app.js") {
      await serveStatic(res, "app.js", "text/javascript");
      return;
    }
    if (req.method === "GET" && url.pathname === "/style.css") {
      await serveStatic(res, "style.css", "text/css");
      return;
    }
    if (req.method === "GET" && (url.pathname === "/readme" || url.pathname === "/readme/")) {
      const html = await renderReadme();
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/marks") {
      const cookies = parseCookies(req.headers.cookie);
      const you = isValidHand(cookies.hand) ? cookies.hand : null;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ marks: listMarks(), you }));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/marks") {
      const cookies = parseCookies(req.headers.cookie);
      let hand = isValidHand(cookies.hand) ? cookies.hand : undefined;
      const headers: Record<string, string> = {};
      if (!hand) {
        hand = randomUUID();
        const fiveYears = 60 * 60 * 24 * 365 * 5;
        headers["set-cookie"] = `hand=${hand}; Path=/; Max-Age=${fiveYears}; SameSite=Lax`;
      }

      let body: string;
      try {
        body = await readBody(req);
      } catch {
        res.writeHead(413, { ...headers, connection: "close" });
        res.end();
        req.destroy();
        return;
      }

      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { ...headers, "content-type": "application/json" });
        res.end(JSON.stringify({ error: "bad-json" }));
        return;
      }
      if (typeof payload !== "object" || payload === null) {
        res.writeHead(400, { ...headers, "content-type": "application/json" });
        res.end(JSON.stringify({ error: "bad-json" }));
        return;
      }

      const validated = validateMark(payload as Record<string, unknown>);
      if (!validated.ok) {
        res.writeHead(422, { ...headers, "content-type": "application/json" });
        res.end(JSON.stringify({ error: validated.reason }));
        return;
      }

      const mark = addMark(hand, validated.note, validated.color);
      res.writeHead(201, { ...headers, "content-type": "application/json" });
      res.end(JSON.stringify({ mark }));
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain" });
    }
    res.end("internal error");
  }
});

// Astro's own Content-Type-mismatch behaviour (checked on crit 7) is what
// this mirrors: an unexpected request shouldn't take the process down, just
// answer badly and keep serving the next one — every route above is already
// wrapped by the try/catch, this is the last resort.
server.on("clientError", (_err, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`long scroll listening on 0.0.0.0:${PORT}`);
});
