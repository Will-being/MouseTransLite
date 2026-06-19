# Mouse Tooltip Translator Lite

精简版鼠标悬停翻译浏览器扩展。

## 功能特性

- **鼠标悬停翻译**：将鼠标悬停在文字上即可显示翻译
- **文本选择翻译**：选中文字后自动翻译
- **多种检测模式**：单词或句子级别的翻译
- **翻译引擎**：
  - **Google 翻译**（默认，免费无需设置）
  - **Bing 翻译**（需要免费 API Key，每月 200 万字符）
- **可自定义**：
  - 源语言和目标语言
  - 提示框字体大小和宽度
  - 提示框位置（跟随鼠标或固定）
  - 显示延迟时间
  - 网站排除列表

## 快速开始

### 安装

1. 安装依赖：
```bash
npm install
```

2. 构建扩展：
```bash
npm run build
```

3. 在浏览器中加载：
   - Chrome/Edge: 打开 `chrome://extensions/`，启用开发者模式，点击"加载已解压的扩展程序"，选择 `build` 文件夹
   - Firefox: 打开 `about:debugging#/runtime/this-firefox`，点击"临时加载附加组件"，选择 `build/manifest.json`

### 使用

1. **使用 Google 翻译**（推荐）
   - 点击扩展图标打开设置
   - Translation Engine 选择 "Google Translate"（默认）
   - 立即可用，无需配置

2. **使用 Bing 翻译**
   - 点击扩展图标打开设置
   - Translation Engine 选择 "Bing Translator"
   - 点击 "Get Free API Key" 获取免费 API Key
   - 输入 API Key 并保存
   - 免费额度：每月 200 万字符

3. **翻译文本**
   - 将鼠标悬停在任意文本上
   - 或选中文本
   - 自动显示翻译结果

## 开发

### 开发模式

```bash
npm run watch
```

### 构建生产版本

```bash
npm run build
```

### 热重载

修改代码后，在浏览器扩展页面点击"重新加载"按钮。

## 文档

- [README.md](README.md) - 项目说明（本文档）
- [LOGIC_BUGS.md](LOGIC_BUGS.md) - 逻辑漏洞分析和修复建议
- [BUGFIX_LOGIC_BUGS.md](BUGFIX_LOGIC_BUGS.md) - 逻辑漏洞修复报告
- [BING_SOLUTION_ANALYSIS.md](BING_SOLUTION_ANALYSIS.md) - Bing 翻译方案分析
- [BUGFIX_BING_OFFICIAL_API.md](BUGFIX_BING_OFFICIAL_API.md) - Bing 官方 API 修复报告

## 已修复的问题

### 逻辑漏洞修复（2026-06-16）

✅ 修复了 6 个高优先级和中优先级问题：
1. 点击事件破坏 interactive 模式
2. prevTooltipText 智能去重
3. Google 翻译空结果返回原文
4. popup 硬编码覆盖设置
5. Background 未处理未知消息类型
6. 删除 waitJquery 死代码

详见：[BUGFIX_LOGIC_BUGS.md](BUGFIX_LOGIC_BUGS.md)

### Bing 翻译器修复（2026-06-16）

✅ 从爬虫 token 方案迁移到官方 Microsoft Translator API：
- 使用官方 API（稳定可靠）
- 支持免费 API Key（每月 200 万字符）
- 添加用户友好的设置界面
- 详细的帮助文档

详见：[BUGFIX_BING_OFFICIAL_API.md](BUGFIX_BING_OFFICIAL_API.md)

## 常见问题

### Q: Bing 翻译不工作？

A: Bing 翻译现在需要免费的 API Key：
1. 点击扩展设置中的 "Get Free API Key"
2. 在 Azure Portal 创建 Translator 资源（Free F0 tier）
3. 复制 API Key 粘贴到设置中
4. 免费额度：每月 200 万字符

或者切换到 Google 翻译（无需设置）。

### Q: 如何切换翻译引擎？

A: 点击扩展图标 → Translation Engine → 选择 Google 或 Bing

### Q: 如何排除某些网站？

A: 点击扩展图标 → Exclude Websites → 输入网站模式（如 `*.example.com`）

### Q: 翻译速度慢？

A: 
- Google 翻译通常更快
- 检查网络连接
- 减少 Show Delay 时间

## 原项目

本项目是 [MouseTooltipTranslator](https://github.com/ttop32/MouseTooltipTranslator) 的精简版本，只保留了核心的鼠标悬停翻译功能。

## 许可证

MIT License

---

**当前版本**: 1.0.0  
**最后更新**: 2026-06-16
