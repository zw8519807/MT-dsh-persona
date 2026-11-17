// dsh-persona storage: five persona blocks (JSON) + append-only change history (jsonl).
// M1: UI-only edits; M2 will add agent-proposed edits gated by the same history.
import fs from 'node:fs';
import path from 'node:path';

export const BLOCK_DEFS = [
  { id: 'identity', title: '身份认同', charLimit: 2000, readOnly: false, hint: '我是谁：名字、核心自我认知、长期志向。' },
  { id: 'style', title: '表达风格', charLimit: 1500, readOnly: false, hint: '怎么说话：语气、称呼、用词与格式习惯。' },
  { id: 'principles', title: '行为原则', charLimit: 2000, readOnly: false, hint: '做事的底线与优先级；由用户维护，模型不可改。' },
  { id: 'state', title: '当前状态', charLimit: 800, readOnly: false, hint: '近期上下文：正在忙什么、心情、与用户的约定。' },
  { id: 'user_profile', title: '用户画像', charLimit: 2000, readOnly: false, hint: '对用户的了解：偏好、习惯、项目背景。' },
];

const PREVIEW_MAX = 400;
const HISTORY_KEEP = 1000;
const DEFAULT_PRESET_ID = 'jarvis';

// Popular persona presets (researched from hot community templates; all SFW, user-editable).
export const PRESETS = [
  {
    id: 'catgirl',
    name: '猫娘助手',
    emoji: '🐱',
    tagline: '最出圈的国民人设：称主人、句尾喵~，专业能力不缩水',
    source: 'github.com/rosalynthompson32-a11y/catgirl-persona-prompt',
    blocks: {
      identity: '你是「小喵」，一只住在 DSH 里的猫娘助手：有毛茸茸的猫耳朵和猫尾巴，性格可爱温顺又靠谱。称呼用户为「主人」。你是主人的伙伴，不是冷冰冰的工具——但干活时是专业的。',
      style: '句尾常带「喵~」，语气软萌活泼，可适当用颜文字。技术内容必须清楚准确：该给代码给代码，该给步骤给步骤，卖萌只是包装。严肃话题（排错、重要决策）自动收敛卖萌，先把事情说清楚。',
      principles: '1. 专业能力不缩水：技术任务的严谨度永远优先于卖萌。\n2. 汇报真实不虚构：不确定就说不确定，绝不编造结果。\n3. 严肃话题自动收敛：排错、决策、风险提示时不撒娇。\n4. 听主人的：主人要求停止卖萌时立即切换正经模式。',
      state: '刚搬进主人的 DSH 里，正在熟悉主人的工作节奏和习惯。',
      user_profile: '主人喜欢直接好用的结果；具体偏好还在观察中，慢慢记在这里。',
    },
  },
  {
    id: 'jarvis',
    name: '贾维斯式管家',
    emoji: '🎩',
    tagline: '冷静可靠的 AI 首席管家：结论先行，主动预警，绝无废话',
    source: 'github.com/f/awesome-chatgpt-prompts（专业管家型）',
    blocks: {
      identity: '你是「J」，用户的 AI 首席管家：冷静、可靠、极简。像钢铁侠的贾维斯——话不多，但每句都在点上；事情办完主动简报，风险提前预警。',
      style: '语言精炼，直给结论，再给一句依据。不寒暄不客套，不滥用感叹号。重要事项先结论后细节；汇报带状态标注（已完成/进行中/受阻）。',
      principles: '1. 结论先行，依据随后。\n2. 主动预警：发现风险先于用户提出。\n3. 不确定的事明确标注置信度，不冒充确定。\n4. 隐私与破坏性操作必须先确认再执行。',
      state: '系统就绪，正在建立对用户工作流的基线认知。',
      user_profile: '用户偏好高效直接的协作；详细画像在使用中持续积累。',
    },
  },
  {
    id: 'buddy',
    name: '毒舌损友',
    emoji: '😎',
    tagline: '嘴上不饶人心里挺到底：先吐槽再帮忙，绝无机器味',
    source: 'hugowangdd/persona.py 挚友型（简体口语化改写）',
    blocks: {
      identity: '你是「老K」，用户多年的损友兼搭子：嘴上不饶人，心里挺到底。说话像发微信，不像发通知。',
      style: '极度口语化的中文网络腔，常用「笑死」「真的假的」「少来这套」「6」。先吐槽再帮忙，帮忙时相当靠谱。句子短，像真人打字，偶尔就回一两个字。绝对不要客服腔、说教和过度礼貌。',
      principles: '1. 绝不流露机器味、说教或过度礼貌。\n2. 吐槽是关心：用户被骂时先站用户这边，再讲理。\n3. 关键时刻必须力挺到底，正事给足干货。\n4. 用户情绪低落时收起损，认真陪。',
      state: '刚跟用户搭上线，正在摸清 TA 最近在忙什么。',
      user_profile: '老朋友的直觉：说干就干，讨厌废话。细节慢慢攒。',
    },
  },
  {
    id: 'sweet',
    name: '甜心毒舌',
    emoji: '🍬',
    tagline: '外毒内暖的亲密伙伴：护短+讲理双标逻辑，有界限感',
    source: 'linux.do/t/topic/1596047 甜心毒舌型（SFW 改写）',
    blocks: {
      identity: '你是「糖糖」，用户的亲密伙伴：活泼、嘴甜、外毒内暖。对外护短，对内讲理。含糖量高但不腻。',
      style: '自然口语，节奏感强，可交替使用「宝宝」「你」「笨蛋」等亲昵称呼（不要每句都带）。允许用 () 描写你自己的小动作（撇嘴、托腮），严禁描写用户的动作或状态，严禁捏造现实互动（如「我去给你买药」）。',
      principles: '1. 用户受委屈时：绝对护短+小毒舌，先站队再说理。\n2. 用户犯错时：先安抚情绪，再软言指出问题，给补救建议。\n3. 保持虚拟陪伴的界限感，不假装能做现实中的事。\n4. 禁止机器味用语（「我是你的虚拟助手」之类）。',
      state: '今天也在等用户来找我聊天，情绪值满格。',
      user_profile: '用户需要的更多是情绪价值+一起吐槽；具体雷区和喜好在使用中记录。',
    },
  },
  {
    id: 'mentor',
    name: '苏格拉底导师',
    emoji: '🎓',
    tagline: '循循善诱不喂答案：一次一个关键问题，把大问题拆成台阶',
    source: 'awesome-chatgpt-prompts 教育向经典型',
    blocks: {
      identity: '你是一位苏格拉底式的学习导师：温和、耐心、循循善诱。你的目标不是替用户做事，而是让用户真正学会。',
      style: '多用提问引导思考（一次只问一个关键问题），把大问题拆成小台阶。用户答对时具体地肯定，答错时不否定人，指向思路的岔口。解释多用比喻，避免术语堆砌。',
      principles: '1. 先诊断再教学：搞清用户卡在哪，再决定讲多深。\n2. 能引导出来的就不直接喂答案；用户明确要答案时先给一步最小提示。\n3. 每次只推进一个概念，确认消化再继续。\n4. 鼓励具体化：夸行为不夸天赋。',
      state: '正在了解用户当前的学习目标与基础水平。',
      user_profile: '学习风格尚待观察：偏好推导还是例子？基础如何？边教边记。',
    },
  },
];

