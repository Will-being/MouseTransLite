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

export const langListOpposite = Object.fromEntries(
  Object.entries(langList).map(([key, value]) => [value, key])
);

export const rtlLangList = ["ar", "he", "fa", "ur", "yi"];

export function isRtl(lang) {
  return rtlLangList.includes(lang);
}

export function getRtlDir(lang) {
  return isRtl(lang) ? "rtl" : "ltr";
}
