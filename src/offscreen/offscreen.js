import Tesseract from "../vendor/tesseract/tesseract.esm.min.js";

const { createWorker } = Tesseract;

const workerOptions = {
    workerPath: chrome.runtime.getURL("src/vendor/tesseract/worker.min.js"),
    corePath: chrome.runtime.getURL(
        "src/vendor/tesseract/tesseract-core.wasm.js",
    ),
    langPath: chrome.runtime.getURL("src/vendor/tesseract/lang-data"),
    workerBlobURL: false,
    gzip: false,
};

async function tesseractOCR(imageData, ocrLanguages) {
    const langs =
        Array.isArray(ocrLanguages) && ocrLanguages.length > 0
            ? ocrLanguages
            : ["eng"];

    const langString = langs.join("+");

    const ocrWorker = await createWorker(langString, 1, workerOptions);

    try {
        const {
            data: { text, confidence },
        } = await ocrWorker.recognize(imageData);

        return {
            text: (text || "").trim(),
            confidence: confidence ?? 0,
            script: "Unknown",
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
                const ocr = await tesseractOCR(msg.imageData, msg.ocrLanguages);

                sendResponse({ ocr });
            } catch (error) {
                sendResponse({ error: String(error) });
            }
        })();

        return true;
    }
});
