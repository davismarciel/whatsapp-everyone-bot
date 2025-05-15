import { LRUCache } from 'lru-cache';

export const processedMessageCache = new LRUCache<string, true>({
  max: 5000,
  ttlAutopurge: true,
});

export const commandCache = new LRUCache<string, string | true>({
  ttl: 0,
  max: 1000,
  ttlAutopurge: true,
});
