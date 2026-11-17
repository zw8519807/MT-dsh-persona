// dsh-persona host smoke: exercise apply() wiring with a stub ctx — RPC endpoints +
// system-prompt/assemble handler. Data root is redirected to a temp dir so the real
// persona store is never touched.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';

process.env.DSH_PERSONA_DATA_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-persona-hostsmoke-'));
const { apply } = await import('../lib/index.js');

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok', name); };

const rpcHandlers = {};
const listeners = {};
const ctx = {
  inject(deps, cb) {
    assert.deepEqual(deps, ['connection', 'webServer']);
    const connection = { rpc: { handle: (ch, fn) => { rpcHandlers[ch] = fn; } } };
    const webContext = { get: () => ({}), extend: () => ({ connection }), connection };
    cb(webContext);
  },
  on(event, handler) { listeners[event] = handler; },
};

apply(ctx);

t('rpc channel registered', () => assert.equal(typeof rpcHandlers['/dsh-persona'], 'function'));
t('assemble listener registered', () => assert.equal(typeof listeners['system-prompt/assemble'], 'function'));

const call = (endpoint, payload) => rpcHandlers['/dsh-persona'](endpoint, payload);

// read-only endpoints against the real install dir
const stateRes = await call('state');
t('state endpoint ok', () => { assert.equal(stateRes.ok, true); assert.equal(stateRes.value.blocks.length, 5); });
const histRes = await call('history', {});
t('history endpoint ok', () => assert.equal(histRes.ok, true));
const presetsRes = await call('presets', {});
t('presets endpoint ok', () => { assert.equal(presetsRes.ok, true); assert.ok(presetsRes.value.presets.length >= 5); });

// error paths (no data change)
const bad = await call('set-block', { blockId: 'nope', content: 'x' });
t('unknown block via rpc fails clean', () => { assert.equal(bad.ok, false); assert.ok(bad.error.message.includes('未知人格块')); });
const badPreset = await call('apply-preset', { presetId: 'nope' });
t('unknown preset via rpc fails clean', () => { assert.equal(badPreset.ok, false); assert.ok(badPreset.error.message.includes('未知模板')); });

// prompt injection reflects the live store (first-run seed expected on a fresh install)
const assembly = { contexts: [] };
const nextR = await listeners['system-prompt/assemble'](assembly, {}, () => Promise.resolve('next'));
t('next() forwarded', () => assert.equal(nextR, 'next'));
t('persona context present with seeded content', () => {
  const entry = assembly.contexts.find((c) => c.name === 'persona');
  assert.ok(entry, 'persona context should exist after first-run seeding');
  assert.ok(entry.text.includes('## 身份认同'));
});

console.log(`\n${pass} host assertions passed`);
