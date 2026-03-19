chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'capture-tab') {
        // Capture the visible tab and return it
        chrome.tabs.captureVisibleTab(sender.tab.windowId, {format: 'png'}, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('Error capturing tab:', chrome.runtime.lastError);
                sendResponse({error: chrome.runtime.lastError.message});
                return;
            }
            sendResponse({imageData: dataUrl});
        });
        return true; // Keep channel open
    }

    if (msg && msg.action === 'process-image') {
        console.log('Processing image:', msg.imageData.length);
        // TODO: perform image detection/translation with msg.imageData

        sendResponse({received: true});
    }
});
