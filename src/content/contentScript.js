(function () {
    if (window.__snapTranslateContentScriptLoaded) {
        console.debug("SnapTranslate content script already loaded");
        return;
    }
    window.__snapTranslateContentScriptLoaded = true;

    let overlay = null;
    let rectEl = null;
    let selecting = false;
    let startX = 0;
    let startY = 0;

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.action === "start-selection") {
            console.log("test message - start-selection");
            enterSelectionMode();
            sendResponse({ ok: true });
            return;
        }
        if (msg && msg.action === "stop-selection") {
            exitSelectionMode();
            sendResponse({ ok: true });
        }
    });

    function enterSelectionMode() {
        if (overlay) {
            return;
        }

        overlay = document.createElement("div");
        overlay.id = "selection-overlay";
        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "2147483647",
            cursor: "crosshair",
            background: "rgba(0,0,0,0)",
        });
        document.documentElement.appendChild(overlay);

        rectEl = document.createElement("div");
        Object.assign(rectEl.style, {
            position: "absolute",
            border: "2px dashed #4a90e2",
            background: "rgba(74,144,226,0.12)",
            display: "none",
            pointerEvents: "none",
        });
        overlay.appendChild(rectEl);

        overlay.addEventListener("mousedown", onMouseDown);
        overlay.addEventListener("mousemove", onMouseMove);
        overlay.addEventListener("mouseup", onMouseUp);
        window.addEventListener("keydown", onKeyDown);
    }

    function exitSelectionMode() {
        if (!overlay) {
            return;
        }

        overlay.removeEventListener("mousedown", onMouseDown);
        overlay.removeEventListener("mousemove", onMouseMove);
        overlay.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("keydown", onKeyDown);

        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }

        overlay = null;
        rectEl = null;
        selecting = false;
    }

    function onKeyDown(e) {
        if (e.key === "Escape") {
            exitSelectionMode();
        }
    }

    function onMouseDown(e) {
        selecting = true;
        startX = e.clientX;
        startY = e.clientY;
        rectEl.style.left = `${startX}px`;
        rectEl.style.top = `${startY}px`;
        rectEl.style.width = "0px";
        rectEl.style.height = "0px";
        rectEl.style.display = "block";
    }

    function onMouseMove(e) {
        if (!selecting) {
            return;
        }

        const x = Math.min(e.clientX, startX);
        const y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX);
        const h = Math.abs(e.clientY - startY);
        rectEl.style.left = `${x}px`;
        rectEl.style.top = `${y}px`;
        rectEl.style.width = `${w}px`;
        rectEl.style.height = `${h}px`;
    }

    function onMouseUp() {
        if (!selecting) {
            return;
        }

        selecting = false;
        const rect = rectEl.getBoundingClientRect();
        // save rectangle's dimensions and position before removing the overlay
        const rectSnapshot = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
        };

        exitSelectionMode();

        if (rectSnapshot.width < 4 || rectSnapshot.height < 4) {
            // not a real selection if area is too small.
            return;
        }

        showResultBox(rectSnapshot, { loading: true });

        try {
            captureAndCropSelection(rectSnapshot);
        } catch (err) {
            console.warn("Could not process selection", err);
            updateResultBox({ error: String(err) });
        }
    }

    function captureAndCropSelection(rect) {
        // Send message to background to get the tab screenshot
        chrome.runtime.sendMessage(
            {
                action: "capture-tab",
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    updateResultBox({
                        error: chrome.runtime.lastError.message,
                    });
                    return;
                }

                if (!response || !response.imageData) {
                    console.error("Failed to capture tab");
                    updateResultBox({ error: "Failed to capture the page." });
                    return;
                }

                // Now crop the image using canvas
                const img = document.createElement("img");
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    canvas.width = rect.width;
                    canvas.height = rect.height;

                    // Account for device pixel ratio
                    const dpr = window.devicePixelRatio || 1;

                    ctx.drawImage(
                        img,
                        rect.left * dpr,
                        rect.top * dpr,
                        rect.width * dpr,
                        rect.height * dpr,
                        0,
                        0,
                        rect.width,
                        rect.height,
                    );

                    const croppedImageData = canvas.toDataURL("image/png");

                    // Send to background.js for OCR/translation
                    let settled = false;
                    const timeoutId = setTimeout(() => {
                        if (settled) {
                            return;
                        }

                        settled = true;

                        updateResultBox({
                            error:
                                "Timed out waiting for OCR/translation. " +
                                "Check your network connection and try again.",
                        });
                    }, 30000);

                    chrome.runtime.sendMessage(
                        {
                            action: "process-image",
                            imageData: croppedImageData,
                        },
                        (resp) => {
                            if (settled) {
                                return;
                            }

                            settled = true;

                            clearTimeout(timeoutId);

                            if (chrome.runtime.lastError) {
                                console.error(
                                    "Error sending process-image message:",
                                    chrome.runtime.lastError.message,
                                );
                                updateResultBox({
                                    error: chrome.runtime.lastError.message,
                                });
                                return;
                            }

                            if (!resp || resp.error) {
                                updateResultBox({
                                    error:
                                        (resp && resp.error) ||
                                        "Something went wrong processing the image.",
                                });
                                return;
                            }

                            updateResultBox({
                                ocrText: resp.ocr?.text || "",
                                translation: resp.translation || "",
                                translationError: resp.translationError,
                            });
                        },
                    );
                };
                img.onerror = () => {
                    updateResultBox({
                        error: "Could not load the captured screenshot.",
                    });
                };

                img.src = response.imageData;
            },
        );
    }

    let resultBoxEl = null;

    function showResultBox(rect, { loading } = {}) {
        removeResultBox();

        resultBoxEl = document.createElement("div");
        resultBoxEl.id = "snaptranslate-result-box";
        Object.assign(resultBoxEl.style, {
            position: "fixed",
            zIndex: "2147483647",
            maxWidth: "320px",
            maxHeight: "260px",
            overflowY: "auto",
            background: "#ffffff",
            color: "#1a1a1a",
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            padding: "10px 12px",
            font: "13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif",
        });

        const { left, top } = getResultBoxPosition(rect);
        resultBoxEl.style.left = `${left}px`;
        resultBoxEl.style.top = `${top}px`;

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "\u00d7";
        Object.assign(closeBtn.style, {
            position: "absolute",
            top: "4px",
            right: "6px",
            border: "none",
            background: "transparent",
            fontSize: "16px",
            lineHeight: "1",
            cursor: "pointer",
            color: "#555",
        });
        closeBtn.addEventListener("click", removeResultBox);
        resultBoxEl.appendChild(closeBtn);

        const body = document.createElement("div");
        body.id = "snaptranslate-result-body";
        body.style.marginTop = "4px";
        body.style.paddingRight = "14px";
        body.textContent = loading ? "Reading text from image…" : "";
        resultBoxEl.appendChild(body);

        document.documentElement.appendChild(resultBoxEl);

        // Dismiss on outside click / Escape
        document.addEventListener("mousedown", onOutsideClick, true);
        document.addEventListener("keydown", onResultBoxKeyDown, true);
    }

    function getResultBoxPosition(rect) {
        const margin = 8;
        const boxWidth = 320;
        const boxHeightEstimate = 120;

        let left = rect.left;
        let top = rect.top + rect.height + margin;

        if (top + boxHeightEstimate > window.innerHeight) {
            top = Math.max(margin, rect.top - boxHeightEstimate - margin);
        }

        if (left + boxWidth > window.innerWidth) {
            left = Math.max(margin, window.innerWidth - boxWidth - margin);
        }

        return { left, top };
    }

    function updateResultBox({
        ocrText,
        translation,
        translationError,
        error,
    }) {
        if (!resultBoxEl) return;
        const body = resultBoxEl.querySelector("#snaptranslate-result-body");
        if (!body) return;

        body.textContent = "";

        if (error) {
            const errEl = document.createElement("div");
            errEl.textContent = `Error: ${error}`;
            errEl.style.color = "#c0392b";
            body.appendChild(errEl);
            return;
        }

        if (!ocrText) {
            const noneEl = document.createElement("div");
            noneEl.textContent = "No text detected in that selection.";
            noneEl.style.color = "#555";
            body.appendChild(noneEl);
            return;
        }

        const ocrLabel = document.createElement("div");
        ocrLabel.textContent = "Detected text";
        ocrLabel.style.fontWeight = "600";
        ocrLabel.style.marginBottom = "2px";
        body.appendChild(ocrLabel);

        const ocrEl = document.createElement("div");
        ocrEl.textContent = ocrText;
        ocrEl.style.marginBottom = "8px";
        ocrEl.style.whiteSpace = "pre-wrap";
        body.appendChild(ocrEl);

        const translationLabel = document.createElement("div");
        translationLabel.textContent = "Translation";
        translationLabel.style.fontWeight = "600";
        translationLabel.style.marginBottom = "2px";
        body.appendChild(translationLabel);

        const translationEl = document.createElement("div");
        translationEl.style.whiteSpace = "pre-wrap";
        if (translationError) {
            translationEl.textContent = translationError;
            translationEl.style.color = "#c0392b";
        } else {
            translationEl.textContent = translation || "(no translation)";
        }
        body.appendChild(translationEl);
    }

    function removeResultBox() {
        if (resultBoxEl && resultBoxEl.parentNode) {
            resultBoxEl.parentNode.removeChild(resultBoxEl);
        }
        resultBoxEl = null;
        document.removeEventListener("mousedown", onOutsideClick, true);
        document.removeEventListener("keydown", onResultBoxKeyDown, true);
    }

    function onOutsideClick(e) {
        if (resultBoxEl && !resultBoxEl.contains(e.target)) {
            removeResultBox();
        }
    }

    function onResultBoxKeyDown(e) {
        if (e.key === "Escape") {
            removeResultBox();
        }
    }
})();
