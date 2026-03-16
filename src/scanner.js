/**
 * VIN Barcode Scanner — uses native BarcodeDetector API.
 * Mobile only. Scans Code 39 / Code 128 barcodes (standard VIN encoding).
 */

var SCANNER_SUPPORTED = typeof window !== "undefined" && "BarcodeDetector" in window;

/**
 * Check if barcode scanning is available (mobile + BarcodeDetector API).
 */
function isScannerAvailable() {
  if (!SCANNER_SUPPORTED) return false;
  // Only show on touch devices (phones/tablets)
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Build the camera scan button (small icon button).
 */
function buildScanButton(onScan) {
  var btn = el("button", {
    className: "wvl-scan-btn",
    title: "Scan VIN barcode",
    innerHTML: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  });

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    openScanner(onScan);
  });

  return btn;
}

/**
 * Open fullscreen camera viewfinder overlay.
 */
function openScanner(onScan) {
  var overlay = el("div", { className: "wvl-scanner-overlay" });
  var header = el("div", { className: "wvl-scanner-header" });
  var title = el("div", { className: "wvl-scanner-title", textContent: "Scan VIN Barcode" });
  var hint = el("div", { className: "wvl-scanner-hint", textContent: "Point camera at the barcode on your dashboard or door jamb" });
  var closeBtn = el("button", {
    className: "wvl-scanner-close",
    innerHTML: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  });

  header.appendChild(title);
  header.appendChild(hint);

  var video = el("video", { className: "wvl-scanner-video", autoplay: "", playsinline: "" });
  var reticle = el("div", { className: "wvl-scanner-reticle" });
  var status = el("div", { className: "wvl-scanner-status", textContent: "Starting camera..." });

  overlay.appendChild(closeBtn);
  overlay.appendChild(header);
  overlay.appendChild(video);
  overlay.appendChild(reticle);
  overlay.appendChild(status);
  document.body.appendChild(overlay);

  var stream = null;
  var scanning = true;
  var detector = null;
  var animFrame = null;

  function cleanup() {
    scanning = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
    }
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  closeBtn.addEventListener("click", cleanup);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) cleanup();
  });

  // Start camera
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
  })
    .then(function (s) {
      stream = s;
      video.srcObject = s;
      video.play();
      status.textContent = "Looking for barcode...";

      try {
        detector = new BarcodeDetector({ formats: ["code_39", "code_128", "qr_code", "data_matrix"] });
      } catch (e) {
        // Some browsers need fewer formats
        detector = new BarcodeDetector({ formats: ["code_39", "code_128"] });
      }

      // Start scanning loop
      function scanFrame() {
        if (!scanning) return;
        if (video.readyState >= 2) {
          detector.detect(video)
            .then(function (barcodes) {
              if (!scanning) return;
              for (var i = 0; i < barcodes.length; i++) {
                var raw = barcodes[i].rawValue.replace(/\s/g, "").toUpperCase();
                // VINs are exactly 17 alphanumeric chars, no I/O/Q
                if (raw.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(raw)) {
                  scanning = false;
                  // Flash the reticle green
                  reticle.classList.add("wvl-scanner-found");
                  status.textContent = "VIN found: " + raw;
                  // Brief delay so user sees the success state
                  setTimeout(function () {
                    cleanup();
                    onScan(raw);
                  }, 600);
                  return;
                }
              }
              animFrame = requestAnimationFrame(scanFrame);
            })
            .catch(function () {
              if (scanning) animFrame = requestAnimationFrame(scanFrame);
            });
        } else {
          animFrame = requestAnimationFrame(scanFrame);
        }
      }

      scanFrame();
    })
    .catch(function (err) {
      status.textContent = "Camera access denied";
      console.warn("WSMVinLookup scanner:", err);
      setTimeout(cleanup, 2000);
    });
}
