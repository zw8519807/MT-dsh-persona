# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).

## [0.2.0] - 2026-11-18

### Changed
- 数据目录默认值改为跨平台通用路径 `~/.dsh/dsh-persona`（原为硬编码盘符路径）；仍可用 `DSH_PERSONA_DATA_ROOT` 覆盖
  Data dir default is now the portable `~/.dsh/dsh-persona` (previously a hardcoded drive path); `DSH_PERSONA_DATA_ROOT` still overrides.
- package.json 开源化：补 repository / bugs / homepage / scripts.test / keywords，移除 private 标记
  Open-sourced package metadata: repository / bugs / homepage / test script / keywords; private flag removed.

### Added
- README（双语）、CHANGELOG、LICENSE（MIT）、.gitattributes、.gitignore
- npm test 汇总三个 smoke 测试（storage / presets / host RPC）

## [0.1.0] - 2026-11-08

### Added
- 五块人格卡（身份认同 / 表达风格 / 行为原则 / 当前状态 / 用户画像）+ 字数上限
- `system-prompt/assemble` 注入：非空块渲染进每个会话，全空零开销
- 侧栏「人格」面板：实时编辑、字数统计、保存回执、变更历史页
- 5 套社区流行人格模板一键应用（猫娘助手 / 贾维斯式管家 / 毒舌损友 / 甜心毒舌 / 苏格拉底导师）
- 追加式变更历史（history.jsonl，保留最近 1000 条）
- 孤立代理字符清洗（避免 JSON 往返产生非法 \uD8XX 转义）
- 首次运行全空时自动播种默认模板；已有数据永不覆盖
