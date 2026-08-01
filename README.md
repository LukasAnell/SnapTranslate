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

1. Click the extension icon in your browser toolbar.
2. Click the action button in the popup.
3. Your cursor changes to a crosshair.
4. Click and drag to select a rectangular region on the page (`Esc` cancels).
5. Release to capture the selection.
6. The captured region is OCR'd and the extracted text is sent to DeepL for translation.
7. A results box appears near your selection showing the translated text.

---

## Configuration

Each user is expected to supply their own DeepL API key rather than the extension shipping with a shared one. The DeepL free tier is a lifetime 1,000,000-character cap.

Open the extension's **Options** page (right-click the toolbar icon -> Options, or via `chrome://extensions`) to configure:

- **DeepL API key & plan** (Free or Pro)
- **Target translation language** (e.g. `EN-US`, `EN-GB`, `PT-PT`)
- **OCR languages**: which of the vendored Tesseract language packs to load per scan. English is always enabled, and all others can be selected/deselected to speed up OCR.

---

## Planned Features

- **Automated tests**: no test suite exists yet.
- **CI/CD for store updates**: automate future Chrome Web Store version pushes via the Publish API once the extension has an Item ID from its first review.
- **Alternative/local translation option**: explore options that don't require a per-user DeepL API key.
- **Smaller vendored footprint**: currently all Tesseract language packs ship in the package regardless of which are enabled at runtime. On-demand language data fetching could lower this.

---

## Project Structure

```
❯ tree --dirsfirst --gitignore
SnapTranslate/
├── src/
│   ├── background/
│   │   └── background.js      # Service worker for message routing, OCR/translation coordination
│   ├── content/
│   │   └── contentScript.js   # Selection overlay, mouse interactions
│   ├── popup/
│   │   ├── popup.html         # Extension popup UI
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styling (empty for now)
│   ├── offscreen/             # Offscreen document for hosting the Tesseract.js OCR worker
│   ├── options/               # Options page for configuring DeepL API key/plan, target language, and OCR language selection
│   ├── vendor/tesseract/      # Vendored Tesseract.js core, wasm, and per-language .traineddata files
│   └── icons/                 # Extension icons
├── manifest.json              # Extension configuration
├── PRIVACY.md                 # Privacy policy
└── package.json               # Project metadata
```

---

## Technical Details

- **Manifest Version:** 3
- **Permissions:** `activeTab`, `scripting`, `host_permissions` for all URLs
- **OCR:** [Tesseract.js](https://github.com/naptha/tesseract.js), vendored locally and run inside an offscreen document
- **Translation:** [DeepL API](https://www.deepl.com/docs-api) (user-supplied key)
- **Components:**
  * `popup.js` - triggers selection mode
  * `contentScript.js` - handles the selection overlay and mouse interactions
  * `background.js` - service worker for message routing and OCR/translation coordination
  * `offscreen.js` - hosts the Tesseract.js worker
  * `options.js` - DeepL API key/plan and language configuration

---

## Installation

1. Clone or download this repository.
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the `SnapTranslate` folder (the root directory).
6. Open the extension's Options page and enter your DeepL API key before translating.

---

## Development Status

**Feature-complete for v1.** The full selection -> capture -> OCR -> translation pipeline is implemented and merged into `master`, including a configurable target language, configurable OCR languages, and a results box with loading/error states.

---

## Notes

- The extension cannot run on browser internal pages (e.g., `chrome://extensions`, `chrome://settings`, Chrome Web Store).
- For best results, use on regular websites.
- If the extension doesn't work immediately after installation, refresh the webpage.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See the [LICENSE](LICENSE) file for full license text.
