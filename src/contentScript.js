// Main content script - mouseover translation tooltip with debug logging
import tippy, { hideAll } from "tippy.js";
import matchUrl from "match-url-wildcard";
import browser from "webextension-polyfill";
import { debounce } from "lodash";
import TextUtil from "./util/text_util.js";
import SettingUtil from "./util/setting_util.js";
import { defaultData } from "./util/setting_default.js";
import { getRtlDir } from "./util/lang.js";
import {
  enableSelectionEndEvent,
  getSelectionRange,
} from "./event/selection.js";
import {
  enableMouseoverTextEvent,
} from "./event/mouseover.js";
import * as util from "./util/dom.js";

let setting;
let tooltip;
let tooltipContainer;
let styleElement;
let keyDownList = { always: true };
let selectedText = "";
let prevTooltipText = "";
let lastTooltipContent = "";
let activeTranslateRequestId = 0;
let currentHoverText = "";
let currentHoverRange = null;
let eventCleanups = [];
let initialized = false;
let isExcluded = false;

function log() {}

async function initMouseTooltipTranslator() {
  try {
    log("Initializing MouseTooltipTranslator...");

    if (!document.body) {
      await new Promise((resolve) => {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", resolve, { once: true });
        } else {
          resolve();
        }
      });
    }

    await getSetting();
    browser.storage.onChanged.addListener(handleSettingChanged);

    if (checkExcludeUrl()) {
      isExcluded = true;
      log("Current URL is excluded, stopping initialization");
      return;
    }

    addElementEnv();
    applyStyleSetting();
    loadEventListener();
    initialized = true;

    log("Initialization complete!");
  } catch (error) {
    return;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMouseTooltipTranslator, { once: true });
} else {
  initMouseTooltipTranslator();
}

async function getSetting() {
  setting = await SettingUtil.loadSetting();
}

function handleSettingChanged(changes, areaName) {
  if (areaName !== "local" || !setting) {
    return;
  }

  for (const [key, change] of Object.entries(changes)) {
    if (!Object.prototype.hasOwnProperty.call(defaultData, key)) {
      delete setting[key];
      continue;
    }

    setting[key] = Object.prototype.hasOwnProperty.call(change, "newValue")
      ? change.newValue
      : (Array.isArray(defaultData[key]) ? [...defaultData[key]] : defaultData[key]);
  }

  reloadRuntimeFromSettings();
}
function reloadRuntimeFromSettings() {
  activeTranslateRequestId += 1;
  prevTooltipText = "";
  currentHoverText = "";
  currentHoverRange = null;
  hideAll();

  const shouldBeExcluded = checkExcludeUrl();
  if (shouldBeExcluded) {
    isExcluded = true;
    destroyTooltipRuntime();
    return;
  }

  isExcluded = false;
  if (!tooltipContainer) {
    addElementEnv();
  }

  applyStyleSetting();
  loadEventListener();
  initialized = true;
}

function checkExcludeUrl() {
  const currentUrl = window.location.href;
  const excludeList = setting?.["websiteExcludeList"] || [];

  for (const pattern of excludeList) {
    if (matchesExcludePattern(currentUrl, pattern)) {
      log("URL excluded by pattern:", pattern);
      return true;
    }
  }

  return false;
}

