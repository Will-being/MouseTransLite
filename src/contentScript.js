// Main content script - orchestrates hover/selection translation runtime.
import browser from "webextension-polyfill";
import { debounce } from "./util/debounce.js";
import TextUtil from "./util/text_util.js";
import SettingUtil from "./util/setting_util.js";
import { applySettingChanges } from "./util/setting_util.js";
import { isSameLanguage } from "./util/lang.js";
import { isUrlExcluded } from "./util/exclusion_matcher.js";
import {
  createTooltipRenderer,
  buildTooltipContent,
} from "./tooltip/tooltip_renderer.js";
import {
  enableSelectionEndEvent,
  getSelectionRange,
} from "./event/selection.js";
import {
  enableMouseoverTextEvent,
} from "./event/mouseover.js";
import * as util from "./util/dom.js";

let setting;
let keyDownList = { always: true };
let selectedText = "";
let prevTooltipText = "";
let activeTranslateRequestId = 0;
let currentHoverText = "";
let currentHoverRange = null;
let eventCleanups = [];
let initialized = false;
let isExcluded = false;

const tooltipRenderer = createTooltipRenderer();

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

    ensureTooltipRuntime();
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

  applySettingChanges(setting, changes);
  reloadRuntimeFromSettings();
}

function reloadRuntimeFromSettings() {
  activeTranslateRequestId += 1;
  prevTooltipText = "";
  currentHoverText = "";
  currentHoverRange = null;
  tooltipRenderer.hideAll();

  if (checkExcludeUrl()) {
    isExcluded = true;
    destroyTooltipRuntime();
    return;
  }

  isExcluded = false;
  ensureTooltipRuntime();
  loadEventListener();
  initialized = true;
}

function ensureTooltipRuntime() {
  tooltipRenderer.ensureEnvironment(setting);
  tooltipRenderer.applyStyle(setting);
}

function checkExcludeUrl() {
  const excludeList = setting?.["websiteExcludeList"] || [];
  return isUrlExcluded(window.location.href, excludeList, (pattern) => {
    log("URL excluded by pattern:", pattern);
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

  const debouncedHideAll = debounce(() => tooltipRenderer.hideAll(), 100);
  window.addEventListener("scroll", debouncedHideAll);
  eventCleanups.push(() => {
    window.removeEventListener("scroll", debouncedHideAll);
    debouncedHideAll.cancel?.();
  });

  const handleClick = (e) => {
    if (tooltipRenderer.containsTarget(e.target)) {
      return;
    }
    tooltipRenderer.hideAll();
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
  tooltipRenderer.destroy();
  initialized = false;
}

async function onMouseoverText(e) {
  const { mouseoverText, mouseoverRange } = e.mouseoverText || {};

  currentHoverText = TextUtil.trimAllSpace(mouseoverText || "");
  currentHoverRange = mouseoverRange || null;

  if (!currentHoverText || !checkShowTooltip() || isExcluded) {
    tooltipRenderer.hideAll();
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
  tooltipRenderer.hideAll();
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
    tooltipRenderer.hideAll();
    return;
  }

  if (cleanText === prevTooltipText && tooltipRenderer.isVisible()) {
    tooltipRenderer.show(tooltipRenderer.getLastContent(), range);
    return;
  }

  prevTooltipText = cleanText;
  const requestId = ++activeTranslateRequestId;

  const sourceLang = setting["translateSource"] || "auto";
  const targetLang = setting["translateTarget"] || "en";

  if (sourceLang !== "auto" && isSameLanguage(sourceLang, targetLang)) {
    tooltipRenderer.hideAll();
    return;
  }

  const textForTranslation = TextUtil.redactSensitiveText(cleanText);
  if (!textForTranslation || textForTranslation.trim() === "") {
    tooltipRenderer.hideAll();
    return;
  }

  try {
    const result = await util.requestTranslate(textForTranslation, sourceLang, targetLang);

    if (!isCurrentTranslateRequest(requestId, requestContext)) {
      return;
    }

    if (!result || result.isBroken) {
      tooltipRenderer.hideAll();
      return;
    }

    if (result.sourceLang && result.targetLang && isSameLanguage(result.sourceLang, result.targetLang)) {
      tooltipRenderer.hideAll();
      return;
    }

    const excludeLangs = setting["langExcludeList"] || [];
    if (result.sourceLang && excludeLangs.includes(result.sourceLang)) {
      tooltipRenderer.hideAll();
      return;
    }

    if (!result.targetText || result.targetText.trim() === "") {
      tooltipRenderer.hideAll();
      return;
    }

    tooltipRenderer.show(buildTooltipContent(result, textForTranslation), range);
  } catch (error) {
    tooltipRenderer.hideAll();
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

function handleKeyDown(e) {
  keyDownList[e.code] = true;
}

function handleKeyUp(e) {
  keyDownList[e.code] = false;
}

log("ContentScript loaded");
