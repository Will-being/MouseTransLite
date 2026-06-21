// Request utilities - send messages to background script
import browser from "webextension-polyfill";

export async function sendMessage(message) {
  if (!browser?.runtime?.sendMessage) {
    throw new Error("Browser runtime not available");
  }

  return await browser.runtime.sendMessage(message);
}

export async function requestTranslate(text, sourceLang, targetLang) {
  try {
    return await sendMessage({
      type: "translate",
      data: { text, sourceLang, targetLang },
    });
  } catch (error) {
    return {
      isBroken: true,
      error: error.message,
      targetText: "",
      sourceLang: sourceLang,
      targetLang: targetLang,
    };
  }
}
