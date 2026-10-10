import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createUsageLimit } from '../src/usage-limit.ts';

test('limita concorrência, frequência por conversa e volume global', () => {
  const limit = createUsageLimit();
  assert.equal(limit.tryAcquire('a', 0), true);
  assert.equal(limit.tryAcquire('b', 1_000), false);
  limit.release();
  assert.equal(limit.tryAcquire('b', 10_000), true);
  limit.release();
  assert.equal(limit.tryAcquire('a', 20_000 - 1), false);
  assert.equal(limit.tryAcquire('a', 20_000), true);
  limit.release();

  for (let i = 3; i < 10; i++) {
    assert.equal(limit.tryAcquire(`chat-${i}`, i * 60_000), true);
    limit.release();
  }
  assert.equal(limit.tryAcquire('extra', 10 * 60_000), false);
  assert.equal(limit.tryAcquire('extra', 60 * 60_000), true);
});
