async function getTranslationConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["deeplApiKey", "deeplPlan"], (result) => {
            resolve({
                apiKey: result.deeplApiKey || "",
                plan: result.deeplPlan || "free",
            });
        });
    });
}

function getDeepLBaseUrl(plan) {
    return plan === "pro"
        ? "https://api.deepl.com"
        : "https://api-free.deepl.com";
}

async function translateWithDeepL(text, targetLang) {
    const { apiKey, plan } = await getTranslationConfig();
    if (!apiKey) {
        return { error: "DeepL API key not configured." };
    }

    const url = `${getDeepLBaseUrl(plan)}/v2/translate`;
    const body = new URLSearchParams({
        text,
        target_lang: targetLang,
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `DeepL-Auth-Key ${apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        return { error: `DeepL error (${response.status}): ${errorText}` };
    }

    const data = await response.json();
    const translation = data?.translations?.[0]?.text || "";
    return { translation };
}

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
                    async (resp) => {
                        if (chrome.runtime.lastError) {
                            sendResponse({
                                error: chrome.runtime.lastError.message,
                            });
                            return;
                        }

                        if (resp?.ocr?.text) {
                            const translationResult = await translateWithDeepL(
                                resp.ocr.text,
                                "EN",
                            );
                            sendResponse({
                                ...resp,
                                translation: translationResult.translation,
                                translationError: translationResult.error,
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
