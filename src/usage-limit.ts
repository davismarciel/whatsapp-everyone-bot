const CHAT_COOLDOWN_MS = 10_000;
const GLOBAL_COOLDOWN_MS = 10_000;
const HOURLY_WINDOW_MS = 60 * 60_000;
const MAX_PER_HOUR = 10;

export function createUsageLimit() {
  const lastByChat = new Map<string, number>();
  let lastGlobal = -Infinity;
  let acceptedAt: number[] = [];
  let busy = false;

  return {
    tryAcquire(chatId: string, now = Date.now()): boolean {
      if (busy) return false;

      acceptedAt = acceptedAt.filter((time) => now - time < HOURLY_WINDOW_MS);
      for (const [jid, time] of lastByChat) {
        if (now - time >= CHAT_COOLDOWN_MS) lastByChat.delete(jid);
      }

      if (acceptedAt.length >= MAX_PER_HOUR ||
          now - lastGlobal < GLOBAL_COOLDOWN_MS ||
          lastByChat.has(chatId)) return false;

      busy = true;
      lastGlobal = now;
      lastByChat.set(chatId, now);
      acceptedAt.push(now);
      return true;
    },
    release(): void {
      busy = false;
    },
  };
}
