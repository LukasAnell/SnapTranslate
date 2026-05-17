import Tesseract from "../vendor/tesseract/tesseract.esm.min.js";

const { createWorker } = Tesseract;

const workerOptions = {
    workerPath: chrome.runtime.getURL("src/vendor/tesseract/worker.min.js"),
    corePath: chrome.runtime.getURL("src/vendor/tesseract/tesseract-core.wasm.js"),
    langPath: chrome.runtime.getURL("src/vendor/tesseract/lang-data"),
};

const SCRIPT_TO_LANGS = {
    Latin: ["eng", "spa", "fra", "deu", "ita", "por", "nld"],
    Cyrillic: ["rus", "ukr", "bul"],
    Han: ["chi_sim", "chi_tra"],
    Arabic: ["ara"],
    Devanagari: ["hin"],
    Japanese: ["jpn"],
    Korean: ["kor"],
};

async function tesseractOCR(imageData) {
    const osdWorker = await createWorker("osd", 1, workerOptions);
    let script = "Unknown";

    try {
        const detectRes = await osdWorker.detect(imageData);
        script = detectRes?.data?.script || "Unknown";
    } catch (err) {
        console.warn(
            "Script detection failed, falling back to English OCR:",
            err,
        );
    } finally {
        await osdWorker.terminate();
    }

    const candidates = SCRIPT_TO_LANGS[script] || ["eng"];
    const langString = candidates.join("+");

    const ocrWorker = await createWorker(langString, 1, workerOptions);

    try {
        const {
            data: { text, confidence },
        } = await ocrWorker.recognize(imageData);

        return {
            text: (text || "").trim(),
            confidence: confidence ?? 0,
            script,
            langUsed: langString,
        };
    } finally {
        await ocrWorker.terminate();
    }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "offscreen-ocr") {
        (async () => {
            try {
                const ocr = await tesseractOCR(msg.imageData);
                sendResponse({ ocr });
            } catch (error) {
                sendResponse({ error: String(error) });
            }
        })();
        return true;
    }
});
