document.getElementById("save").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    chrome.storage.local.set({ deeplApiKey: apiKey }, () => {
        document.getElementById("status").textContent = "Saved!";
    });
});

// Load saved key on page load
chrome.storage.local.get(["deeplApiKey"], (result) => {
    if (result.deeplApiKey) {
        document.getElementById("apiKey").value = result.deeplApiKey;
    }
});
