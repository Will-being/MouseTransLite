import translator from "./index.js";
import TextUtil from "../util/text_util.js";

let setting = {};

export async function translate(
  { text, sourceLang, targetLang, engine },
  currentSetting
) {
  setting = currentSetting || setting;
  const engineName = engine || setting["translatorVendor"] || "google";

  // Filter text
  const filteredText = TextUtil.filterWord(text);
  if (!filteredText) {
    return null;
  }

  // Translate
  const translatorEngine = translator[engineName];
  if (!translatorEngine) {
    return null;
  }

  const response = await translatorEngine.translate(
    filteredText,
    sourceLang === "auto" ? "auto" : sourceLang,
    targetLang,
    setting
  );

  if (!response) {
    return {
      targetText: `Translation failed`,
      transliteration: "",
      sourceLang,
      targetLang,
      isBroken: true,
      text: filteredText,
    };
  }

  return response;
}
