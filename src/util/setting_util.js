import browser from "webextension-polyfill";
import { createDefaultData, defaultData, settingDict } from "./setting_default.js";

function cloneSettings(settings) {
  return Object.fromEntries(
    Object.entries(settings).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value])
  );
}

function isAllowedOption(key, value) {
  const optionList = settingDict[key]?.optionList || {};
  const allowedValues = Object.values(optionList);
  return allowedValues.length === 0 || allowedValues.includes(value);
}

function redactExportedSecrets(settings) {
  const redacted = cloneSettings(settings);
  if (redacted.bingApiKey) {
    redacted.bingApiKey = "[REDACTED]";
  }
  return redacted;
}

function sanitizeArray(value, allowedValues = []) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .filter((item) => allowedValues.length === 0 || allowedValues.includes(item));
}

function sanitizeWebsiteExcludeList(value) {
  return sanitizeArray([
    ...defaultData.websiteExcludeList,
    ...(Array.isArray(value) ? value : []),
  ]);
}

export function sanitizeSettingData(settingData = {}) {
  const sanitized = createDefaultData();

  for (const [key, value] of Object.entries(settingData || {})) {
    if (!Object.prototype.hasOwnProperty.call(defaultData, key)) {
      continue;
    }

    if (key === "websiteExcludeList") {
      sanitized[key] = sanitizeWebsiteExcludeList(value);
    } else if (key === "langExcludeList") {
      sanitized[key] = sanitizeArray(value, Object.values(settingDict.langExcludeList.optionList));
    } else if (key === "bingApiKey") {
      const secretValue = typeof value === "string" ? value.trim() : "";
      sanitized[key] = secretValue === "[REDACTED]" ? defaultData[key] : secretValue;
    } else if (key === "bingRegion") {
      sanitized[key] = typeof value === "string" ? value.trim() : "";
    } else if (typeof defaultData[key] === "string") {
      const stringValue = typeof value === "string" ? value : defaultData[key];
      sanitized[key] = isAllowedOption(key, stringValue) ? stringValue : defaultData[key];
    }
  }

  return sanitized;
}

const SettingUtil = {
  async loadSetting(settingUpdateCallbackFn) {
    const settingData = await browser.storage.local.get(defaultData);
    const setting = sanitizeSettingData(settingData);

    if (settingUpdateCallbackFn) {
      browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local") {
          settingUpdateCallbackFn(changes);
        }
      });
    }

    return setting;
  },

  async resetSetting() {
    const defaults = createDefaultData();
    await browser.storage.local.clear();
    await browser.storage.local.set(defaults);
    return cloneSettings(defaults);
  },

  async importSetting(settingData) {
    const validatedSettings = sanitizeSettingData(settingData);
    await browser.storage.local.clear();
    await browser.storage.local.set(validatedSettings);
    return cloneSettings(validatedSettings);
  },

  async exportSetting() {
    const settingData = await browser.storage.local.get(defaultData);
    return redactExportedSecrets(sanitizeSettingData(settingData));
  },

  getDefaultLang() {
    const navigatorLang = navigator.language || navigator.userLanguage || "en";
    return this.parseLocaleLang(navigatorLang);
  },

  parseLocaleLang(localeLang) {
    const langMap = {
      "zh-CN": "zh-CN",
      "zh-TW": "zh-TW",
      "zh-HK": "zh-TW",
      zh: "zh-CN",
    };

    if (langMap[localeLang]) {
      return langMap[localeLang];
    }

    const baseLang = String(localeLang || "en").split("-")[0];
    return baseLang || "en";
  },
};

export default SettingUtil;



