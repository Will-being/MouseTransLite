## 🔴 高价值 / 建议优先处理

### 1. `contentScript.js` 产物过大（168KB），lodash 是元凶

　　**问题**：全项目只用到 `debounce` 一个函数，却整包引入 lodash。

```
// contentScript.js:5, mouseover.js:2, selection.js:2
import { debounce } from "lodash";
```

　　webpack 打包时把整个 lodash（533KB 源码 → 压缩后约 25KB）打进 contentScript，导致 **contentScript.js 高达 168KB**——这是会被注入到用户访问的**每个网页每个 iframe** 的脚本，体积直接影响页面性能。

　　**方案**（任选其一，效果递减）：

- ✅ 最优：换 `import debounce from "lodash/debounce"`（具名路径导入），tree-shaking 生效，立省 ~20KB。
- 次优：删除依赖，用 ~15 行手写 debounce。
- 最差（当前）：`import { debounce } from "lodash"`。
　　**收益**：contentScript 体积可降至 ~145KB 以下，且对所有 `<all_urls>` 站点的注入开销变小。

### 2. popup 与 settingDict 存在"幽灵配置项"

　　**问题**：`setting_default.js` 定义了这些项的默认值和选项，`contentScript.js` 也读取它们，但 **popup.html 完全没有暴露**：

- `tooltipPosition`（follow / fixed）
- `tooltipWidth`（200–600）
- `langExcludeList`（排除语言）
- `showTooltipWhen`（按键触发）
　　`popup.js:56-76` 还要特意"保留这些不在 UI 里的高级设置"，逻辑绕了一圈。

　　**方案**：要么在 popup 新增一个"高级"折叠区暴露它们；要么既然不打算暴露，就从 settingDict 里删掉对应 entry（连带删除 contentScript 里的读取分支）。当前的"定义了、用了、但用户摸不到"是典型的配置债。

### 3. 排除网站清单合并方向错误（`setting_util.js:37-42`）

　　**问题**：

```
function sanitizeWebsiteExcludeList(value) {
  return sanitizeArray([
    ...defaultData.websiteExcludeList,  // 总是先塞进默认 40+ 条
    ...(Array.isArray(value) ? value : []),
  ]);
}
```

　　每次保存/导入都会把**默认排除清单重新合并回去**。用户如果在 popup 里清空 textarea 想关闭默认排除，保存后清单又会被默认值填满——**用户永远无法真正删除默认排除项**。这与"用户可自定义排除网站"的语义冲突。

　　**方案**：让 popup 存储的就是用户最终意图，不再每次 merge 默认值；若想保留默认推荐，改成"首次安装时写入一次默认值"。

## 🟡 中等价值 / 值得清理

### 4. 三个空目录：`src/components`、`src/router`、`src/tts`

　　全为空（`ls` 确认无文件）。是从原版精简时遗留的骨架。建议删除，减少认知负担——需要时再建。

### 5. 设置同步逻辑三处重复（`background.js`、`contentScript.js`、`setting_util.js`）

　　**问题**：`applySettingChanges`（background.js:23）和 `handleSettingChanged`（contentScript.js:80）几乎是同一段代码复制粘贴：

```
for (const [key, change] of Object.entries(changes)) {
  if (!hasOwnProperty(defaultData, key)) { delete setting[key]; continue; }
  setting[key] = hasOwnProperty(change, "newValue") ? change.newValue
    : (Array.isArray(defaultData[key]) ? [...defaultData[key]] : defaultData[key]);
}
```

　　**方案**：抽到 `setting_util.js` 导出一个 `applyChanges(setting, changes)` 函数，两处复用。

### 6. `lang.js` 中 `langListOpposite`、`isRtl` 从未被引用

```
export const langListOpposite = ...  // 全项目 grep 无引用
export function isRtl(lang) { ... }  // 只被同文件 getRtlDir 调用，但 getRtlDir 才是对外接口
```

　　**方案**：删除 `langListOpposite`（死代码）；`isRtl` 若不想保留为公开 API 可内联进 `getRtlDir`。

### 7. `text_util.js` 多个方法未被使用

　　`filterEmoji`、`filterHtmlTag`、`truncate`、`copyTextToClipboard` 全项目 grep 无调用方。同样是从原版继承的死代码。

　　**方案**：删除未使用方法，只保留 `filterWord`、`trimAllSpace`、`redactSensitiveText`、`concatJson`、`copyJson`。

## 🟢 锦上添花 / 长期改进

### 8. contentScript 与 background 的语言归一化逻辑重复

- `contentScript.js:503` 有 `normalizeLanguageCode`
- `setting_util.js:110` 有 `parseLocaleLang`
- `translator/bing.js:9` 有 `toBingLang` / `fromBingLang`
　　三处都在做"语言代码归一化"但各自为政。可整合到 `lang.js` 统一管理。

### 9. `dom.js` 和 `util/index.js` 各自定义了同名 `extractTextFromRange`

　　`dom.js:1` 和 `index.js:29` 是完全相同的函数。建议合并，统一从一处导出。

### 10. `contentScript.js` 是 584 行的"上帝文件"

　　单个文件承担：初始化、URL 排除匹配、tooltip 渲染、事件分发、HTML 构造、语言判断、键盘状态。可拆分为：

- `exclusionMatcher.js`（`matchesExcludePattern` 等约 80 行）
- `tooltipRenderer.js`（`buildTooltipContent`、`showTooltip`、`applyStyleSetting`）
- 主文件只做编排
### 11. Google 翻译的多个端点无真实失败兜底（`google.js:23-38`）

```
for (const apiUrl of API_ENDPOINTS) {
  try { return await ky(...).json(); }
  catch (error) { lastError = error; }  // 静默吞掉，只留最后一个
}
throw new Error(`...${lastError?.message}`);
```

　　某个端点因 CORS/网络失败时，没有日志、没有区分"端点不可达"和"返回格式错误"。建议至少把每个端点的失败原因收集起来，便于排查。

### 12. 构建产物未做版本号同步

　　`manifest.json`、`package.json`、README 徽章都是 `1.0.0`，三个地方手动维护。可加一个构建脚本从 `package.json` 注入 manifest version。

### 13. 没有 README 提到的"watch 模式"以外的开发体验优化

　　建议补 `.editorconfig`、`prettier` 配置，统一缩进（当前文件混用 2 空格）。另外所有源文件以 `﻿` BOM 开头，对某些工具链不友好，可批量去除。
