// Simplified language list - core languages only
export const langList = {
  English: "en",
  Chinese_Simplified: "zh-CN",
  Chinese_Traditional: "zh-TW",
  Japanese: "ja",
  Korean: "ko",
  Spanish: "es",
  French: "fr",
  German: "de",
  Russian: "ru",
  Portuguese: "pt",
  Italian: "it",
  Arabic: "ar",
  Hindi: "hi",
  Turkish: "tr",
  Vietnamese: "vi",
  Thai: "th",
  Indonesian: "id",
  Polish: "pl",
  Dutch: "nl",
  Swedish: "sv",
  Danish: "da",
  Norwegian: "no",
  Finnish: "fi",
  Czech: "cs",
  Greek: "el",
  Hebrew: "he",
  Romanian: "ro",
  Hungarian: "hu",
  Ukrainian: "uk",
};

const rtlLangList = ["ar", "he", "fa", "ur", "yi"];

const languageAliases = {
  zh: "zh-CN",
  "zh-hans": "zh-CN",
  "zh-cn": "zh-CN",
  "zh-sg": "zh-CN",
  "zh-hant": "zh-TW",
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "zh-mo": "zh-TW",
};

const bingLangMap = {
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
};

const appLangMap = Object.fromEntries(
  Object.entries(bingLangMap).map(([appLang, providerLang]) => [providerLang.toLowerCase(), appLang])
);

export function normalizeLanguageCode(lang) {
  const lower = String(lang || "").toLowerCase();

  if (!lower) {
    return "";
  }

  return languageAliases[lower] || lower.split("-")[0];
}

export function isSameLanguage(lang1, lang2) {
  const normalizedLang1 = normalizeLanguageCode(lang1);
  const normalizedLang2 = normalizeLanguageCode(lang2);

  return !!normalizedLang1 &&
    !!normalizedLang2 &&
    normalizedLang1.toLowerCase() === normalizedLang2.toLowerCase();
}

export function toBingLanguageCode(lang) {
  if (!lang || lang === "auto") {
    return lang;
  }

  return bingLangMap[normalizeLanguageCode(lang)] || lang;
}

export function fromBingLanguageCode(lang) {
  return appLangMap[String(lang || "").toLowerCase()] || normalizeLanguageCode(lang);
}

export function getRtlDir(lang) {
  return rtlLangList.includes(normalizeLanguageCode(lang)) ? "rtl" : "ltr";
}
