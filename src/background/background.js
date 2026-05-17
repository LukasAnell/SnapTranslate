async function ensureOffscreenDocument() {
    const hasDocument = await chrome.offscreen?.hasDocument?.();
    if (hasDocument) {
        return;
    }

    await chrome.offscreen.createDocument({
        url: "src/offscreen/offscreen.html",
        reasons: [chrome.offscreen.Reason.WORKERS],
        justification: "Run OCR in an offscreen document to access Worker APIs",
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "capture-tab") {
        chrome.tabs.captureVisibleTab(
            sender.tab.windowId,
            { format: "png" },
            (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error capturing tab:",
                        chrome.runtime.lastError,
                    );
                    sendResponse({ error: chrome.runtime.lastError.message });
                    return;
                }
                sendResponse({ imageData: dataUrl });
            },
        );
        return true;
    }

    if (msg && msg.action === "process-image") {
        (async () => {
            try {
                await ensureOffscreenDocument();

                chrome.runtime.sendMessage(
                    {
                        action: "offscreen-ocr",
                        imageData: msg.imageData,
                    },
                    (resp) => {
                        if (chrome.runtime.lastError) {
                            sendResponse({
                                error: chrome.runtime.lastError.message,
                            });
                            return;
                        }
                        sendResponse(resp);
                    },
                );
            } catch (error) {
                sendResponse({ error: String(error) });
            }
        })();

        return true;
    }
});
