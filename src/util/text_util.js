// Text utility functions
const SENSITIVE_PATTERNS = [
  { pattern: /https?:\/\/[^\s<>()"']+/gi, replacement: "[URL]" },
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[EMAIL]" },
  { pattern: /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b/g, replacement: "[PHONE]" },
  { pattern: /\b\d{15}\b|\b\d{17}[\dXx]\b/g, replacement: "[ID_NUMBER]" },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[ID_NUMBER]" },
  { pattern: /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|bearer|secret|password|passwd|pwd)\s*[:=]\s*[^\s,;]+/gi, replacement: "[SECRET]" },
  { pattern: /\b(?:sk|pk|ghp|gho|ghu|ghs|xox[baprs])-?[A-Za-z0-9_\-]{16,}\b/g, replacement: "[TOKEN]" },
  { pattern: /\b[A-Za-z0-9_\-]{32,}\.[A-Za-z0-9_\-]{16,}\.[A-Za-z0-9_\-]{16,}\b/g, replacement: "[TOKEN]" },
];

const TextUtil = {
  concatJson: function (x, y) {
    return { ...x, ...y };
  },

  copyJson: function (json) {
    return JSON.parse(JSON.stringify(json));
  },

  filterWord: function (word) {
    if (!word || typeof word !== "string") return "";
    if (word.match(/^https?:\/\//)) return "";
    if (word.match(/^[\p{P}\p{S}\p{Z}\p{C}]+$/u)) return "";
    if (word.length > 1000) return "";
    return word;
  },

  trimAllSpace: function (word) {
    return String(word || "").replace(/\s+/g, " ").trim();
  },

  redactSensitiveText: function (word) {
    let redacted = String(word || "");
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, replacement);
    }
    return redacted;
  },
};

export default TextUtil;
