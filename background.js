chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === 'selection-made') {
        console.log('Selection received in background:', msg.rect, 'from', sender);
        // placeholder for now
        // later, perform image detection/cropping/translation
        sendResponse({received: true});
        return true;
    }
});