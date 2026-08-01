# SnapTranslate

A Chrome/Edge (Manifest V3) browser extension that lets you drag-select a rectangular region of any webpage, capture it as an image, run OCR on it, and translate the detected text without leaving the page.

---

## What It Does

1. **Select any rectangular region on a webpage**: click the extension icon and drag to select an area.
2. **Visual feedback**: see a blue dashed rectangle with a semi-transparent overlay as you drag.
3. **Capture & OCR**: the selected region is captured as an image and run through Tesseract.js to extract any text it contains.
4. **Translate**: extracted text is sent to the DeepL API and translated into your configured target language.
5. **Results box**: translated text is displayed near your selection, with loading and error states handled along the way.

---

## How It Works

1. Click the extension icon in your browser toolbar
2. Click the action button in the popup
3. Your cursor changes to a crosshair
4. Click and drag to select a rectangular region on the page
5. Release to capture the selection
6. Press `ESC` to cancel selection mode

## Installation

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `SnapTranslate` folder (the root directory)

## Project Structure

```
SnapTranslate/
├── src/
│   ├── background/
│   │   └── background.js      # Service worker
│   ├── content/
│   │   └── contentScript.js   # Content script for page interaction
│   ├── popup/
│   │   ├── popup.html         # Extension popup UI
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styling
│   └── icons/                 # Extension icons
├── manifest.json              # Extension configuration
└── package.json               # Project metadata
```

## Technical Details

- **Manifest Version:** 3
- **Permissions:** `activeTab`, `scripting`, `host_permissions` for all URLs
- **Components:**
  - `popup.js` - Triggers selection mode
  - `contentScript.js` - Handles UI overlay and mouse interactions
  - `background.js` - Service worker for message handling and future processing

## Development Status

**Early Development** - Core selection functionality is implemented. Image processing and translation features are planned for future releases.

## Notes

- The extension cannot run on browser internal pages (e.g., `chrome://extensions`, `chrome://settings`, Chrome Web Store)
- For best results, use on regular websites
- If the extension doesn't work immediately after installation, refresh the webpage

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See the [LICENSE](LICENSE) file for full license text.
