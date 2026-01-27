(function () {
    if (window.__snapTranslateContentScriptLoaded) {
        console.debug('SnapTranslate content script already loaded');
        return;
    }
    window.__snapTranslateContentScriptLoaded = true;

    let overlay = null;
    let rectEl = null;
    let selecting = false;
    let startX = 0;
    let startY = 0;

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.action === 'start-selection') {
            console.log('test message - start-selection');
            enterSelectionMode();
        }
        if (msg && msg.action === 'stop-selection') {
            exitSelectionMode();
        }
    });

    function enterSelectionMode() {
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'selection-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', zIndex: '2147483647', cursor: 'crosshair', background: 'rgba(0,0,0,0)'
        });
        document.documentElement.appendChild(overlay);

        rectEl = document.createElement('div');
        Object.assign(rectEl.style, {
            position: 'absolute',
            border: '2px dashed #4a90e2',
            background: 'rgba(74,144,226,0.12)',
            display: 'none',
            pointerEvents: 'none'
        });
        overlay.appendChild(rectEl);

        overlay.addEventListener('mousedown', onMouseDown);
        overlay.addEventListener('mousemove', onMouseMove);
        overlay.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keydown', onKeyDown);
    }

    function exitSelectionMode() {
        if (!overlay) return;

        overlay.removeEventListener('mousedown', onMouseDown);
        overlay.removeEventListener('mousemove', onMouseMove);
        overlay.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('keydown', onKeyDown);

        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        overlay = null;
        rectEl = null;
        selecting = false;
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            exitSelectionMode();
        }
    }

    function onMouseDown(e) {
        selecting = true;
        startX = e.clientX;
        startY = e.clientY;
        rectEl.style.left = `${startX}px`;
        rectEl.style.top = `${startY}px`;
        rectEl.style.width = '0px';
        rectEl.style.height = '0px';
        rectEl.style.display = 'block';
    }

    function onMouseMove(e) {
        if (!selecting) return;
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
        if (!selecting) return;
        selecting = false;
        const rect = rectEl.getBoundingClientRect();

        try {
            chrome.runtime.sendMessage({
                action: 'selection-made', rect: {
                    left: rect.left, top: rect.top, width: rect.width, height: rect.height
                }
            });
        } catch (err) {
            console.warn('Could not send selection-made message', err);
        }

        exitSelectionMode();
    }
})();
