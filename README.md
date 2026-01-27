# SnapTranslate

A Chrome/Edge browser extension that enables interactive screen region selection. In the future, will have image processing and translation capabilities.

## What It Does

This extension allows users to:

1. **Select any rectangular region on a webpage** - Click the extension icon and drag to select an area
2. **Visual feedback** - See a blue dashed rectangle with semi-transparent overlay as you drag
3. **Capture coordinates** - Sends the selected region's viewport coordinates to the background service worker

## Planned Features

- **Image capture/cropping** - Extract the selected region as an image
- **OCR** - Detect and extract text from the captured image
- **Translation** - Translate detected text to other languages

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
5. Select the `SnapTranslate` folder

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
