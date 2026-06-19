import ky from "ky";
import BaseTranslator from "./baseTranslator.js";

const API_ENDPOINTS = [
  "https://translate.googleapis.com/translate_a/single",
  "https://translate.google.com/translate_a/single",
  "https://clients5.google.com/translate_a/t"
];

export default class Google extends BaseTranslator {
  static async requestTranslate(text, sourceLang, targetLang, settings) {
    const params =
      new URLSearchParams({
        client: "gtx",
        q: text,
        sl: sourceLang,
        tl: targetLang,
        dj: 1,
        hl: targetLang,
      }).toString() + "&dt=rm&dt=bd&dt=t";

    let lastError = null;
    for (const apiUrl of API_ENDPOINTS) {
      try {
        return await ky(`${apiUrl}?${params}`, {
          timeout: 10000,
          retry: {
            limit: 2,
            methods: ["get"],
            statusCodes: [408, 413, 429, 500, 502, 503, 504]
          }
        }).json();
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`Google Translate API failed: ${lastError?.message || "Unknown error"}`);
  }

  static async wrapResponse(res, text, sourceLang, targetLang) {
    if (!res) {
      throw new Error("Empty response from Google Translate");
    }

    let targetText = "";
    if (res.sentences && Array.isArray(res.sentences)) {
      targetText = res.sentences
        .map((sentence) => sentence?.trans)
        .filter((trans) => trans)
        .join(" ");
    }

    if (!targetText) {
      throw new Error("Empty translation result from Google");
    }

    const transliteration = res.sentences
      ?.map((sentence) => sentence?.src_translit)
      .filter((translit) => translit)
      .join(" ")
      ?.trim() || "";

    let dict = "";
    if (res.dict && Array.isArray(res.dict)) {
      dict = res.dict
        .map(
          (entry) =>
            `${entry.pos}: ${entry.terms?.slice(0, 3).join(", ") || ""}`
        )
        .join("\n");
    }

    return {
      targetText,
      sourceLang: res.src || sourceLang,
      targetLang,
      transliteration,
      dict,
    };
  }
}
