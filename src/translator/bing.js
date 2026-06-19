import ky from "ky";
import BaseTranslator from "./baseTranslator.js";

const BING_LANG_MAP = {
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
};

function toBingLang(lang) {
  if (!lang || lang === "auto") {
    return lang;
  }

  return BING_LANG_MAP[lang] || lang;
}

function fromBingLang(lang) {
  const reverseMap = Object.fromEntries(
    Object.entries(BING_LANG_MAP).map(([appLang, bingLang]) => [bingLang.toLowerCase(), appLang])
  );

  return reverseMap[String(lang).toLowerCase()] || lang;
}

export default class Bing extends BaseTranslator {
  static async requestTranslate(text, sourceLang, targetLang, settings) {
    const apiKey = settings?.bingApiKey?.trim();

    if (!apiKey) {
      throw new Error("Bing Translator requires an API key.");
    }

    const endpoint = "https://api.cognitive.microsofttranslator.com";
    const path = "/translate";
    const apiVersion = "3.0";
    const bingSourceLang = toBingLang(sourceLang);
    const bingTargetLang = toBingLang(targetLang === "auto" ? "en" : targetLang);

    const params = new URLSearchParams({
      "api-version": apiVersion,
      "to": bingTargetLang,
    });

    if (bingSourceLang !== "auto") {
      params.append("from", bingSourceLang);
    }

    const headers = {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    };

    const region = settings?.bingRegion?.trim();
    if (region) {
      headers["Ocp-Apim-Subscription-Region"] = region;
    }

    return await ky.post(`${endpoint}${path}?${params.toString()}`, {
      json: [{ text }],
      headers,
      timeout: 10000,
    }).json();
  }

  static async wrapResponse(res, text, sourceLang, targetLang) {
    if (!res || !Array.isArray(res) || !res[0]) {
      throw new Error("Invalid response from Microsoft Translator API");
    }

    const translationObj = res[0];
    const translations = translationObj.translations;

    if (!translations || !translations[0]) {
      throw new Error("No translation text in response");
    }

    const targetText = translations[0].text;
    const detectedLang = fromBingLang(translationObj.detectedLanguage?.language || sourceLang);

    if (!targetText) {
      throw new Error("Empty translation text");
    }

    return {
      targetText,
      sourceLang: detectedLang,
      targetLang,
      transliteration: "",
      dict: "",
    };
  }
}
