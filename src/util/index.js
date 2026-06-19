export function extractTextFromRange(range) {
  if (!range) return "";
  try {
    return range.toString().trim();
  } catch (error) {
    return "";
  }
}
