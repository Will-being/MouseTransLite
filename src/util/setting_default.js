import TextUtil from "./text_util.js";
import { langList } from "./lang.js";

const langListWithAuto = TextUtil.concatJson({ Auto: "auto" }, langList);

const keyList = {
  None: "null",
  Ctrl_Left: "ControlLeft",
  Ctrl_Right: "ControlRight",
  Alt_Left: "AltLeft",
  Alt_Right: "AltRight",
  Shift_Left: "ShiftLeft",
  Shift_Right: "ShiftRight",
};

const translatorList = {
  google: "google",
  bing: "bing",
};

const translateActionList = {
  Mouseover: "mouseover",
  Select: "select",
  Both: "mouseoverselect",
};

const detectTypeList = {
  Word: "word",
  Sentence: "sentence",
};

const keyListWithAlways = { ...keyList, Always: "always" };

const tooltipPositionList = {
  Follow: "follow",
  Fixed: "fixed",
};

const DEFAULT_WEBSITE_EXCLUDE_LIST = [
  "*.bankofamerica.com",
  "*.chase.com",
  "*.wellsfargo.com",
  "*.citi.com",
  "*.capitalone.com",
  "*.americanexpress.com",
  "paypal.com",
  "*.paypal.com",
  "*.stripe.com",
  "*.wise.com",
  "*.revolut.com",
  "*.gmail.com",
  "mail.google.com",
  "outlook.live.com",
  "outlook.office.com",
  "*.mail.yahoo.com",
  "mail.proton.me",
  "*.protonmail.com",
  "*.icloud.com",
  "1password.com",
  "*.1password.com",
  "lastpass.com",
  "*.lastpass.com",
  "bitwarden.com",
  "*.bitwarden.com",
  "*.dashlane.com",
  "*.keepersecurity.com",
  "okta.com",
  "*.okta.com",
  "*.auth0.com",
  "*.duosecurity.com",
  "login.microsoftonline.com",
  "*.login.microsoftonline.com",
  "accounts.google.com",
  "*.accounts.google.com",
  "*.github.com/settings/*",
  "*.gitlab.com/-/profile/*",
  "slack.com",
  "*.slack.com",
  "salesforce.com",
  "*.salesforce.com",
  "*.workday.com",
  "*.greenhouse.io",
  "*.bamboohr.com",
  "*.adp.com",
  "*.example.com",
];

function getRangeOption(start, end, step = 1, decimals = 0) {
  const options = {};
  for (let i = start; i < end; i += step) {
    const value = i.toFixed(decimals);
    options[value] = value;
  }
  return options;
}

export const settingDict = {
  translateSource: {
    default: "auto",
    i18nKey: "Translate_From",
    optionList: langListWithAuto,
  },
  translateTarget: {
    default: "en",
    i18nKey: "Translate_Into",
    optionList: langList,
  },
  translatorVendor: {
    default: "google",
    i18nKey: "Translator_Engine",
    optionList: translatorList,
  },
  translateWhen: {
    default: "mouseoverselect",
    i18nKey: "Translate_When",
    optionList: translateActionList,
  },
  mouseoverTextType: {
    default: "sentence",
    i18nKey: "Mouseover_Text_Type",
    optionList: detectTypeList,
  },
  showTooltipWhen: {
    default: "always",
    i18nKey: "Show_Tooltip_When",
    optionList: keyListWithAlways,
  },
  tooltipFontSize: {
    default: "18",
    i18nKey: "Tooltip_Font_Size",
    optionList: getRangeOption(12, 32, 2),
  },
  tooltipWidth: {
    default: "300",
    i18nKey: "Tooltip_Width",
    optionList: getRangeOption(200, 600, 50),
  },
  tooltipPosition: {
    default: "follow",
    i18nKey: "Tooltip_Position",
    optionList: tooltipPositionList,
  },
  mouseoverEventInterval: {
    default: "300",
    i18nKey: "Tooltip_Show_Delay",
    optionList: getRangeOption(100, 1000, 100),
  },
  langExcludeList: {
    default: [],
    i18nKey: "Exclude_Language",
    optionList: langList,
  },
  websiteExcludeList: {
    default: DEFAULT_WEBSITE_EXCLUDE_LIST,
    i18nKey: "Exclude_Website",
    optionList: [],
  },
  bingApiKey: {
    default: "",
    i18nKey: "Bing_API_Key",
    optionList: {},
  },
  bingRegion: {
    default: "",
    i18nKey: "Bing_Region",
    optionList: {},
  },
};

function cloneDefaultValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

export function createDefaultData() {
  return Object.fromEntries(
    Object.entries(settingDict).map(([key, value]) => [key, cloneDefaultValue(value.default)])
  );
}

export const defaultData = createDefaultData();


