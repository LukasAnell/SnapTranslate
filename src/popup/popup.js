document.addEventListener("DOMContentLoaded", function () {
    const actionButton = document.getElementById("actionButton");
    actionButton.addEventListener("click", async function () {
        console.log("clicked");

        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (!tab) return;

            if (
                tab.url.startsWith("chrome://") ||
                tab.url.startsWith("chrome-extension://") ||
                tab.url.startsWith("edge://") ||
                tab.url.startsWith("about:")
            ) {
                alert(
                    "This extension cannot run on browser internal pages. Please try on a regular website.",
                );
                return;
            }

            chrome.tabs.sendMessage(
                tab.id,
                { action: "start-selection" },
                function (response) {
                    if (chrome.runtime.lastError) {
                        console.log(
                            "Content script not ready, attempting to inject...",
                        );
                        chrome.scripting.executeScript(
                            {
                                target: { tabId: tab.id },
                                files: ["src/content/contentScript.js"],
                            },
                            function () {
                                if (chrome.runtime.lastError) {
                                    console.error(
                                        "Failed to inject content script:",
                                        chrome.runtime.lastError.message,
                                    );
                                    alert(
                                        "Could not activate selection mode on this page.",
                                    );
                                    return;
                                }
                                chrome.tabs.sendMessage(tab.id, {
                                    action: "start-selection",
                                });
                                window.close();
                            },
                        );
                    } else {
                        window.close();
                    }
                },
            );
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        }
    });

    const optionsButton = document.getElementById("optionsButton");
    optionsButton.addEventListener("click", function () {
        chrome.runtime
            .openOptionsPage()
            .then((r) => console.log("Options page opened"))
            .catch((err) => console.error("Failed to open options page:", err));
    });
});
