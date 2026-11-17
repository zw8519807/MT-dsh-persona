// dsh-persona client half: sidebar "人格" panel (five persona blocks + change history).
// Pattern proven by dsh-gspace client.js (installed & verified).
window.__ModuleLoader__.load({
  id: 'dsh-persona',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useCallback, useRef } = React;

    const CHANNEL = '/dsh-persona';
    const PANEL_ID = 'dsh-persona';

    function Icon({ size = 16 }) {
      return h('svg', { viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': true },
        h('rect', { x: 2, y: 2, width: 60, height: 60, rx: 14, fill: '#3B5BDB' }),
        h('path', { d: 'M20 44c0-12 5-22 12-22s12 10 12 22c0 4-5 6-12 6s-12-2-12-6z', fill: '#FFFFFF', opacity: 0.92 }),
        h('circle', { cx: 27, cy: 31, r: 2.2, fill: '#3B5BDB' }),
        h('circle', { cx: 37, cy: 31, r: 2.2, fill: '#3B5BDB' }),
        h('path', { d: 'M28 38c2 1.6 6 1.6 8 0', stroke: '#3B5BDB', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }),
        h('path', { d: 'M47 11c-6.5 1-10 5-10 10.5 0 0 4.5 1.2 7.5-1S48.5 14.5 47 11z', fill: '#69DB7C' }),
        h('path', { d: 'M47 11c.5 5-.5 9.5-2.5 13', stroke: '#69DB7C', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }),
      );
    }

    const css = `
.per-root{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);font-size:13px;overflow:hidden}
.per-head{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.18))}
.per-head-title{font-size:15px;font-weight:700;line-height:1.2}
.per-head-sub{font-size:11px;font-weight:400;opacity:.6;margin-top:2px}
.per-pill{display:inline-flex;align-items:center;gap:5px;margin-left:auto;font-size:11px;opacity:.7;border:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.25));border-radius:999px;padding:2px 9px}
.per-pill .led{width:6px;height:6px;border-radius:50%;background:#adb5bd}
.per-pill[data-on] .led{background:#2f9e44}
.per-pill[data-on]{opacity:1;color:#2f9e44}
.per-btn{border:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.3));background:transparent;color:inherit;border-radius:var(--dsw-radius-md,8px);padding:4px 12px;font-size:12px;cursor:pointer}
.per-btn:hover{border-color:var(--dsw-alias-state-business-primary,#3B5BDB);color:var(--dsw-alias-state-business-primary,#3B5BDB)}
.per-btn[data-primary]{background:var(--dsw-alias-state-business-primary,#3B5BDB);border-color:transparent;color:#fff}
.per-btn[data-primary]:disabled{opacity:.45;cursor:not-allowed}
.per-main{flex:1;display:flex;min-height:0}
.per-nav{width:148px;flex:none;display:flex;flex-direction:column;gap:2px;padding:10px 8px;border-right:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.14));overflow-y:auto}
.per-nav button{display:flex;align-items:center;justify-content:space-between;gap:6px;text-align:left;border:0;background:transparent;color:inherit;font-size:12.5px;padding:7px 10px;border-radius:var(--dsw-radius-md,8px);cursor:pointer;opacity:.75}
.per-nav button:hover{opacity:1;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.08))}
.per-nav button[data-active]{opacity:1;background:var(--dsw-alias-state-business-primary,#3B5BDB);color:#fff}
.per-nav .cnt{font-size:10.5px;opacity:.65}
.per-body{flex:1;min-width:0;display:flex;flex-direction:column;padding:14px 16px;overflow-y:auto}
.per-editor{display:flex;flex-direction:column;flex:1;min-height:0;gap:8px}
.per-editor-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.per-editor-head b{font-size:14px}
.per-ro-tag{font-size:10px;border:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.35));border-radius:999px;padding:1px 8px;opacity:.7}
.per-hint{font-size:11px;opacity:.55}
.per-editor textarea{flex:1;min-height:180px;resize:none;border:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.3));border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.05));color:inherit;padding:10px 12px;font:inherit;line-height:1.6;outline:none}
.per-editor textarea:focus{border-color:var(--dsw-alias-state-business-primary,#3B5BDB)}
.per-editor-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.per-count{font-size:11px;opacity:.65}
.per-count[data-over]{color:#e03131;font-weight:700}
.per-upd{font-size:11px;opacity:.5}
.per-msg{font-size:11px}
.per-msg[data-kind="ok"]{color:#2f9e44}
.per-msg[data-kind="err"]{color:#e03131}
.per-editor-foot .per-btn[data-primary]{margin-left:auto}
.per-history{display:flex;flex-direction:column;gap:10px}
.per-hist{border:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.18));border-radius:var(--dsw-radius-md,8px);padding:9px 12px}
.per-hist-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.per-chip{font-size:10px;border-radius:999px;padding:1px 8px;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.12))}
.per-chip[data-origin="agent"]{background:#fff3bf;color:#e67700}
.per-dt{margin-left:auto;font-size:11px;opacity:.5}
.per-hist-diff{display:grid;grid-template-columns:1fr 18px 1fr;gap:6px;align-items:stretch}
.per-hist-cell{font-size:11.5px;opacity:.6;white-space:pre-wrap;word-break:break-word;background:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.06));border-radius:6px;padding:6px 8px;max-height:72px;overflow:hidden}
.per-hist-cell[data-after]{opacity:.95}
.per-hist-arrow{display:flex;align-items:center;justify-content:center;opacity:.5;font-size:12px}
.per-empty{padding:24px;text-align:center;opacity:.55;font-size:12.5px}
.per-foot{display:flex;align-items:center;gap:8px;padding:8px 16px;border-top:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.14));font-size:10.5px;opacity:.55}
.per-preset{border:1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.18));border-radius:var(--dsw-radius-md,8px);padding:9px 12px;margin-bottom:8px}
.per-preset-head{display:flex;align-items:center;gap:8px}
.per-preset-head b{font-size:13px}
.per-preset-head button{margin-left:auto}
.per-preset-tag{font-size:11.5px;opacity:.6;margin-top:4px}
`;

    function fmtTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    function BlockEditor({ block, draft, onDraft, resetDraft, call, onSaved }) {
      const value = draft ?? block.content;
      const [saving, setSaving] = useState(false);
      const [msg, setMsg] = useState(null);
      const dirty = value !== block.content;
      const over = value.length > block.charLimit;
      const save = async () => {
        if (saving || over) return;
        setSaving(true); setMsg(null);
        try {
          const r = await call('set-block', { blockId: block.id, content: value });
          setMsg(r?.unchanged ? { kind: 'ok', text: '无改动' } : { kind: 'ok', text: '已保存 · 下个新会话生效' });
          resetDraft?.(block.id);
          onSaved?.();
        } catch (e) {
          setMsg({ kind: 'err', text: String(e?.message || e) });
        }
        setSaving(false);
      };
      return h('div', { className: 'per-editor' },
        h('div', { className: 'per-editor-head' },
          h('b', null, block.title),
          block.readOnly ? h('span', { className: 'per-ro-tag' }, '模型只读') : null,
          h('span', { className: 'per-hint' }, block.hint)),
        h('textarea', {
          value,
          onChange: (e) => onDraft?.(block.id, e.target.value),
          placeholder: '（空）此块尚未养成；写下第一段试试。',
        }),
        h('div', { className: 'per-editor-foot' },
          h('span', { className: 'per-count', 'data-over': over || undefined }, value.length + ' / ' + block.charLimit),
          h('span', { className: 'per-upd' }, block.updatedAt ? '更新于 ' + fmtTime(block.updatedAt) : ''),
          msg ? h('span', { className: 'per-msg', 'data-kind': msg.kind }, msg.text) : null,
          h('button', { className: 'per-btn', 'data-primary': true, disabled: !dirty || over || saving, onClick: save },
            saving ? '保存中…' : '保存')),
      );
    }

    function HistoryPage({ items }) {
      if (!items || !items.length) return h('div', { className: 'per-empty' }, '还没有变更记录。');
      const originLabel = (o) => (o === 'ui' ? '面板' : o === 'preset' ? '模板' : o === 'agent' ? '模型' : String(o || '?'));
      return h('div', { className: 'per-history' },
        items.map((it, i) => h('div', { className: 'per-hist', key: i },
          h('div', { className: 'per-hist-head' },
            h('span', { className: 'per-chip', 'data-origin': it.origin }, originLabel(it.origin)),
            h('b', null, it.title || it.blockId),
            h('span', { className: 'per-dt' }, fmtTime(it.ts))),
          h('div', { className: 'per-hist-diff' },
            h('div', { className: 'per-hist-cell' }, it.before || '（空）'),
            h('span', { className: 'per-hist-arrow' }, '→'),
            h('div', { className: 'per-hist-cell', 'data-after': true }, it.after || '（空）')))),
      );
    }

    function PresetModal({ call, blocks, onClose, onApplied }) {
      const [presets, setPresets] = useState(null);
      const [busy, setBusy] = useState('');
      const [err, setErr] = useState(null);
      useEffect(() => {
        let alive = true;
        call('presets').then((v) => { if (alive) setPresets(v.presets || []); })
          .catch((e) => { if (alive) setErr(String(e?.message || e)); });
        return () => { alive = false; };
      }, [call]);
      const hasContent = (blocks || []).some((b) => (b.content || '').trim() !== '');
      const apply = async (p) => {
        if (busy) return;
        if (hasContent && !window.confirm('应用「' + p.name + '」将覆盖当前五块内容（变更历史可回看）。确定？')) return;
        setBusy(p.id); setErr(null);
        try {
          await call('apply-preset', { presetId: p.id });
          onApplied?.();
        } catch (e) {
          setErr(String(e?.message || e));
        }
        setBusy('');
      };
      return h('div', {
        className: 'per-modal', role: 'dialog', 'aria-label': '人格模板',
        style: {
          position: 'fixed', zIndex: 50, top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l3,rgba(128,128,128,.3))',
          borderRadius: 'var(--dsw-radius-lg,12px)', padding: 16, boxShadow: '0 12px 40px rgba(0,0,0,.35)',
          width: 'min(460px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', color: 'var(--dsw-alias-label-primary)',
        },
      },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } },
          h('b', { style: { fontSize: 14 } }, '人格模板'),
          h('span', { className: 'per-hint' }, '热门人设一键填入，应用后可随意修改'),
          h('span', { style: { flex: 1 } }),
          h('button', { className: 'per-btn', onClick: onClose }, '关闭')),
        err ? h('div', { className: 'per-msg', 'data-kind': 'err' }, err) : null,
        !presets ? h('div', { className: 'per-empty' }, '加载中…')
          : presets.map((p) => h('div', { className: 'per-preset', key: p.id },
            h('div', { className: 'per-preset-head' },
              h('span', { style: { fontSize: 16 } }, p.emoji),
              h('b', null, p.name),
              h('button', { className: 'per-btn', 'data-primary': true, disabled: !!busy, onClick: () => apply(p) },
                busy === p.id ? '应用中…' : '应用')),
            h('div', { className: 'per-preset-tag' }, p.tagline))),
        hasContent ? h('div', { className: 'per-hint', style: { marginTop: 10 } }, '提示：当前人格已有内容，应用模板会覆盖并记入变更历史。') : null,
      );
    }

    function PersonaPanel({ connection }) {
      const call = useCallback(async (endpoint, payload) => {
        const res = await connection.rpc.call(CHANNEL, endpoint, payload || {});
        if (!res || res.ok !== true) throw new Error(res?.error?.message || 'persona rpc failed');
        return res.value;
      }, [connection]);
      const [state, setState] = useState(null);
      const [history, setHistory] = useState(null);
      const [sel, setSel] = useState('identity');
      const [drafts, setDrafts] = useState({});
      const [showPresets, setShowPresets] = useState(false);
      const [err, setErr] = useState(null);
      const [syncedAt, setSyncedAt] = useState(null);
      const alive = useRef(true);
      const onDraft = useCallback((id, v) => setDrafts((d) => ({ ...d, [id]: v })), []);
      const resetDraft = useCallback((id) => setDrafts((d) => { const n = { ...d }; delete n[id]; return n; }), []);
      const load = useCallback(() => {
        call('state').then((v) => { if (alive.current) { setState(v); setSyncedAt(new Date()); } })
          .catch((e) => { if (alive.current) setErr(String(e?.message || e)); });
        call('history', { limit: 100 }).then((v) => { if (alive.current) setHistory(v); }).catch(() => { });
      }, [call]);
      useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]);

      const blocks = state?.blocks || [];
      const isHistory = sel === 'history';
      const current = blocks.find((b) => b.id === sel);

      if (err) return h('div', { className: 'per-root' },
        h('style', null, css),
        h('div', { className: 'per-empty' }, '无法连接人格宿主：' + err,
          h('div', { style: { marginTop: 10 } }, h('button', { className: 'per-btn', onClick: () => { setErr(null); load(); } }, '重试'))));

      return h('div', { className: 'per-root' },
        h('style', null, css),
        h('div', { className: 'per-head' },
          h(Icon, { size: 30 }),
          h('div', { className: 'per-head-title' }, '人格 · 自然养成',
            h('div', { className: 'per-head-sub' }, '五块人格卡 · 随会话注入 · 手动编辑')),
          h('span', { className: 'per-pill', 'data-on': syncedAt || undefined }, h('span', { className: 'led' }), syncedAt ? '已连接' : '连接中'),
          h('button', { className: 'per-btn', onClick: () => setShowPresets(true) }, '模板'),
          h('button', { className: 'per-btn', onClick: load }, '刷新')),
        h('div', { className: 'per-main' },
          h('div', { className: 'per-nav' },
            blocks.map((b) => h('button', {
              key: b.id, 'data-active': sel === b.id || undefined, onClick: () => setSel(b.id),
            }, b.title, h('span', { className: 'cnt' }, (b.content || '').length))),
            h('button', { 'data-active': isHistory || undefined, onClick: () => setSel('history') },
              '变更历史', h('span', { className: 'cnt' }, history?.items?.length ?? ''))),
          h('div', { className: 'per-body' },
            isHistory ? h(HistoryPage, { items: history?.items })
              : current ? h(BlockEditor, {
                key: current.id, block: current,
                draft: drafts[current.id], onDraft, resetDraft,
                call, onSaved: load,
              })
                : h('div', { className: 'per-empty' }, '加载中…'))),
        h('div', { className: 'per-foot' },
          h('span', null, state?.dataRoot || ''),
          h('span', { style: { marginLeft: 'auto' } }, syncedAt ? '同步于 ' + syncedAt.toTimeString().slice(0, 8) : '')),
        showPresets ? h(PresetModal, {
          call, blocks,
          onClose: () => setShowPresets(false),
          onApplied: () => { setShowPresets(false); load(); },
        }) : null,
      );
    }

    return {
      inject: ['slots', 'connection'],
      apply(ctx) {
        ctx.effect(() => {
          const dispose = ctx.slots.inject('main', () => ctx.slots.inject('sidebar.panellist', () => {
            const stopMain = ctx.slots.register({ name: 'main', key: PANEL_ID, inject: () => ({}) },
              (props) => h(PersonaPanel, { connection: ctx.connection, ...props }));
            const openPanel = () => { try { ctx.layout?.selectPanel?.(PANEL_ID); } catch { } };
            const stopIcon = ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 32, label: () => '人格' },
              (props) => h('span', { onClick: openPanel, style: { display: 'inline-flex', cursor: 'pointer' }, ...props },
                h(Icon, { size: props?.size })));
            return () => { try { stopIcon(); } catch { } try { stopMain(); } catch { } };
          }));
          return dispose;
        });
      },
    };
  },
});
