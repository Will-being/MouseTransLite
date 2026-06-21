// Mouseover text detection using range
import { debounce } from "../util/debounce.js";
import * as util from "../util/index.js";

let clientX = 0;
let clientY = 0;
let _win = window;
let setting = {};
let currentMouseoverRange = null;
const PARENT_TAGS_TO_EXCLUDE = ["STYLE", "SCRIPT", "TITLE"];

export function enableMouseoverTextEvent(
  _window = window,
  currentSetting,
  keyDownListGetter
) {
  setting = currentSetting;
  _win = _window;

  const targetWindow = _window || window;
  const targetDocument = targetWindow.document || document;
  const textDetectTime = Number(setting?.["mouseoverEventInterval"] || 300);

  const triggerMouseoverTextWithDelay = debounce(async () => {
    triggerMouseoverText(await getMouseoverText(clientX, clientY), targetDocument);
  }, textDetectTime);

  const handleMouseMove = (e) => {
    clientX = e.clientX;
    clientY = e.clientY;

    if (currentMouseoverRange && !checkXYInElement(currentMouseoverRange, clientX, clientY)) {
      triggerMouseLeaveText(targetDocument);
      currentMouseoverRange = null;
    }

    triggerMouseoverTextWithDelay();
  };

  const handleScroll = () => {
    triggerMouseoverTextWithDelay();
  };

  targetWindow.addEventListener("mousemove", handleMouseMove);
  targetWindow.addEventListener("scroll", handleScroll);

  return () => {
    targetWindow.removeEventListener("mousemove", handleMouseMove);
    targetWindow.removeEventListener("scroll", handleScroll);
    triggerMouseoverTextWithDelay.cancel?.();
    currentMouseoverRange = null;
  };
}

function triggerMouseoverText(mouseoverText, targetDocument = document) {
  const evt = new CustomEvent("mouseoverText", {
    bubbles: true,
    cancelable: false,
  });
  evt.mouseoverText = mouseoverText;
  targetDocument.dispatchEvent(evt);
}

function triggerMouseLeaveText(targetDocument = document) {
  const evt = new CustomEvent("mouseLeaveText", {
    bubbles: true,
    cancelable: false,
  });
  targetDocument.dispatchEvent(evt);
}

export async function getMouseoverText(x, y) {
  const mouseoverType = setting["mouseoverTextType"] || "sentence";
  const range = getPointedRange(x, y);
  return getTextFromRange(range, mouseoverType);
}

function getTextFromRange(range, mouseoverType) {
  const output = { mouseoverText: "", mouseoverRange: range };
  const wordRange = expandRange(range, mouseoverType);

  if (wordRange && checkXYInElement(wordRange, clientX, clientY)) {
    output["mouseoverText"] = util.extractTextFromRange(wordRange);
    output["mouseoverRange"] = wordRange;
    currentMouseoverRange = wordRange;
  } else {
    currentMouseoverRange = null;
  }

  return output;
}

function expandRange(range, type) {
  try {
    if (!range || !range.startContainer || !range.startContainer.isConnected) {
      return null;
    }

    const clonedRange = range.cloneRange();

    if (clonedRange.expand) {
      clonedRange.expand(type);
    } else {
      expandRangeManually(clonedRange, type);
    }

    return clonedRange;
  } catch (error) {
    return null;
  }
}

function isWordChar(char) {
  return /[\p{Letter}\p{Number}_]/u.test(char);
}

function isCjkChar(char) {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(char);
}

function expandRangeManually(range, type) {
  const text = range.startContainer.textContent;

  if (typeof text !== "string") {
    return;
  }

  let start = range.startOffset;
  let end = range.endOffset;

  if (type === "word") {
    const pointedChar = text[start] || text[start - 1] || "";
    if (isCjkChar(pointedChar)) {
      if (start === end && end < text.length) {
        end += 1;
      }
    } else {
      while (start > 0 && isWordChar(text[start - 1])) start--;
      while (end < text.length && isWordChar(text[end])) end++;
    }
  } else if (type === "sentence") {
    const sentenceEnd = /[.!?。！？]/;
    const maxExpand = 200;

    while (start > 0 && (range.startOffset - start) < maxExpand && !sentenceEnd.test(text[start - 1])) {
      start--;
    }

    while (end < text.length && (end - range.endOffset) < maxExpand && !sentenceEnd.test(text[end])) {
      end++;
    }
  }

  range.setStart(range.startContainer, start);
  range.setEnd(range.startContainer, end);
}

function getPointedRange(x, y) {
  return (
    caretRangeFromPoint(x, y, _win.document || document) ||
    caretRangeFromPointOnPointedElement(x, y)
  );
}

function caretRangeFromPoint(x, y, _document = document) {
  let range = null;

  if (typeof _document.caretRangeFromPoint === "function") {
    range = _document.caretRangeFromPoint(x, y);
  } else if (typeof _document.caretPositionFromPoint === "function") {
    const caretPos = _document.caretPositionFromPoint(x, y);
    if (!caretPos?.offsetNode) {
      return null;
    }

    range = _document.createRange();
    range.setStart(caretPos.offsetNode, caretPos.offset);
    range.setEnd(caretPos.offsetNode, caretPos.offset);
  }

  if (range?.startContainer?.nodeType !== Node.TEXT_NODE) {
    return null;
  }

  return range;
}

function caretRangeFromPointOnPointedElement(x, y) {
  if (typeof document.elementsFromPoint !== "function") {
    return null;
  }

  const pointedElements = document.elementsFromPoint(x, y);

  const filteredElements = pointedElements.filter(
    (ele) => ele.offsetHeight < 1000 && ele.offsetWidth < 1000
  );

  if (filteredElements.length === 0) {
    return null;
  }

  const textNodes = textNodesUnder(filteredElements[filteredElements.length - 1]);
  return getRangeFromTextNodes(x, y, textNodes);
}

function getRangeFromTextNodes(x, y, textNodes) {
  const ranges = textNodes
    .filter((textNode) => textNode.data.trim())
    .filter((textNode) => checkXYInElement(getTextRange(textNode), x, y))
    .map((textNode) => Array.from(getCharRanges(textNode)))
    .flat();

  const filteredRanges = ranges.filter((range) => checkXYInElement(range, x, y));

  if (filteredRanges.length > 0) {
    return filteredRanges[0];
  }

  return null;
}

function textNodesUnder(el) {
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (PARENT_TAGS_TO_EXCLUDE.includes(node?.parentElement?.nodeName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) {
    nodes.push(n);
  }

  return nodes;
}

function getTextRange(textNode) {
  const range = document.createRange();
  range.setStart(textNode, 0);
  range.setEnd(textNode, textNode.length);
  return range;
}

function getCharRanges(textNode) {
  const ranges = [];
  for (let i = 0; i < textNode.length; i++) {
    const range = document.createRange();
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    ranges.push(range);
  }
  return ranges;
}

function checkXYInElement(ele, x, y) {
  try {
    if (!ele) return false;
    const rect = ele.getBoundingClientRect();
    return !(rect.left > x || rect.right < x || rect.top > y || rect.bottom < y);
  } catch (error) {
    return false;
  }
}





