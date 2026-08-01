# Privacy Policy for SnapTranslate

*Last updated: 2026-08-01*

SnapTranslate is a browser extension that lets you drag-select a region of any webpage,
extracts text from that region using on-device OCR, and translates the extracted text using
the DeepL API. This document explains what data the extension accesses, where it goes, and
what is stored.

## What SnapTranslate accesses

- **A screenshot of your current browser tab**, captured only when you actively start a
  selection and drag a rectangle (via Chrome's `captureVisibleTab` API). The screenshot is
  immediately cropped, in your browser, to just the region you selected. The rest of the
  page is discarded and never leaves your device.
- **The text extracted from that cropped image**, produced locally on your device by an
  on-device OCR engine (Tesseract.js). No image data is sent anywhere for this step.
- **Your DeepL API key and plan (Free/Pro)**, which you enter yourself on the extension's
  options page in order to use the translation feature.
- **Your selected translation-target language and OCR language preferences**, which you
  choose on the options page.

## What gets sent off your device

- Only the **extracted text** from your selection (not the screenshot or image) is sent to
  DeepL's API, along with your API key, in order to translate it. This happens once per
  selection, only when you make one, and only if you have configured a DeepL API key.
- Nothing is sent to SnapTranslate's developer or any server operated by us — we do not run
  any backend. The only third party involved is DeepL, which you connect to directly using
  your own API key.
- Screenshots and cropped images are never uploaded anywhere. OCR runs entirely locally in
  your browser.

## What gets stored, and where

- Your DeepL API key, plan, target language, and OCR language preferences are stored using
  `chrome.storage.local`. This data stays on your device and is not synced to any
  SnapTranslate server, because none exists.
- Selections, screenshots, extracted text, and translations are **not stored or logged**
  anywhere by the extension. Each selection is processed and shown to you, then discarded
  once the results box is closed.

## Third-party services

- **DeepL** (https://www.deepl.com) receives the text you select for translation, along with
  your API key, directly from your browser. Your use of DeepL is subject to
  [DeepL's own privacy policy](https://www.deepl.com/privacy). SnapTranslate has no control
  over, and receives no data back from, how DeepL handles that request beyond the
  translation result.
- No other third-party services are used. OCR (Tesseract.js) runs entirely on-device and
  contacts no server.

## Permissions

- `activeTab`, `scripting`, `tabs`, which are needed to draw the selection overlay on the page you're
  viewing, capture the visible tab when you make a selection, and inject the content script
  reliably.
- `<all_urls>` (content script + host permission), as the selection overlay needs to run on
  any page you choose to use it on.
- `storage` — needed to save your DeepL API key and preferences locally.
- `offscreen`, needed to run OCR in a Manifest V3 offscreen document, since Chrome's
  extension service workers can't run the OCR engine directly.

SnapTranslate does not request or use any permissions beyond what's needed for the features
described above, and does not include analytics, ads, or tracking of any kind.

## Changes to this policy

If SnapTranslate's data practices change (e.g. a new translation backend is added, or
usage analytics are introduced), this document will be updated and the "Last updated" date
above will reflect the change.

## Contact

Questions about this policy can be directed via the project's GitHub repository:
https://github.com/LukasAnell/SnapTranslate
