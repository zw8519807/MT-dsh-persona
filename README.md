# dsh-persona

人格管理插件 for DeepSeek Harness（DSH）：把「你希望 AI 是谁」变成五块可编辑的人格卡，注入每个会话的 system prompt，并在侧栏随时修改。

Persona management plugin for DeepSeek Harness: five editable persona blocks (identity / style / principles / state / user profile) injected into every session's system prompt, editable anytime from a sidebar panel.

## 特性 / Features

- **五块人格卡**：身份认同 / 表达风格 / 行为原则 / 当前状态 / 用户画像，每块独立字数上限（800–2000 字）
  **Five persona blocks**: identity / style / principles / current state / user profile, each with its own char limit.
- **System prompt 注入**：非空块渲染为 `## 标题` 段落注入每个会话；全空时不注入零开销
  **Prompt injection**: non-empty blocks render into every session prompt; zero cost when all empty.
- **侧栏「人格」面板**：浏览器半边注册侧栏面板，实时编辑、字数统计、保存回执
  **Sidebar panel**: live editing with char counter and save feedback.
- **一键模板**：内置 5 套社区流行人格模板（猫娘助手 / 贾维斯式管家 / 毒舌损友 / 甜心毒舌 / 苏格拉底导师），一键应用，可继续手改
  **One-click presets**: 5 community-inspired persona presets, applied instantly and fully editable afterwards.
- **变更历史**：追加式 jsonl 历史（最近 1000 条），面板里随时回看每一条改动
  **Change history**: append-only JSONL (last 1000 entries), reviewable in the panel.
- **数据落盘**：persona.json（原子写）+ history.jsonl，默认在 `~/.dsh/dsh-persona/`，可用环境变量 `DSH_PERSONA_DATA_ROOT` 重定向
  **Durable storage**: atomic-write persona.json + history.jsonl under `~/.dsh/dsh-persona/` (override with `DSH_PERSONA_DATA_ROOT`).

## 安装 / Install

```powershell
git clone https://github.com/zw8519807/MT-dsh-persona.git
```

然后在 DSH 里用插件管理器安装本地目录（官方工具会代写 profile manifest）：

Then install the local directory via DSH's plugin manager (the official tool writes the profile manifest for you):

```
plugin_manager action=install_bundle target=<clone 目录的绝对路径>
```

安装后重启 DSH，侧栏出现「人格」面板。Restart DSH after installing; the "人格" panel appears in the sidebar.

## 用法 / Usage

1. 打开侧栏「人格」面板（图标 🤖）
2. 左侧切换五块卡片，右侧编辑，保存即时生效（下一个会话开始注入）
3. 首次使用全空时会自动播种默认模板（贾维斯式管家）；顶栏「模板」可随时换
4. 「历史」页签回看每条改动的 before/after

1. Open the "人格" panel in the sidebar.
2. Switch between the five blocks; edits apply from the next session.
3. First run with all blocks empty seeds the default preset (butler-style); switch presets anytime.
4. The "历史" tab shows before/after for every change.

## 架构 / Architecture

```
lib/index.js    宿主半边：client RPC（/dsh-persona）+ system-prompt/assemble 注入
lib/store.js    存储层：五卡 JSON + 追加历史 + 模板 + 原子写
client.js       浏览器半边：侧栏面板（编辑器/模板/历史）
locale/         面板文案（zh/en）
test/           三个 smoke 测试（storage / presets / host RPC）
```

## 开发 / Development

```powershell
npm test   # 或分别 node test/smoke.mjs && node test/presets-smoke.mjs && node test/host-smoke.mjs
```

打包安装用官方流程（勿 link 安装）：

```powershell
pnpm pack   # 产出 tgz
# plugin_manager install_bundle target=<tgz 绝对路径>
```

## 已知限制 / Known limitations

- M1 阶段仅 UI 编辑；agent 侧工具（persona_read / persona_update）在 M2 规划中
  M1 is UI-edit only; agent-side tools are planned for M2.
- 行为原则块设计上由用户维护，模型不可改（`readOnly` 预留位）
  The principles block is user-owned by design (readOnly slot reserved).

## 许可 / License

[MIT](LICENSE)
