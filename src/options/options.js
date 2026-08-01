document.getElementById("save").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    const deeplPlan = document.getElementById("deeplPlan").value;
    const targetLang = document.getElementById("targetLang").value;
    chrome.storage.local.set(
        { deeplApiKey: apiKey, deeplPlan, targetLang },
        () => {
            document.getElementById("status").textContent = "Saved!";
        },
    );
});

// Load saved settings on page load
chrome.storage.local.get(
    ["deeplApiKey", "deeplPlan", "targetLang"],
    (result) => {
        if (result.deeplApiKey) {
            document.getElementById("apiKey").value = result.deeplApiKey;
        }
        if (result.deeplPlan) {
            document.getElementById("deeplPlan").value = result.deeplPlan;
        }
        if (result.targetLang) {
            document.getElementById("targetLang").value = result.targetLang;
        }
    },
);
