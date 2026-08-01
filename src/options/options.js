function getCheckedOcrLanguages() {
    const boxes = document.querySelectorAll(
        '#ocrLanguages input[type="checkbox"]',
    );

    const langs = Array.from(boxes)
        .filter((box) => box.checked)
        .map((box) => box.value);

    // English is always included
    if (!langs.includes("eng")) {
        langs.unshift("eng");
    }

    return langs;
}

document.getElementById("save").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    const deeplPlan = document.getElementById("deeplPlan").value;
    const targetLang = document.getElementById("targetLang").value;
    const ocrLanguages = getCheckedOcrLanguages();

    chrome.storage.local.set(
        { deeplApiKey: apiKey, deeplPlan, targetLang, ocrLanguages },
        () => {
            document.getElementById("status").textContent = "Saved!";
        },
    );
});

// Load saved settings on page load
chrome.storage.local.get(
    ["deeplApiKey", "deeplPlan", "targetLang", "ocrLanguages"],
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
        if (Array.isArray(result.ocrLanguages)) {
            const boxes = document.querySelectorAll(
                '#ocrLanguages input[type="checkbox"]',
            );

            boxes.forEach((box) => {
                if (box.value === "eng") {
                    return; // always on
                }

                box.checked = result.ocrLanguages.includes(box.value);
            });
        }
    },
);
