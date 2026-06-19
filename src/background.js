// Background service worker
import browser from "webextension-polyfill";
import { translate } from "./translator/translateCaller.js";
import SettingUtil from "./util/setting_util.js";
import { createDefaultData, defaultData } from "./util/setting_default.js";

let setting;

(async function backgroundInit() {
  try {
    await getSetting();
    addMessageListener();
    addStorageChangeListener();
  } catch (error) {
    return;
  }
})();

async function getSetting() {
  setting = await SettingUtil.loadSetting();
}

function applySettingChanges(changes) {
  if (!setting) {
    setting = createDefaultData();
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
}

function addStorageChangeListener() {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      applySettingChanges(changes);
    }
  });
}

function makeBrokenTranslateResponse(error, request) {
  return {
    targetText: "",
    transliteration: "",
    sourceLang: request?.data?.sourceLang || "auto",
    targetLang: request?.data?.targetLang || "en",
    isBroken: true,
    error: error?.message || String(error),
  };
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    (async () => {
      try {
        if (!setting) {
          await getSetting();
        }

        if (request.type === "translate") {
          const translatedResult = await translate(request.data, setting);
          sendResponse(translatedResult);
        } else if (request.type === "resetSetting") {
          setting = await SettingUtil.resetSetting();
          sendResponse({ success: true });
        } else if (request.type === "importSetting") {
          setting = await SettingUtil.importSetting(request.data);
          sendResponse({ success: true });
        } else if (request.type === "exportSetting") {
          const settingData = await SettingUtil.exportSetting();
          sendResponse({ settingData });
        } else {
          sendResponse({ error: "Unknown message type: " + request.type });
        }
      } catch (error) {
        if (request?.type === "translate") {
          sendResponse(makeBrokenTranslateResponse(error, request));
        } else {
          sendResponse({ success: false, error: error?.message || String(error) });
        }
      }
    })();
    return true;
  });
}


