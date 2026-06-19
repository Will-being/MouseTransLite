<p align="center">
  <img src="public/icons/icon_128.png" alt="Mouse Tooltip Translator Lite" width="128">
</p>

<h1 align="center">Mouse Tooltip Translator Lite</h1>

<p align="center">
  在網頁上懸停或選取文字，並用輕量提示框查看翻譯結果。
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | 繁體中文
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-4285F4">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-2ea44f">
  <img alt="Private package" src="https://img.shields.io/badge/npm-private-lightgrey">
</p>

## 專案概覽

Mouse Tooltip Translator Lite 是一個輕量瀏覽器擴充功能，用於在閱讀網頁時就地翻譯外語文字。它會在頁面中注入 content script，偵測滑鼠懸停或選取的文字，將文字傳送給設定的翻譯服務，並在小型 tooltip 中顯示結果。

這個版本專注於核心翻譯流程和更謹慎的隱私預設值。舊的 Vue 設定頁已經移除，擴充功能設定介面保留為簡單的 WebExtension popup。

## 功能特色

- 支援滑鼠懸停翻譯、選取文字翻譯，或兩者同時啟用。
- 支援按單字或句子進行懸停文字偵測。
- 預設使用 Google Translate，無需額外設定。
- 支援使用使用者提供 API Key 和可選 region 的 Microsoft Translator。
- 可設定來源語言、目標語言、觸發方式、tooltip 大小、顯示延遲和排除網站。
- 預設排除常見敏感網站，包括銀行、信箱、SSO、密碼管理器和企業應用網域。
- 翻譯請求前會對常見敏感值脫敏，包括 URL、電子郵件、手機號碼、身分證號、密碼、API Key 和 Token。
- 生產程式碼不會把翻譯文字或 API Key 輸出到控制台日誌。

## 隱私說明

擴充功能申請較寬的 host 權限，因為懸停翻譯需要在任意網頁上執行。為了降低誤傳敏感內容的風險，專案提供兩層保護：

1. 預設敏感網站排除：在已知隱私頁面停止內容腳本執行時邏輯。
2. 文字脫敏：在傳送翻譯請求前替換常見敏感格式。

這些保護是基於規則的，可以降低風險，但無法識別所有私人短語或機密文件。對於重要系統，請先在 **Exclude Websites** 中加入對應網站。

## 翻譯服務

### Google Translate

Google 是預設翻譯服務，不需要本機設定。

### Microsoft Translator

Microsoft Translator 需要 Azure Translator API Key。部分 Azure 資源還需要 `Ocp-Apim-Subscription-Region`，popup 中提供了可選的 **Bing Region** 欄位。

API Key 保存在擴充功能本機儲存中。匯出設定時會把 Key 脫敏為 `[REDACTED]`。

## 快速開始

```bash
npm install
npm run build
```

然後將生成的 `build` 目錄作為未封裝擴充功能載入到瀏覽器。

### Chrome / Edge

1. 開啟 `chrome://extensions/` 或 `edge://extensions/`。
2. 啟用開發人員模式。
3. 點選 **Load unpacked / 載入未封裝項目**。
4. 選擇 `build` 目錄。

### Firefox

1. 開啟 `about:debugging#/runtime/this-firefox`。
2. 點選 **Load Temporary Add-on / 臨時載入附加元件**。
3. 選擇 `build/manifest.json`。

## 使用方式

1. 點選擴充功能圖示開啟設定。
2. 選擇來源語言和目標語言。
3. 選擇 **Google Translate** 或 **Bing Translator**。
4. 在網頁上懸停文字或選取文字。
5. 翻譯結果會顯示在文字附近的 tooltip 中。

常用設定：

- **Translate When**：滑鼠懸停、選取文字，或兩者都啟用。
- **Text Detection Type**：按單字或句子偵測。
- **Show Delay**：懸停翻譯的觸發延遲。
- **Exclude Websites**：每行一個網域或萬用字元規則。

排除規則範例：

```text
mail.example.com
*.internal.example.com
*.github.com/settings/*
```

## 開發

```bash
npm run watch
```

建置生產版本：

```bash
npm run build
```

建置並生成 zip 套件：

```bash
npm run build-zip
```

Webpack 入口：

- `src/background.js`
- `src/contentScript.js`
- `src/popup.js`

靜態擴充功能資源位於 `public/`，建置時會複製到 `build/`。

## 專案結構

```text
config/                 Webpack 設定
public/                 Manifest、popup HTML、圖示、本地化檔案
src/background.js       擴充功能 service worker
src/contentScript.js    頁面內 tooltip 執行時
src/event/              滑鼠懸停和選取文字偵測
src/popup.js            設定 popup 邏輯
src/translator/         翻譯服務適配器
src/util/               設定、語言、DOM 和文字工具
```

## 致謝

本專案是 [MouseTooltipTranslator](https://github.com/ttop32/MouseTooltipTranslator) 的簡化版本。本倉庫延續這個方向，並聚焦於更小的 Manifest V3 擴充功能實作。

## **License**

MIT.
