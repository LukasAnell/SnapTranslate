document.getElementById("save").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    const deeplPlan = document.getElementById("deeplPlan").value;
    chrome.storage.local.set({ deeplApiKey: apiKey, deeplPlan }, () => {
        document.getElementById("status").textContent = "Saved!";
    });
});

// Load saved settings on page load
chrome.storage.local.get(["deeplApiKey", "deeplPlan"], (result) => {
    if (result.deeplApiKey) {
        document.getElementById("apiKey").value = result.deeplApiKey;
    }
    if (result.deeplPlan) {
        document.getElementById("deeplPlan").value = result.deeplPlan;
    }
});
