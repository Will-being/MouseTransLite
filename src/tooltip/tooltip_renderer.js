import tippy, { hideAll as hideAllTippy } from "tippy.js";
import { getRtlDir } from "../util/lang.js";

export function createTooltipRenderer(targetDocument = document) {
  let tooltip;
  let tooltipContainer;
  let styleElement;
  let lastContent = "";

  function ensureEnvironment(setting) {
    if (tooltipContainer?.isConnected) {
      return;
    }

    tooltipContainer = targetDocument.createElement("div");
    tooltipContainer.id = "mousetooltip-container";
    tooltipContainer.style.cssText = "position: fixed; top: 0; left: 0; z-index: 999999;";
    targetDocument.body.appendChild(tooltipContainer);

    tooltip = tippy(tooltipContainer, {
      content: "",
      allowHTML: true,
      interactive: true,
      trigger: "manual",
      hideOnClick: false,
      theme: "custom",
      placement: "top-start",
      followCursor: setting["tooltipPosition"] === "follow",
      getReferenceClientRect: () => emptyClientRect(),
    });
  }

  function applyStyle(setting) {
    const fontSize = setting["tooltipFontSize"] || "18";
    const width = setting["tooltipWidth"] || "300";

    if (!styleElement) {
      styleElement = targetDocument.createElement("style");
      styleElement.id = "mousetooltip-style";
      targetDocument.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .tippy-box[data-theme~="custom"] {
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: ${fontSize}px;
        max-width: ${width}px;
        padding: 10px;
        border-radius: 8px;
        z-index: 999999;
      }
      .tippy-box[data-theme~="custom"] .tippy-content {
        padding: 0;
      }
      .tippy-arrow {
        color: rgba(0, 0, 0, 0.8);
      }
      .tooltip-source {
        opacity: 0.7;
        font-size: 0.9em;
        margin-bottom: 5px;
      }
      .tooltip-target {
        font-weight: bold;
      }
      .tooltip-dict {
        margin-top: 8px;
        font-size: 0.85em;
        opacity: 0.8;
      }
    `;

    tooltip?.setProps({
      followCursor: setting["tooltipPosition"] === "follow",
    });
  }

  function show(content, range) {
    if (!tooltip || !content) {
      return;
    }

    lastContent = content;
    tooltip.setContent(content);
    tooltip.setProps({
      getReferenceClientRect: () => getRangeRect(range),
    });
    tooltip.show();
  }

  function destroy() {
    tooltip?.destroy();
    tooltip = null;
    tooltipContainer?.remove();
    tooltipContainer = null;
    styleElement?.remove();
    styleElement = null;
    lastContent = "";
  }

  function containsTarget(target) {
    const tippyBox = targetDocument.querySelector('.tippy-box[data-theme~="custom"]');
    return !!(tippyBox && tippyBox.contains(target));
  }

  return {
    ensureEnvironment,
    applyStyle,
    show,
    destroy,
    containsTarget,
    hideAll: () => hideAllTippy(),
    isVisible: () => !!tooltip?.state?.isVisible,
    getLastContent: () => lastContent,
  };
}

export function buildTooltipContent(result, sourceText) {
  const { targetText, transliteration, dict, targetLang } = result;
  const direction = getRtlDir(targetLang);

  let html = `<div dir="${direction}">`;
  html += `<div class="tooltip-source">${escapeHtml(sourceText || "")}</div>`;
  html += `<div class="tooltip-target">${escapeHtml(targetText || sourceText || "")}</div>`;

  if (transliteration) {
    html += `<div class="tooltip-dict">${escapeHtml(transliteration)}</div>`;
  }

  if (dict) {
    html += `<div class="tooltip-dict">${escapeHtml(dict)}</div>`;
  }

  html += "</div>";
  return html;
}

export function getRangeRect(range) {
  if (!range) {
    return emptyClientRect();
  }

  try {
    const rect = range.getBoundingClientRect();
    if (rect && (rect.width || rect.height)) {
      return rect;
    }

    const firstRect = range.getClientRects?.()[0];
    if (firstRect) {
      return firstRect;
    }
  } catch (error) {
    return emptyClientRect();
  }

  return emptyClientRect();
}

export function emptyClientRect() {
  return {
    width: 0,
    height: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

function escapeHtml(text) {
  if (text === undefined || text === null) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
