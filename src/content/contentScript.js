(function () {
    if (window.__snapTranslateContentScriptLoaded) {
        console.debug('SnapTranslate content script already loaded');
        return;
    }
    window.__snapTranslateContentScriptLoaded = true;

    let overlay = null;
    let rectEl = null;
    let selecting = false;
    let startX = 0;
    let startY = 0;

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.action === 'start-selection') {
            console.log('test message - start-selection');
            enterSelectionMode();
        }
        if (msg && msg.action === 'stop-selection') {
            exitSelectionMode();
        }
    });

    function enterSelectionMode() {
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'selection-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', zIndex: '2147483647', cursor: 'crosshair', background: 'rgba(0,0,0,0)'
        });
        document.documentElement.appendChild(overlay);

        rectEl = document.createElement('div');
        Object.assign(rectEl.style, {
            position: 'absolute',
            border: '2px dashed #4a90e2',
            background: 'rgba(74,144,226,0.12)',
            display: 'none',
            pointerEvents: 'none'
        });
        overlay.appendChild(rectEl);

        overlay.addEventListener('mousedown', onMouseDown);
        overlay.addEventListener('mousemove', onMouseMove);
        overlay.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keydown', onKeyDown);
    }

    function exitSelectionMode() {
        if (!overlay) return;

        overlay.removeEventListener('mousedown', onMouseDown);
        overlay.removeEventListener('mousemove', onMouseMove);
        overlay.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('keydown', onKeyDown);

        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
        rectEl = null;
        selecting = false;
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            exitSelectionMode();
        }
    }

    function onMouseDown(e) {
        selecting = true;
        startX = e.clientX;
        startY = e.clientY;
        rectEl.style.left = `${startX}px`;
        rectEl.style.top = `${startY}px`;
        rectEl.style.width = '0px';
        rectEl.style.height = '0px';
        rectEl.style.display = 'block';
    }

    function onMouseMove(e) {
        if (!selecting) return;
        const x = Math.min(e.clientX, startX);
        const y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX);
        const h = Math.abs(e.clientY - startY);
        rectEl.style.left = `${x}px`;
        rectEl.style.top = `${y}px`;
        rectEl.style.width = `${w}px`;
        rectEl.style.height = `${h}px`;
    }

    function onMouseUp() {
        if (!selecting) return;
        selecting = false;
        const rect = rectEl.getBoundingClientRect();

        try {
            captureAndCropSelection(rect);
        } catch (err) {
            console.warn('Could not send selection-made message', err);
        }

        exitSelectionMode();
    }

    function captureAndCropSelection(rect) {
        // Send message to background to get the tab screenshot
        chrome.runtime.sendMessage({
            action: 'capture-tab'
        }, (response) => {
            if (!response || !response.imageData) {
                console.error('Failed to capture tab');
                return;
            }

            // Now crop the image using canvas (this works in content script)
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set canvas size to the selected rectangle
                canvas.width = rect.width;
                canvas.height = rect.height;

                // Account for device pixel ratio
                const dpr = window.devicePixelRatio || 1;

                // Draw the cropped portion
                ctx.drawImage(img, rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr, 0, 0, rect.width, rect.height);

                const croppedImageData = canvas.toDataURL('image/png');
                console.log('Cropped image data URL length:', croppedImageData.length);

                // Send to background.js for translation/detection
                chrome.runtime.sendMessage({
                    action: 'process-image', imageData: croppedImageData
                }).then(r => console.log('Received response from background:', r)).catch(err => console.error('Error sending process-image message:', err));
            };

            img.src = response.imageData;
        });
    }

})();

let tesseractLoadPromise = null;
let ocrWorkerPromise = null;

const workerOptions = {
    workerPath: chrome.runtime.getURL("src/vendor/tesseract/worker.min.js"),
    corePath: chrome.runtime.getURL("src/vendor/tesseract/tesseract-core.wasm.js"),
    langPath: chrome.runtime.getURL("src/vendor/tesseract/lang-data")
};

async function getCreateWorker() {
    if (!tesseractLoadPromise) {
        tesseractLoadPromise = import(chrome.runtime.getURL("src/vendor/tesseract/tesseract.esm.min.js"));
    }
    const mod = await tesseractLoadPromise;
    const tesseract = mod.default || mod;
    if (!tesseract.createWorker) {
        throw new Error("Tesseract createWorker was not found.");
    }
    return tesseract.createWorker;
}

async function getOcrWorker() {
    if (!ocrWorkerPromise) {
        ocrWorkerPromise = (async () => {
            const createWorker = await getCreateWorker();
            // Start with English only for reliability; add more langs later if needed.
            return createWorker("eng", 1, workerOptions);
        })();
    }
    return ocrWorkerPromise;
}

async function runOcr(imageData) {
    const worker = await getOcrWorker();
    const result = await worker.recognize(imageData);
    const text = (result?.data?.text || "").trim();
    const confidence = result?.data?.confidence ?? 0;
    return {text, confidence, langUsed: "eng"};
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "start-selection") {
        console.log("test message - start-selection");
        enterSelectionMode();
        return;
    }

    if (msg && msg.action === "stop-selection") {
        exitSelectionMode();
        return;
    }

    if (msg && msg.action === "ocr-image") {
        (async () => {
            try {
                const ocr = await runOcr(msg.imageData);
                sendResponse({ocr});
            } catch (err) {
                sendResponse({error: String(err)});
            }
        })();
        return true;
    }
});

