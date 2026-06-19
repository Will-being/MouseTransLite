// Text selection detection
import { debounce } from "lodash";

let textDetectTime = 300;

export function enableSelectionEndEvent(_window = window, detectTime) {
  textDetectTime = detectTime || 300;
  const targetDocument = _window.document || document;

  const triggerSelectionEndWithDelay = debounce(() => {
    const text = getSelectionText(_window);
    if (text) {
      triggerSelectionEnd(text, targetDocument);
    }
  }, textDetectTime);

  const handleSelectionChange = () => {
    triggerSelectionEndWithDelay();
  };

  const handleMouseUp = () => {
    triggerSelectionEndWithDelay();
  };

  targetDocument.addEventListener("selectionchange", handleSelectionChange);
  targetDocument.addEventListener("mouseup", handleMouseUp);

  return () => {
    targetDocument.removeEventListener("selectionchange", handleSelectionChange);
    targetDocument.removeEventListener("mouseup", handleMouseUp);
    triggerSelectionEndWithDelay.cancel?.();
  };
}

function triggerSelectionEnd(text, targetDocument = document) {
  const evt = new CustomEvent("selectionEnd", {
    bubbles: true,
    cancelable: false,
  });
  evt.selectionText = text;
  targetDocument.dispatchEvent(evt);
}

export function getSelectionText(_window = window) {
  const selection = _window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return "";
  }

  const text = selection.toString().trim();
  return text;
}

export function getSelectionRange(_window = window) {
  const selection = _window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  return selection.getRangeAt(0).cloneRange();
}
