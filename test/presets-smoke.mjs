// dsh-persona presets smoke: preset catalog integrity, first-run seeding, apply/switch, no reseed.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createPersonaStore, PRESETS, BLOCK_DEFS } from '../lib/store.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok', name); };

// 1 catalog integrity
t('catalog has >=5 presets', () => assert.ok(PRESETS.length >= 5));
t('preset ids unique', () => assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length));
t('every preset fills all blocks within limits', () => {
  for (const p of PRESETS) {
    for (const def of BLOCK_DEFS) {
      const content = String(p.blocks?.[def.id] ?? '');
      assert.ok(content.trim() !== '', `${p.id}.${def.id} is empty`);
      assert.ok(content.length <= def.charLimit, `${p.id}.${def.id} over limit (${content.length}/${def.charLimit})`);
    }
  }
});

// 2 first-run seeding
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-persona-preset-'));
const store = createPersonaStore(tmp);
t('fresh store is seeded with default preset (jarvis)', () => {
  assert.ok(store.getState().blocks.find((b) => b.id === 'identity').content.includes('贾维斯'));
});
t('seededAt recorded', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(tmp, 'persona.json'), 'utf8'));
  assert.ok(doc.seededAt);
});
t('seed writes history with preset origin', () => {
  const items = store.getHistory().items;
  assert.ok(items.length >= 5);
  assert.ok(items.every((i) => i.origin === 'preset'));
});
t('seeded prompt renders', () => {
  const prompt = store.renderPrompt();
  assert.ok(prompt.includes('## 身份认同'));
  assert.ok(prompt.includes('贾维斯'));
});

// 3 no double-seed on reload
const before = store.getHistory().items.length;
const store2 = createPersonaStore(tmp);
t('reload does not reseed', () => assert.equal(store2.getHistory().items.length, before));

// 4 user clears everything -> still no reseed (seededAt latched)
for (const b of store2.getState().blocks) store2.setBlock(b.id, '', 'ui');
const store3 = createPersonaStore(tmp);
t('cleared blocks stay empty after reload', () => {
  assert.ok(store3.getState().blocks.every((b) => b.content === ''));
});

// 5 switch preset via UI path
const r = store3.applyPreset('jarvis', 'ui');
t('applyPreset jarvis ok', () => assert.equal(r.ok, true));
t('blocks switched to jarvis', () => {
  assert.ok(store3.getState().blocks.find((b) => b.id === 'identity').content.includes('贾维斯'));
});
t('ui switch recorded in history', () => {
  const top = store3.getHistory().items[0];
  assert.equal(top.origin, 'ui');
  assert.ok(top.title.includes('模板：贾维斯式管家'));
});
t('unknown preset rejected', () => assert.ok(store3.applyPreset('nope', 'ui').error.includes('未知模板')));
t('jarvis prompt renders', () => assert.ok(store3.renderPrompt().includes('结论先行')));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${pass} preset assertions passed`);