function matchesExcludePattern(currentUrl, pattern) {
  const normalizedPattern = String(pattern || "").trim().toLowerCase();
  if (!normalizedPattern) {
    return false;
  }

  try {
    if (matchUrl(currentUrl, normalizedPattern)) {
      return true;
    }
  } catch (error) {
    log("Exclude pattern match error:", error);
  }

  let url;
  try {
    url = new URL(currentUrl);
  } catch (error) {
    return wildcardMatches(currentUrl.toLowerCase(), normalizedPattern);
  }

  const host = url.hostname.toLowerCase();
  const path = `${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const hostAndPath = `${host}${path}`;
  const urlWithoutProtocol = currentUrl.replace(/^\w+:\/\//, "").toLowerCase();
  const patternWithoutProtocol = normalizedPattern.replace(/^\w+:\/\//, "");

  if (!patternWithoutProtocol.includes("/")) {
    return matchesDomainPattern(host, patternWithoutProtocol);
  }

  return wildcardMatchesAny(
    [currentUrl.toLowerCase(), urlWithoutProtocol, hostAndPath],
    patternWithoutProtocol
  );
}

function matchesDomainPattern(host, pattern) {
  const domain = pattern.split("/")[0].split(":")[0];

  if (!domain) {
    return false;
  }

  if (domain.startsWith("*.")) {
    const suffix = domain.slice(2);
    return host === suffix || host.endsWith(`.${suffix}`);
  }

  if (domain.includes("*")) {
    return wildcardMatchesAny([host], domain);
  }

  return host === domain || host.endsWith(`.${domain}`);
}

function wildcardMatchesAny(candidates, pattern) {
  return candidates.some((candidate) => wildcardMatches(candidate, pattern)) ||
    (pattern.startsWith("*.") && candidates.some((candidate) => wildcardMatches(candidate, pattern.slice(2))));
}

function wildcardMatches(candidate, pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(candidate);
}

function addElementEnv() {
  if (tooltipContainer?.isConnected) {
    return;
  }

  tooltipContainer = document.createElement("div");
  tooltipContainer.id = "mousetooltip-container";
  tooltipContainer.style.cssText = "position: fixed; top: 0; left: 0; z-index: 999999;";
  document.body.appendChild(tooltipContainer);

  tooltip = tippy(tooltipContainer, {
    content: "",
    allowHTML: true,
    interactive: true,
    trigger: "manual",
    hideOnClick: false,
    theme: "custom",
    placement: "top-start",
    followCursor: setting["tooltipPosition"] === "follow",
    getReferenceClientRect: () => emptyClientRect(),
  });
}

function applyStyleSetting() {
  const fontSize = setting["tooltipFontSize"] || "18";
  const width = setting["tooltipWidth"] || "300";

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "mousetooltip-style";
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = `
    .tippy-box[data-theme~="custom"] {
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      font-size: ${fontSize}px;
      max-width: ${width}px;
      padding: 10px;
      border-radius: 8px;
      z-index: 999999;
    }
    .tippy-box[data-theme~="custom"] .tippy-content {
      padding: 0;
    }
    .tippy-arrow {
      color: rgba(0, 0, 0, 0.8);
    }
    .tooltip-source {
      opacity: 0.7;
      font-size: 0.9em;
      margin-bottom: 5px;
    }
    .tooltip-target {
      font-weight: bold;
    }
    .tooltip-dict {
      margin-top: 8px;
      font-size: 0.85em;
      opacity: 0.8;
    }
  `;

  tooltip?.setProps({
    followCursor: setting["tooltipPosition"] === "follow",
  });
}

function loadEventListener() {
  cleanupEventListeners();

  const translateWhen = setting["translateWhen"] || "mouseoverselect";

  if (translateWhen === "mouseover" || translateWhen === "mouseoverselect") {
    const cleanupMouseover = enableMouseoverTextEvent(window, setting, () => keyDownList);
    eventCleanups.push(cleanupMouseover);
    document.addEventListener("mouseoverText", onMouseoverText);
    document.addEventListener("mouseLeaveText", onMouseLeaveText);
    eventCleanups.push(() => document.removeEventListener("mouseoverText", onMouseoverText));
    eventCleanups.push(() => document.removeEventListener("mouseLeaveText", onMouseLeaveText));
  }

  if (translateWhen === "select" || translateWhen === "mouseoverselect") {
    const cleanupSelection = enableSelectionEndEvent(window, 300);
    eventCleanups.push(cleanupSelection);
    document.addEventListener("selectionEnd", onSelectionEnd);
    eventCleanups.push(() => document.removeEventListener("selectionEnd", onSelectionEnd));
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  eventCleanups.push(() => window.removeEventListener("keydown", handleKeyDown));
  eventCleanups.push(() => window.removeEventListener("keyup", handleKeyUp));

  const debouncedHideAll = debounce(() => hideAll(), 100);
  window.addEventListener("scroll", debouncedHideAll);
  eventCleanups.push(() => {
    window.removeEventListener("scroll", debouncedHideAll);
    debouncedHideAll.cancel?.();
  });

  const handleClick = (e) => {
    const tippyBox = document.querySelector('.tippy-box[data-theme~="custom"]');
    if (tippyBox && tippyBox.contains(e.target)) {
      return;
    }
    hideAll();
  };
  window.addEventListener("click", handleClick);
  eventCleanups.push(() => window.removeEventListener("click", handleClick));
}

function cleanupEventListeners() {
  for (const cleanup of eventCleanups) {
    try {
      cleanup?.();
    } catch (error) {
      log("Event cleanup error:", error);
    }
  }
  eventCleanups = [];
}

function destroyTooltipRuntime() {
  cleanupEventListeners();
  tooltip?.destroy();
  tooltip = null;
  tooltipContainer?.remove();
  tooltipContainer = null;
  styleElement?.remove();
  styleElement = null;
  initialized = false;
}

async function onMouseoverText(e) {
  const { mouseoverText, mouseoverRange } = e.mouseoverText || {};

  currentHoverText = TextUtil.trimAllSpace(mouseoverText || "");
  currentHoverRange = mouseoverRange || null;

  if (!currentHoverText || !checkShowTooltip() || isExcluded) {
    hideAll();
    return;
  }

  await translateAndShowTooltip(currentHoverText, currentHoverRange, {
    kind: "mouseover",
    text: currentHoverText,
    range: currentHoverRange,
  });
}

function onMouseLeaveText() {
  currentHoverText = "";
  currentHoverRange = null;
  activeTranslateRequestId += 1;
  hideAll();
}

async function onSelectionEnd(e) {
  selectedText = e.selectionText || "";
  const selectionRange = getSelectionRange(window);

  if (!selectedText || !checkShowTooltip() || isExcluded) {
    return;
  }

  await translateAndShowTooltip(selectedText, selectionRange, {
    kind: "selection",
    text: TextUtil.trimAllSpace(selectedText),
    range: selectionRange,
  });
}

function checkShowTooltip() {
  const showTooltipWhen = setting["showTooltipWhen"] || "always";

  if (showTooltipWhen === "always") {
    return true;
  }

  return keyDownList[showTooltipWhen] === true;
}

async function translateAndShowTooltip(text, range, requestContext) {
  const cleanText = TextUtil.trimAllSpace(text);

  if (!cleanText) {
    hideAll();
    return;
  }

  if (cleanText === prevTooltipText && tooltip?.state?.isVisible) {
    showTooltip(lastTooltipContent, range);
    return;
  }

  prevTooltipText = cleanText;
  const requestId = ++activeTranslateRequestId;

  const sourceLang = setting["translateSource"] || "auto";
  const targetLang = setting["translateTarget"] || "en";

  if (sourceLang !== "auto" && isSameLanguage(sourceLang, targetLang)) {
    hideAll();
    return;
  }

  const textForTranslation = TextUtil.redactSensitiveText(cleanText);
  if (!textForTranslation || textForTranslation.trim() === "") {
    hideAll();
    return;
  }

  try {
    const result = await util.requestTranslate(textForTranslation, sourceLang, targetLang);

    if (!isCurrentTranslateRequest(requestId, requestContext)) {
      return;
    }

    if (!result || result.isBroken) {
      hideAll();
      return;
    }

    if (result.sourceLang && result.targetLang && isSameLanguage(result.sourceLang, result.targetLang)) {
      hideAll();
      return;
    }

    const excludeLangs = setting["langExcludeList"] || [];
    if (result.sourceLang && excludeLangs.includes(result.sourceLang)) {
      hideAll();
      return;
    }

    if (!result.targetText || result.targetText.trim() === "") {
      hideAll();
      return;
    }

    const content = buildTooltipContent(result, textForTranslation);
    showTooltip(content, range);
  } catch (error) {
    hideAll();
  }
}
function isCurrentTranslateRequest(requestId, requestContext) {
  if (requestId !== activeTranslateRequestId || isExcluded) {
    return false;
  }

  if (requestContext?.kind === "mouseover") {
    return currentHoverText === requestContext.text && currentHoverRange === requestContext.range;
  }

  return true;
}

function buildTooltipContent(result, sourceText) {
  const { targetText, transliteration, dict, targetLang } = result;

  const direction = getRtlDir(targetLang);

  let html = `<div dir="${direction}">`;
  html += `<div class="tooltip-source">${escapeHtml(sourceText || "")}</div>`;
  html += `<div class="tooltip-target">${escapeHtml(targetText || sourceText || "")}</div>`;

  if (transliteration) {
    html += `<div class="tooltip-dict">${escapeHtml(transliteration)}</div>`;
  }

  if (dict) {
    html += `<div class="tooltip-dict">${escapeHtml(dict)}</div>`;
  }

  html += "</div>";

  return html;
}

function escapeHtml(text) {
  if (text === undefined || text === null) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function isSameLanguage(lang1, lang2) {
  if (!lang1 || !lang2) return false;

  const n1 = normalizeLanguageCode(lang1);
  const n2 = normalizeLanguageCode(lang2);

  return n1 === n2;
}

function normalizeLanguageCode(lang) {
  const lower = String(lang).toLowerCase();
  const languageMap = {
    "zh": "zh-cn",
    "zh-hans": "zh-cn",
    "zh-hant": "zh-tw",
    "zh-cn": "zh-cn",
    "zh-sg": "zh-cn",
    "zh-tw": "zh-tw",
    "zh-hk": "zh-tw",
    "zh-mo": "zh-tw",
  };

  if (languageMap[lower]) {
    return languageMap[lower];
  }

  return lower.split("-")[0];
}
function showTooltip(content, range) {
  if (!tooltip || !content) {
    return;
  }

  lastTooltipContent = content;
  tooltip.setContent(content);
  tooltip.setProps({
    getReferenceClientRect: () => getRangeRect(range),
  });
  tooltip.show();
}
function getRangeRect(range) {
  if (!range) {
    return emptyClientRect();
  }

  try {
    const rect = range.getBoundingClientRect();
    if (rect && (rect.width || rect.height)) {
      return rect;
    }

    const firstRect = range.getClientRects?.()[0];
    if (firstRect) {
      return firstRect;
    }
  } catch (error) {
    log("Error getting range rect:", error);
  }

  return emptyClientRect();
}

function emptyClientRect() {
  return {
    width: 0,
    height: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

function handleKeyDown(e) {
  keyDownList[e.code] = true;
}

function handleKeyUp(e) {
  keyDownList[e.code] = false;
}

log("ContentScript loaded");








