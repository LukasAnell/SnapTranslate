chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'capture-tab') {
        chrome.tabs.captureVisibleTab(sender.tab.windowId, {format: 'png'}, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('Error capturing tab:', chrome.runtime.lastError);
                sendResponse({error: chrome.runtime.lastError.message});
                return;
            }
            sendResponse({imageData: dataUrl});
        });
        return true;
    }

    if (msg && msg.action === 'process-image') {
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
        return true;
    }
});
