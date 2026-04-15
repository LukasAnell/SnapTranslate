import Tesseract from "../vendor/tesseract/tesseract.esm.min.js";

const {createWorker} = Tesseract;

const workerOptions = {
    workerPath: chrome.runtime.getURL("src/vendor/tesseract/worker.min.js"),
    corePath: chrome.runtime.getURL("src/vendor/tesseract/tesseract-core.wasm.js"),
    langPath: chrome.runtime.getURL("src/vendor/tesseract/lang-data")
};

const SCRIPT_TO_LANGS = {
    Latin: ["eng", "spa", "fra", "deu", "ita", "por", "nld"],
    Cyrillic: ["rus", "ukr", "bul"],
    Han: ["chi_sim", "chi_tra"],
    Arabic: ["ara"],
    Devanagari: ["hin"],
    Japanese: ["jpn"],
    Korean: ["kor"]
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "capture-tab") {
        chrome.tabs.captureVisibleTab(sender.tab.windowId, {format: "png"}, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error("Error capturing tab:", chrome.runtime.lastError);
                sendResponse({error: chrome.runtime.lastError.message});
                return;
            }
            sendResponse({imageData: dataUrl});
        });
        return true;
    }

    if (msg && msg.action === "process-image") {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: "ocr-image", imageData: msg.imageData
        }, (resp) => {
            if (chrome.runtime.lastError) {
                sendResponse({error: chrome.runtime.lastError.message});
                return;
            }
            sendResponse(resp);
        });

        /*
        chrome.storage.local.get(['deeplApiKey'], async (result) => {
            const apiKey = result.deeplApiKey;
            if (!apiKey) {
                sendResponse({error: 'API key not configured. Please set it in extension settings.'});
                return;
            }

            try {
                const response = await fetch('https://api-free.deepl.com/v2/translate', {
                    method: 'POST', headers: {
                        'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded'
                    }, body: new URLSearchParams({
                        text: msg.imageText,  // OCR text from image
                        target_lang: 'EN'
                    })
                });

                const data = await response.json();
                sendResponse({translation: data});
            } catch (error) {
                sendResponse({error: error.message});
            }
        });
         */

        return true;
    }
});

async function tesseractOCR(imageData) {
    const osdWorker = await createWorker("osd", 1, workerOptions);
    let script = "Unknown";

    try {
        const detectRes = await osdWorker.detect(imageData);
        script = detectRes?.data?.script || "Unknown";
    } catch (err) {
        console.warn("Script detection failed, falling back to English OCR:", err);
    } finally {
        await osdWorker.terminate();
    }

    const candidates = SCRIPT_TO_LANGS[script] || ["eng"];
    const langString = candidates.join("+");

    const ocrWorker = await createWorker(langString, 1, workerOptions);

    try {
        const {data: {text, confidence}} = await ocrWorker.recognize(imageData);

        return {
            text: (text || "").trim(), confidence: confidence ?? 0, script, langUsed: langString
        };
    } finally {
        await ocrWorker.terminate();
    }
}
