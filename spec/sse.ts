// A minimal server-sent-events reader over Node's fetch, for tests that need
// to watch /api/marks/stream the way an open tab does.
export interface SseEvent {
  id?: string;
  event: string;
  data: string;
  raw: string;
}

export interface SseStream {
  status: number;
  next(timeoutMs?: number): Promise<SseEvent>;
  close(): void;
}

export async function openStream(url: URL, headers: Record<string, string> = {}): Promise<SseStream> {
  const controller = new AbortController();
  // An open tab should see the stream open at once, not at the first event.
  const opened = setTimeout(() => controller.abort(), 1000);
  const res = await fetch(url, { headers, signal: controller.signal }).finally(() =>
    clearTimeout(opened),
  );
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  const queue: SseEvent[] = [];
  let buffer = "";

  async function fill(deadline: number) {
    while (queue.length === 0) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error("no event arrived in time");
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("no event arrived in time")), remaining);
      });
      const { value, done } = await Promise.race([reader.read(), timeout]).finally(() =>
        clearTimeout(timer),
      );
      if (done) throw new Error("the stream ended");
      buffer += value;
      let end;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const event: SseEvent = { event: "message", data: "", raw };
        for (const line of raw.split("\n")) {
          if (line.startsWith(":")) continue;
          const colon = line.indexOf(":");
          const field = line.slice(0, colon);
          const value = line.slice(colon + 1).replace(/^ /, "");
          if (field === "id") event.id = value;
          else if (field === "event") event.event = value;
          else if (field === "data") event.data += value;
        }
        if (event.data) queue.push(event);
      }
    }
  }

  return {
    status: res.status,
    async next(timeoutMs = 1000) {
      await fill(Date.now() + timeoutMs);
      return queue.shift()!;
    },
    close() {
      controller.abort();
    },
  };
}
