<p align="center">
  <img src="public/icons/icon_128.png" alt="Mouse Tooltip Translator Lite" width="128">
</p>

<h1 align="center">Mouse Tooltip Translator Lite</h1>

<p align="center">
  在网页上悬停或选中文本，并用轻量提示框查看翻译结果。
</p>

<p align="center">
  <a href="README.md">English</a> | 简体中文 | <a href="README.zh-TW.md">繁體中文</a>
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-4285F4">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-2ea44f">
  <img alt="Private package" src="https://img.shields.io/badge/npm-private-lightgrey">
</p>

## 项目概览

Mouse Tooltip Translator Lite 是一个轻量浏览器扩展，用于在阅读网页时就地翻译外语文本。它会在页面中注入 content script，检测鼠标悬停或选中的文本，将文本发送给配置的翻译服务，并在小型 tooltip 中显示结果。

这个版本专注于核心翻译流程和更谨慎的隐私默认值。旧的 Vue 设置页已经移除，扩展设置界面保留为简单的 WebExtension popup。

## 功能特性

- 支持鼠标悬停翻译、划词翻译，或两者同时启用。
- 支持按单词或句子进行悬停文本检测。
- 默认使用 Google Translate，无需额外配置。
- 支持使用用户提供 API Key 和可选 region 的 Microsoft Translator。
- 可配置源语言、目标语言、触发方式、tooltip 大小、显示延迟和排除网站。
- 默认排除常见敏感站点，包括银行、邮箱、SSO、密码管理器和企业应用域名。
- 翻译请求前会对常见敏感值脱敏，包括 URL、邮箱、手机号、身份证号、密码、API Key 和 Token。
- 生产代码不会把翻译文本或 API Key 输出到控制台日志。

## 隐私说明

扩展申请较宽的 host 权限，因为悬停翻译需要在任意网页上运行。为了降低误传敏感内容的风险，项目提供两层保护：

1. 默认敏感站点排除：在已知隐私页面停止内容脚本运行时逻辑。
2. 文本脱敏：在发送翻译请求前替换常见敏感格式。

这些保护是基于规则的，可以降低风险，但无法识别所有私人短语或机密文档。对于重要系统，请先在 **Exclude Websites** 中加入对应站点。

## 翻译服务

### Google Translate

Google 是默认翻译服务，不需要本地配置。

### Microsoft Translator

Microsoft Translator 需要 Azure Translator API Key。部分 Azure 资源还需要 `Ocp-Apim-Subscription-Region`，popup 中提供了可选的 **Bing Region** 字段。

API Key 保存在扩展本地存储中。导出设置时会把 Key 脱敏为 `[REDACTED]`。

## 快速开始

```bash
npm install
npm run build
```

然后将生成的 `build` 目录作为未打包扩展加载到浏览器。

### Chrome / Edge

1. 打开 `chrome://extensions/` 或 `edge://extensions/`。
2. 启用开发者模式。
3. 点击 **Load unpacked / 加载已解压的扩展程序**。
4. 选择 `build` 目录。

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击 **Load Temporary Add-on / 临时加载附加组件**。
3. 选择 `build/manifest.json`。

## 使用方式

1. 点击扩展图标打开设置。
2. 选择源语言和目标语言。
3. 选择 **Google Translate** 或 **Bing Translator**。
4. 在网页上悬停文本或选中文本。
5. 翻译结果会显示在文本附近的 tooltip 中。

常用设置：

- **Translate When**：鼠标悬停、划词，或两者都启用。
- **Text Detection Type**：按单词或句子检测。
- **Show Delay**：悬停翻译的触发延迟。
- **Exclude Websites**：每行一个域名或通配符规则。

排除规则示例：

```text
mail.example.com
*.internal.example.com
*.github.com/settings/*
```

## 开发

```bash
npm run watch
```

构建生产版本：

```bash
npm run build
```

构建并生成 zip 包：

```bash
npm run build-zip
```

Webpack 入口：

- `src/background.js`
- `src/contentScript.js`
- `src/popup.js`

静态扩展资源位于 `public/`，构建时会复制到 `build/`。

## 项目结构

```text
config/                 Webpack 配置
public/                 Manifest、popup HTML、图标、本地化文件
src/background.js       扩展 service worker
src/contentScript.js    页面内 tooltip 运行时
src/event/              鼠标悬停和划词检测
src/popup.js            设置 popup 逻辑
src/translator/         翻译服务适配器
src/util/               设置、语言、DOM 和文本工具
```

## 致谢

本项目是 [MouseTooltipTranslator](https://github.com/ttop32/MouseTooltipTranslator) 的简化版本。本仓库延续这个方向，并聚焦于更小的 Manifest V3 扩展实现。

## **License**

MIT.

