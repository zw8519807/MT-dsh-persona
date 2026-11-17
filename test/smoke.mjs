// dsh-persona storage smoke: exercise every store path in a temp dir.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createPersonaStore } from '../lib/store.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-persona-smoke-'));
// Pre-mark seededAt so the first-run preset seeding doesn't interfere with these
// storage-path tests (seeding itself is covered by presets-smoke.mjs).
fs.writeFileSync(
  path.join(tmp, 'persona.json'),
  JSON.stringify({ version: 1, blocks: {}, updatedAt: null, seededAt: '2026-01-01T00:00:00.000Z' }),
  'utf8',
);
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok', name); };

const store = createPersonaStore(tmp);

// 1 initial state
const s1 = store.getState();
t('five blocks exist', () => assert.equal(s1.blocks.length, 5));
t('all empty initially', () => assert.ok(s1.blocks.every((b) => b.content === '')));
t('renderPrompt empty when all empty', () => assert.equal(store.renderPrompt(), ''));

// 2 set + get + history
const IDENTITY = '我叫阿灵，一个爱较真的助手。\n第二行：带 emoji 🙂👍';
const r1 = store.setBlock('identity', IDENTITY);
t('setBlock ok', () => assert.equal(r1.ok, true));
t('state reflects content', () => assert.ok(store.getState().blocks.find((b) => b.id === 'identity').content.includes('阿灵')));
t('history has 1 entry', () => assert.equal(store.getHistory().items.length, 1));
t('history newest first', () => assert.equal(store.getHistory().items[0].blockId, 'identity'));

// 3 unchanged
t('unchanged detected', () => assert.ok(store.setBlock('identity', IDENTITY).unchanged));
t('unchanged not recorded', () => assert.equal(store.getHistory().items.length, 1));

// 4 over limit rejected
const styleDef = s1.blocks.find((b) => b.id === 'style');
t('over limit rejected', () => {
  const r = store.setBlock('style', 'x'.repeat(styleDef.charLimit + 1));
  assert.ok(r.error && r.error.includes('超出字数上限'));
});

// 5 unknown block rejected
t('unknown block rejected', () => assert.ok(store.setBlock('nope', 'x').error.includes('未知人格块')));

// 6 lone surrogate sanitized
t('lone surrogate sanitized', () => {
  const broken = '😀'.slice(0, 1); // unpaired high surrogate
  const r = store.setBlock('state', '心情：' + broken);
  assert.equal(r.ok, true);
  const saved = store.getState().blocks.find((b) => b.id === 'state').content;
  assert.ok(!/[\uD800-\uDFFF]/.test(saved), 'no surrogates in saved content');
});

// 7 renderPrompt includes non-empty, skips empty
const prompt = store.renderPrompt();
t('prompt has header', () => assert.ok(prompt.startsWith('# 人格')));
t('prompt includes identity', () => assert.ok(prompt.includes('## 身份认同')));
t('prompt skips empty style', () => assert.ok(!prompt.includes('## 表达风格')));
t('prompt includes state', () => assert.ok(prompt.includes('## 当前状态')));

// 8 persistence: fresh store instance over the same dir
const store2 = createPersonaStore(tmp);
t('reload keeps content', () => assert.ok(store2.getState().blocks.find((b) => b.id === 'identity').content.includes('阿灵')));
t('reload keeps history', () => assert.equal(store2.getHistory().items.length, 2));

// 9 multi-edit history + clip previews
store2.setBlock('user_profile', 'u'.repeat(500));
const h = store2.getHistory().items;
t('history ordering', () => assert.equal(h[0].blockId, 'user_profile'));
t('preview clipped', () => assert.ok(h[0].after.length <= 400));
t('history count', () => assert.equal(h.length, 3));

// 10 persona.json round-trip keeps emoji
t('persona.json parses', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(tmp, 'persona.json'), 'utf8'));
  assert.ok(doc.blocks.identity.content.includes('🙂'));
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${pass} storage assertions passed`);
