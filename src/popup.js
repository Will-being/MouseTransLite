// Simple popup without Vue - Pure JavaScript
import { createDefaultData } from "./util/setting_default.js";
(function() {
  'use strict';

  // Use whichever WebExtension API object this browser exposes.
  const browser = globalThis.browser || globalThis.chrome;
  let isLoadingSettings = false;

  // Default settings
  const defaultSettings = createDefaultData();
  // Load settings
  async function loadSettings() {
    try {
      isLoadingSettings = true;
      const settings = await browser.storage.local.get(defaultSettings);

      // Populate form fields
      document.getElementById('translateSource').value = settings.translateSource || 'auto';
      document.getElementById('translateTarget').value = settings.translateTarget || 'en';
      document.getElementById('translatorVendor').value = settings.translatorVendor || 'google';
      document.getElementById('translateWhen').value = settings.translateWhen || 'mouseoverselect';
      document.getElementById('mouseoverTextType').value = settings.mouseoverTextType || 'sentence';
      document.getElementById('tooltipFontSize').value = settings.tooltipFontSize || '18';
      document.getElementById('mouseoverEventInterval').value = settings.mouseoverEventInterval || '300';
      document.getElementById('bingApiKey').value = settings.bingApiKey || '';
      document.getElementById('bingRegion').value = settings.bingRegion || '';

      // Advanced fields
      document.getElementById('showTooltipWhen').value = settings.showTooltipWhen || 'always';
      document.getElementById('tooltipPosition').value = settings.tooltipPosition || 'follow';
      document.getElementById('tooltipWidth').value = settings.tooltipWidth || '300';
      document.getElementById('langExcludeList').value =
        Array.isArray(settings.langExcludeList) ? settings.langExcludeList.join(', ') : '';

      // Handle exclude list
      const excludeList = settings.websiteExcludeList || [];
      document.getElementById('websiteExcludeList').value = excludeList.join('\n');

      // Show/hide Bing API Key field based on selected translator
      const bingApiKeyGroup = document.getElementById('bingApiKeyGroup');
      if (settings.translatorVendor === 'bing') {
        bingApiKeyGroup.style.display = 'block';
      } else {
        bingApiKeyGroup.style.display = 'none';
      }
    } catch (error) {
      showStatus('Error loading settings: ' + error.message, 'error');
    } finally {
      isLoadingSettings = false;
    }
  }
  // Save settings
  async function saveSettings() {
    try {
      const excludeText = document.getElementById('websiteExcludeList').value;
      const excludeList = excludeText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse comma-separated language exclusion list into a clean array
      const langExcludeRaw = document.getElementById('langExcludeList').value;
      const langExcludeList = langExcludeRaw
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const settings = {
        translateSource: document.getElementById('translateSource').value,
        translateTarget: document.getElementById('translateTarget').value,
        translatorVendor: document.getElementById('translatorVendor').value,
        translateWhen: document.getElementById('translateWhen').value,
        mouseoverTextType: document.getElementById('mouseoverTextType').value,
        tooltipFontSize: document.getElementById('tooltipFontSize').value,
        mouseoverEventInterval: document.getElementById('mouseoverEventInterval').value,
        websiteExcludeList: excludeList,
        bingApiKey: document.getElementById('bingApiKey').value.trim(),
        bingRegion: document.getElementById('bingRegion').value.trim(),
        // Advanced settings (now exposed in the UI)
        showTooltipWhen: document.getElementById('showTooltipWhen').value,
        tooltipPosition: document.getElementById('tooltipPosition').value,
        tooltipWidth: document.getElementById('tooltipWidth').value.trim() || '300',
        langExcludeList: langExcludeList
      };

      await browser.storage.local.set(settings);
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error');
    }
  }

  // Export settings
  async function exportSettings() {
    try {
      const settings = await browser.storage.local.get(defaultSettings);
      const exportedSettings = { ...defaultSettings, ...settings };
      if (exportedSettings.bingApiKey) {
        exportedSettings.bingApiKey = '[REDACTED]';
      }
      const dataStr = JSON.stringify(exportedSettings, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'translator-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('Settings exported!', 'success');
    } catch (error) {
      showStatus('Error exporting settings: ' + error.message, 'error');
    }
  }
  // Reset settings
  async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      await browser.storage.local.clear();
      await browser.storage.local.set(defaultSettings);
      await loadSettings();
      showStatus('Settings reset to defaults!', 'success');
    } catch (error) {
      showStatus('Error resetting settings: ' + error.message, 'error');
    }
  }

  // Show status message
  function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {

    // Load settings
    await loadSettings();

    // Event listeners
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('exportBtn').addEventListener('click', exportSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);

    // Show/hide Bing API Key field when translator vendor changes
    document.getElementById('translatorVendor').addEventListener('change', (e) => {
      const bingApiKeyGroup = document.getElementById('bingApiKeyGroup');
      if (e.target.value === 'bing') {
        bingApiKeyGroup.style.display = 'block';
      } else {
        bingApiKeyGroup.style.display = 'none';
      }
    });

    // Help link for API key
    document.getElementById('showApiKeyHelp').addEventListener('click', (e) => {
      e.preventDefault();
      const helpText = `How to get FREE Microsoft Translator API Key:

1. Visit Azure Portal: https://portal.azure.com
2. Create a "Translator" resource (choose Free F0 tier)
3. After creation, go to "Keys and Endpoint"
4. Copy either Key 1 or Key 2
5. Paste it here and save

Free tier includes:
- 2 million characters per month
- No credit card required
- Sufficient for personal use`;
      alert(helpText);
    });

    // Auto-save on change
    const formElements = document.querySelectorAll('select, input, textarea');
    formElements.forEach(el => {
      el.addEventListener('change', () => {
        if (!isLoadingSettings) {
          saveSettings();
        }
      });
    });
  });

})();











