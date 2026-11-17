// dsh-persona host half (M1): five persona blocks + system prompt injection + client RPC.
// M2 will add agent-side tools (persona_read / persona_update / persona_review).
// Note: no Config export for M1 — @deepseek-ai/schemastery only resolves for bundles
// physically installed in the profile node_modules, not for workspace junctions.
// Data dir: set DSH_PERSONA_DATA_ROOT to override the default (~/.dsh/dsh-persona).
import os from 'node:os';
import path from 'node:path';
const DATA_ROOT = process.env.DSH_PERSONA_DATA_ROOT || path.join(os.homedir(), '.dsh', 'dsh-persona');

import { createPersonaStore } from './store.js';

export const inject = ['clientModules'];

export function apply(ctx) {
  const store = createPersonaStore(DATA_ROOT);

  // ---- client RPC: /dsh-persona endpoints: state | history | set-block ----
  ctx.inject?.(['connection', 'webServer'], (webContext) => {
    try {
      const connection = (webContext?.extend && webContext?.get && webContext.get('webServer') !== undefined)
        ? webContext.extend({ webServer: webContext.get('webServer') }).connection
        : webContext?.connection;
      connection?.rpc?.handle?.('/dsh-persona', async (endpoint, payload) => {
        try {
          if (endpoint === 'state') return { ok: true, value: store.getState() };
          if (endpoint === 'history') return { ok: true, value: store.getHistory(Number(payload?.limit) || 100) };
          if (endpoint === 'presets') return { ok: true, value: { presets: store.listPresets() } };
          if (endpoint === 'apply-preset') {
            const r = store.applyPreset(String(payload?.presetId || ''), 'ui');
            if (r.error) return { ok: false, error: { message: r.error } };
            return { ok: true, value: r };
          }
          if (endpoint === 'set-block') {
            const r = store.setBlock(String(payload?.blockId || ''), String(payload?.content ?? ''), 'ui');
            if (r.error) return { ok: false, error: { message: r.error } };
            return { ok: true, value: r };
          }
          return { ok: false, error: { message: 'unknown endpoint: ' + endpoint } };
        } catch (e) {
          return { ok: false, error: { message: String(e?.message || e) } };
        }
      });
    } catch (e) {
      console.error('[dsh-persona] rpc handle failed:', e?.message || e);
    }
  });

  // ---- system prompt injection: render non-empty blocks into every session prompt ----
  ctx.on?.('system-prompt/assemble', async (assembly, sctx, next) => {
    try {
      const text = store.renderPrompt();
      if (text) assembly?.contexts?.push?.({ name: 'persona', text });
    } catch (e) {
      console.error('[dsh-persona] prompt inject failed:', e?.message || e);
    }
    return next();
  });
}