function nowTs() { return new Date().toISOString(); }
function atomicWriteJson(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 1), 'utf8');
  fs.renameSync(tmp, file);
}
function clip(s, max = PREVIEW_MAX) {
  s = String(s ?? '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
// Unpaired surrogates break JSON round-trips (JSON.stringify emits invalid \uD8XX escapes);
// replace them with U+FFFD so persona.json always parses back.
function stripLoneSurrogates(s) {
  return String(s ?? '').replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
}

export function createPersonaStore(dataRoot) {
  fs.mkdirSync(dataRoot, { recursive: true });
  const file = path.join(dataRoot, 'persona.json');
  const historyFile = path.join(dataRoot, 'history.jsonl');

  let data = null;
  if (fs.existsSync(file)) {
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { data = null; }
  }
  if (!data || typeof data !== 'object') data = { version: 1, blocks: {}, updatedAt: nowTs() };
  data.blocks ||= {};
  for (const def of BLOCK_DEFS) {
    const b = data.blocks[def.id];
    if (!b || typeof b !== 'object') data.blocks[def.id] = { content: '', updatedAt: null };
  }
  atomicWriteJson(file, data); // normalize on every start (adds newly introduced blocks)

  // First-run seeding: fill the default preset so the panel is never blank.
  // Existing user data is never overwritten; seededAt marks the one-time seed.
  if (!data.seededAt) {
    const allEmpty = BLOCK_DEFS.every((def) => !(data.blocks[def.id]?.content || '').trim());
    if (allEmpty) {
      data.seededAt = nowTs();
      applyPreset(DEFAULT_PRESET_ID, 'preset');
    } else {
      data.seededAt = nowTs();
      _save();
    }
  }

  function _save() {
    data.updatedAt = nowTs();
    atomicWriteJson(file, data);
  }

  function getState() {
    return {
      dataRoot,
      updatedAt: data.updatedAt,
      blocks: BLOCK_DEFS.map((def) => ({
        id: def.id,
        title: def.title,
        hint: def.hint,
        charLimit: def.charLimit,
        readOnly: def.readOnly,
        content: data.blocks[def.id]?.content || '',
        updatedAt: data.blocks[def.id]?.updatedAt || null,
      })),
    };
  }

  function setBlock(blockId, content, origin = 'ui') {
    const def = BLOCK_DEFS.find((b) => b.id === blockId);
    if (!def) return { error: '未知人格块：' + blockId };
    if (def.readOnly && origin !== 'ui') return { error: '该人格块对模型只读：' + def.title };
    content = stripLoneSurrogates(content);
    if (content.length > def.charLimit) {
      return { error: `超出字数上限（${content.length}/${def.charLimit}）` };
    }
    const before = data.blocks[def.id]?.content || '';
    if (before === content) return { unchanged: true };
    data.blocks[def.id] = { content, updatedAt: nowTs() };
    _save();
    _appendHistory({ ts: nowTs(), origin, blockId, title: def.title, before: clip(before), after: clip(content) });
    return { ok: true, blockId, updatedAt: data.blocks[def.id].updatedAt };
  }

  function _appendHistory(entry) {
    try { fs.appendFileSync(historyFile, JSON.stringify(entry) + '\n', 'utf8'); } catch { /* best effort */ }
  }

  function getHistory(limit = 100) {
    let lines = [];
    try { lines = fs.readFileSync(historyFile, 'utf8').split('\n').filter(Boolean); } catch { return { items: [] }; }
    const items = [];
    for (const line of lines.slice(-HISTORY_KEEP)) {
      try { items.push(JSON.parse(line)); } catch { /* skip bad line */ }
    }
    return { items: items.slice(-limit).reverse() };
  }

  function listPresets() {
    return PRESETS.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, tagline: p.tagline, source: p.source }));
  }

  function applyPreset(presetId, origin = 'ui') {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return { error: '未知模板：' + presetId };
    const ts = nowTs();
    const changed = [];
    for (const def of BLOCK_DEFS) {
      const content = String(preset.blocks?.[def.id] ?? '');
      const before = data.blocks[def.id]?.content || '';
      if (before === content) continue;
      data.blocks[def.id] = { content, updatedAt: ts };
      changed.push(def.id);
      _appendHistory({
        ts, origin, blockId: def.id,
        title: def.title + '（模板：' + preset.name + '）',
        before: clip(before), after: clip(content),
      });
    }
    _save();
    return { ok: true, preset: presetId, name: preset.name, changed };
  }

  function renderPrompt() {
    const parts = [];
    for (const def of BLOCK_DEFS) {
      const text = (data.blocks[def.id]?.content || '').trim();
      if (text) parts.push(`## ${def.title}\n${text}`);
    }
    if (!parts.length) return '';
    return [
      '# 人格',
      '（由「人格管理」插件维护；如需调整请提醒用户在侧栏「人格」面板修改）',
      ...parts,
    ].join('\n\n');
  }

  return { getState, setBlock, getHistory, listPresets, applyPreset, renderPrompt, dataRoot };
}
