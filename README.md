<p align="center">
  <img src="public/icons/icon_128.png" alt="Mouse Tooltip Translator Lite" width="128">
</p>

<h1 align="center">Mouse Tooltip Translator Lite</h1>

<p align="center">
  Hover or select text on a web page and see the translation in a lightweight tooltip.
</p>

<p align="center">
  English | <a href="README.zh-CN.md">简体中文</a> | <a href="README.zh-TW.md">繁體中文</a>
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-4285F4">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.1-2ea44f">
  <img alt="Private package" src="https://img.shields.io/badge/npm-private-lightgrey">
</p>

## Overview

Mouse Tooltip Translator Lite is a lightweight browser extension for translating foreign-language text while reading web pages. It injects a content script into the page, detects hovered or selected text, sends the text to the configured translation service, and displays the result in a small tooltip.

This version focuses on the core translation workflow and more cautious privacy defaults. The old Vue settings page has been removed, and the extension settings UI is kept as a simple WebExtension popup.

## Features

- Supports mouse-hover translation, selected-text translation, or both at the same time.
- Supports word-level or sentence-level hover text detection.
- Uses Google Translate by default without extra configuration.
- Supports Microsoft Translator with a user-provided API key and optional region.
- Configurable source language, target language, trigger mode, tooltip size, display delay, and excluded websites.
- Excludes common sensitive sites by default, including banking, email, SSO, password manager, and enterprise application domains.
- Redacts common sensitive values before translation requests, including URLs, email addresses, phone numbers, ID numbers, passwords, API keys, and tokens.
- Production code does not output translation text or API keys to console logs.

## Privacy Notes

The extension requests broad host permissions because hover translation needs to run on arbitrary web pages. To reduce the risk of accidentally sending sensitive content, the project provides two layers of protection:

1. Default sensitive-site exclusions: stop the content script runtime logic on known private pages.
2. Text redaction: replace common sensitive formats before sending translation requests.

These protections are rule-based. They can reduce risk, but they cannot identify every private phrase or confidential document. For important systems, add the corresponding sites to **Exclude Websites** first.

## Translation Services

### Google Translate

Google is the default translation service and does not require local configuration.

### Microsoft Translator

Microsoft Translator requires an Azure Translator API Key. Some Azure resources also require `Ocp-Apim-Subscription-Region`; the popup provides an optional **Bing Region** field.

The API key is stored in extension local storage. When settings are exported, the key is redacted as `[REDACTED]`.

## Quick Start

```bash
npm install
npm run build
```

Then load the generated `build` directory into the browser as an unpacked extension.

### Chrome / Edge

1. Open `chrome://extensions/` or `edge://extensions/`.
2. Enable developer mode.
3. Click **Load unpacked**.
4. Select the `build` directory.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `build/manifest.json`.

## Usage

1. Click the extension icon to open settings.
2. Choose the source language and target language.
3. Choose **Google Translate** or **Bing Translator**.
4. Hover over text or select text on a web page.
5. The translation result appears in a tooltip near the text.

Common settings:

- **Translate When**: mouse hover, selected text, or both.
- **Text Detection Type**: detect by word or sentence.
- **Show Delay**: trigger delay for hover translation.
- **Exclude Websites**: one domain or wildcard rule per line.

Example exclude rules:

```text
mail.example.com
*.internal.example.com
*.github.com/settings/*
```

## Development

```bash
npm run watch
```

Build the production version:

```bash
npm run build
```

Build and generate a zip package:

```bash
npm run build-zip
```

Webpack entries:

- `src/background.js`
- `src/contentScript.js`
- `src/popup.js`

Static extension assets are in `public/` and are copied to `build/` during bundling.

## Project Structure

```text
config/                 Webpack configuration
public/                 Manifest, popup HTML, icons, localization files
src/background.js       Extension service worker
src/contentScript.js    In-page tooltip runtime
src/event/              Mouse hover and selected-text detection
src/popup.js            Settings popup logic
src/translator/         Translation service adapters
src/util/               Settings, language, DOM, and text utilities
```

## Acknowledgments

This project is a simplified version of [MouseTooltipTranslator](https://github.com/ttop32/MouseTooltipTranslator). This repository continues that direction and focuses on a smaller Manifest V3 extension implementation.

## **License**

MIT.
