/**
 * Shared utilities — validation, state list, DOM helpers.
 */

var US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],
  ["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],
  ["WI","Wisconsin"],["WY","Wyoming"],["DC","District of Columbia"]
];

/**
 * Validate a VIN: 17 alphanumeric characters, no I, O, or Q.
 * Returns null if valid, or an error string.
 */
function validateVin(vin) {
  var clean = vin.trim().toUpperCase();
  if (clean.length !== 17) return "VIN must be exactly 17 characters";
  if (/[IOQ]/.test(clean)) return "VIN cannot contain I, O, or Q";
  if (!/^[A-Z0-9]{17}$/.test(clean)) return "VIN must be letters and numbers only";
  return null;
}

/**
 * Validate plate input. Returns null if valid, or error string.
 */
function validatePlate(plate, state) {
  if (!plate || plate.trim().length < 2) return "Enter a license plate number";
  if (!state) return "Select a state";
  return null;
}

/**
 * Create a DOM element with attributes and children.
 */
function el(tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      if (key === "className") {
        node.className = attrs[key];
      } else if (key === "textContent") {
        node.textContent = attrs[key];
      } else if (key === "innerHTML") {
        node.innerHTML = attrs[key];
      } else if (key.indexOf("on") === 0) {
        node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      } else {
        node.setAttribute(key, attrs[key]);
      }
    });
  }
  if (children) {
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (typeof child === "string") {
        node.appendChild(document.createTextNode(child));
      } else if (child) {
        node.appendChild(child);
      }
    });
  }
  return node;
}

/**
 * Build a <select> for US states.
 */
function buildStateSelect(className) {
  var select = el("select", { className: className });
  select.appendChild(el("option", { value: "", textContent: "State" }));
  US_STATES.forEach(function (s) {
    select.appendChild(el("option", { value: s[0], textContent: s[0] }));
  });
  return select;
}

/**
 * Build specs array from decoded vehicle for display.
 */
function vehicleSpecs(v) {
  var specs = [];
  if (v.trim) specs.push(v.trim);
  if (v.displacement && v.engine) specs.push(v.displacement + " " + v.engine);
  else if (v.engine) specs.push(v.engine);
  else if (v.displacement) specs.push(v.displacement);
  if (v.drive) specs.push(v.drive);
  if (v.fuel && v.fuel.toLowerCase() !== "gasoline") specs.push(v.fuel);
  return specs;
}

/**
 * Format vehicle as "Year Make Model"
 */
function vehicleTitle(v) {
  return v.year + " " + v.make + " " + v.model;
}

/**
 * Format vehicle as PartsLogic fitment string: "year|make|model"
 */
function fitmentString(v) {
  return v.year + "|" + v.make + "|" + v.model;
}
/**
 * NHTSA vPIC VIN Decoder — free, no API key needed.
 * https://vpic.nhtsa.dot.gov/api/
 */

var NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function parseTrim(trim, trim2) {
  var t2 = (trim2 || "").trim();
  var variants = (trim || "")
    .split("/")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);

  if (variants.length <= 1) {
    return { specific: t2 || variants[0] || "", variants: [] };
  }
  return { specific: t2, variants: variants };
}

/**
 * Decode a VIN via NHTSA.
 * Returns a promise resolving to { year, make, model, trim, trimVariants, body, engine, displacement, drive, fuel }
 */
function decodeVin(vin) {
  var cleanVin = vin.trim().toUpperCase();
  return fetch(NHTSA_URL + "/" + cleanVin + "?format=json")
    .then(function (res) {
      if (!res.ok) throw new Error("NHTSA API error: " + res.status);
      return res.json();
    })
    .then(function (data) {
      var result = data.Results && data.Results[0];
      if (!result) throw new Error("No data returned from NHTSA.");

      if (!result.ModelYear || !result.Make || !result.Model) {
        throw new Error(
          result.ErrorText || result.AdditionalErrorText || "Could not decode VIN."
        );
      }

      var trimInfo = parseTrim(result.Trim, result.Trim2);

      return {
        year: result.ModelYear,
        make: titleCase(result.Make),
        model: titleCase(result.Model),
        trim: trimInfo.specific,
        trimVariants: trimInfo.variants,
        body: result.BodyClass
          ? result.BodyClass.replace(/\s*\(.*?\)/g, "").trim()
          : "",
        engine: result.EngineCylinders ? result.EngineCylinders + "-Cyl" : "",
        displacement: result.DisplacementL
          ? parseFloat(result.DisplacementL).toFixed(1) + "L"
          : "",
        drive: result.DriveType || "",
        fuel: result.FuelTypePrimary ? titleCase(result.FuelTypePrimary) : "",
      };
    });
}
/**
 * PartsLogic localStorage integration.
 *
 * Writes vehicle selection in the exact format PartsLogic expects:
 *   localStorage["sui-fitment-selector-v2"] = JSON.stringify([["year|make|model"]])
 */

function writePartsLogicStorage(vehicle) {
  var fitment = fitmentString(vehicle);
  try {
    localStorage.setItem(
      "sui-fitment-selector-v2",
      JSON.stringify([[fitment]])
    );
  } catch (e) {
    // localStorage may be unavailable in some contexts
  }
}

/**
 * Read current fitment from PartsLogic storage.
 * Returns { year, make, model } or null.
 */
function readPartsLogicStorage() {
  try {
    var raw = localStorage.getItem("sui-fitment-selector-v2");
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed[0] || !parsed[0][0]) return null;
    var parts = parsed[0][0].split("|");
    if (parts.length < 3) return null;
    return { year: parts[0], make: parts[1], model: parts[2] };
  } catch (e) {
    return null;
  }
}

/**
 * Navigate to shop page with fitment param.
 */
function navigateToShop(vehicle, shopUrl) {
  var fitment = fitmentString(vehicle);
  writePartsLogicStorage(vehicle);
  window.location.href = shopUrl + "?fitment=" + encodeURIComponent(fitment);
}
/**
 * Inject scoped CSS. All selectors prefixed with .wvl- to avoid conflicts.
 */
function injectStyles(accentColor) {
  if (document.getElementById("wsm-vin-lookup-styles")) return;

  var css = [
    /* Reset within our scope */
    ".wvl-root *, .wvl-root *::before, .wvl-root *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    ".wvl-root { font-family: inherit; line-height: 1.4; }",

    /* Tabs */
    ".wvl-tabs { display: flex; gap: 0; }",
    ".wvl-tab { flex: 1; padding: 10px 16px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: none; cursor: pointer; transition: background 0.2s, color 0.2s; background: rgba(128,128,128,0.15); color: rgba(128,128,128,0.7); border-bottom: 2px solid transparent; }",
    ".wvl-tab:first-child { border-radius: 8px 0 0 0; }",
    ".wvl-tab:last-child { border-radius: 0 8px 0 0; }",
    ".wvl-tab.wvl-active { background: rgba(128,128,128,0.25); color: inherit; border-bottom-color: " + accentColor + "; }",
    ".wvl-tab:hover:not(.wvl-active) { background: rgba(128,128,128,0.2); }",
    ".wvl-tab-body { background: rgba(0,0,0,0.15); border-radius: 0 0 8px 8px; padding: 20px; }",

    /* Pane visibility */
    ".wvl-pane { display: none; }",
    ".wvl-pane.wvl-active { display: block; }",

    /* Inputs */
    ".wvl-input { background: rgba(128,128,128,0.15); border: 1px solid rgba(128,128,128,0.3); color: inherit; padding: 12px 16px; border-radius: 6px; font-size: 15px; font-family: inherit; width: 100%; transition: border-color 0.2s; }",
    ".wvl-input:focus { outline: none; border-color: " + accentColor + "; }",
    ".wvl-input-vin { font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace; letter-spacing: 1.5px; text-transform: uppercase; }",
    ".wvl-input-plate { font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }",
    ".wvl-input-plate::placeholder, .wvl-input-vin::placeholder { font-weight: 400; letter-spacing: 0; text-transform: none; }",
    ".wvl-select { background: rgba(128,128,128,0.15); border: 1px solid rgba(128,128,128,0.3); color: inherit; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-family: inherit; }",

    /* Buttons */
    ".wvl-btn { background: " + accentColor + "; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; font-family: inherit; white-space: nowrap; }",
    ".wvl-btn:hover { opacity: 0.9; }",
    ".wvl-btn:disabled { opacity: 0.5; cursor: not-allowed; }",
    ".wvl-btn-ghost { background: transparent; color: inherit; border: 1px solid rgba(128,128,128,0.3); padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; font-family: inherit; }",

    /* Rows */
    ".wvl-row { display: flex; gap: 8px; align-items: center; }",
    ".wvl-row > .wvl-input { flex: 1; }",
    ".wvl-hint { font-size: 12px; opacity: 0.4; margin-top: 8px; }",
    ".wvl-error { font-size: 13px; color: #e53e3e; margin-top: 8px; }",
    ".wvl-loading { font-size: 13px; opacity: 0.6; margin-top: 8px; }",

    /* Result card */
    ".wvl-result { border: 1px solid rgba(0,180,80,0.3); background: rgba(0,180,80,0.06); border-radius: 8px; padding: 16px 20px; margin-top: 16px; display: flex; align-items: center; gap: 16px; }",
    ".wvl-result-icon { width: 44px; height: 44px; background: rgba(0,180,80,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }",
    ".wvl-result-icon svg { width: 22px; height: 22px; stroke: #22c55e; fill: none; }",
    ".wvl-result-info { flex: 1; }",
    ".wvl-result-title { font-size: 16px; font-weight: 700; }",
    ".wvl-result-specs { font-size: 12px; opacity: 0.6; margin-top: 2px; }",

    /* Vehicle badge (sidebar) */
    ".wvl-badge { border: 1px solid rgba(0,180,80,0.25); background: rgba(0,180,80,0.06); border-radius: 8px; padding: 12px; margin-bottom: 12px; }",
    ".wvl-badge-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #22c55e; margin-bottom: 4px; }",
    ".wvl-badge-title { font-size: 14px; font-weight: 700; }",
    ".wvl-badge-specs { font-size: 11px; opacity: 0.6; margin-top: 2px; }",
    ".wvl-badge-change { font-size: 11px; color: " + accentColor + "; cursor: pointer; margin-top: 6px; display: inline-block; background: none; border: none; padding: 0; font-family: inherit; }",

    /* Trigger button (layout: button) */
    ".wvl-trigger { background: rgba(128,128,128,0.12); border: 1px solid rgba(128,128,128,0.25); color: inherit; padding: 12px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-family: inherit; }",
    ".wvl-trigger:hover { background: rgba(128,128,128,0.2); }",
    ".wvl-trigger svg { width: 16px; height: 16px; }",
    ".wvl-or { opacity: 0.3; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }",

    /* Dropdown panel (layout: button) */
    ".wvl-dropdown { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); background: #1e1e2e; border: 1px solid rgba(128,128,128,0.3); border-radius: 10px; padding: 24px; width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); z-index: 9999; margin-top: 8px; color: #e0e0e0; }",
    ".wvl-dropdown h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }",
    ".wvl-dropdown .wvl-hint { margin-bottom: 16px; margin-top: 0; }",
    ".wvl-dp-toggle { display: flex; gap: 0; margin-bottom: 16px; border-radius: 6px; overflow: hidden; }",
    ".wvl-dp-toggle button { flex: 1; padding: 8px; font-size: 12px; font-weight: 600; border: 1px solid rgba(128,128,128,0.3); background: rgba(128,128,128,0.15); color: inherit; cursor: pointer; font-family: inherit; opacity: 0.6; }",
    ".wvl-dp-toggle button.wvl-active { background: " + accentColor + "; color: #fff; border-color: " + accentColor + "; opacity: 1; }",

    /* Bar (layout: bar) */
    ".wvl-bar { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 24px; flex-wrap: wrap; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(128,128,128,0.1); }",
    ".wvl-bar-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; white-space: nowrap; }",
    ".wvl-bar .wvl-input { width: auto; padding: 8px 14px; font-size: 14px; }",
    ".wvl-bar .wvl-input-vin { width: 220px; }",
    ".wvl-bar .wvl-input-plate { width: 120px; }",
    ".wvl-bar .wvl-select { padding: 8px 12px; font-size: 13px; }",
    ".wvl-bar .wvl-btn { padding: 8px 16px; font-size: 13px; }",

    /* Sidebar layout */
    ".wvl-sidebar { padding: 16px 0; }",
    ".wvl-sidebar-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; margin-bottom: 12px; font-weight: 600; }",
    ".wvl-sidebar .wvl-input { padding: 10px 12px; font-size: 13px; margin-bottom: 8px; }",
    ".wvl-sidebar .wvl-btn { width: 100%; padding: 10px; font-size: 13px; }",
    ".wvl-sidebar .wvl-btn-ghost { width: 100%; padding: 10px; font-size: 13px; margin-top: 6px; }",
    ".wvl-sidebar .wvl-or { display: block; text-align: center; margin: 10px 0; }",
    ".wvl-sidebar .wvl-row { margin-bottom: 8px; }",

    /* Scan button */
    ".wvl-scan-btn { background: rgba(128,128,128,0.15); border: 1px solid rgba(128,128,128,0.3); color: inherit; width: 46px; height: 46px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; padding: 0; }",
    ".wvl-scan-btn:hover { background: rgba(128,128,128,0.25); }",
    ".wvl-scan-btn svg { width: 20px; height: 20px; }",

    /* Scanner overlay */
    ".wvl-scanner-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #000; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; }",
    ".wvl-scanner-header { position: absolute; top: 0; left: 0; right: 0; padding: 20px; text-align: center; z-index: 2; background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%); }",
    ".wvl-scanner-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }",
    ".wvl-scanner-hint { font-size: 13px; color: rgba(255,255,255,0.6); }",
    ".wvl-scanner-close { position: absolute; top: 16px; right: 16px; z-index: 3; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }",
    ".wvl-scanner-close svg { width: 20px; height: 20px; }",
    ".wvl-scanner-video { width: 100%; height: 100%; object-fit: cover; }",
    ".wvl-scanner-reticle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 280px; height: 80px; border: 2px solid rgba(255,255,255,0.6); border-radius: 8px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.4); transition: border-color 0.3s; }",
    ".wvl-scanner-reticle.wvl-scanner-found { border-color: #22c55e; box-shadow: 0 0 0 9999px rgba(0,0,0,0.4), 0 0 20px rgba(34,197,94,0.4); }",
    ".wvl-scanner-status { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; color: #fff; font-size: 14px; z-index: 2; }",

    /* Hide scan button on desktop */
    "@media (min-width: 769px) { .wvl-scan-btn { display: none; } }",

    /* Responsive */
    "@media (max-width: 768px) {",
    "  .wvl-row { flex-direction: column; }",
    "  .wvl-row > .wvl-input, .wvl-row > .wvl-select, .wvl-row > .wvl-btn { width: 100%; }",
    "  .wvl-bar { flex-direction: column; gap: 8px; }",
    "  .wvl-bar .wvl-input-vin, .wvl-bar .wvl-input-plate { width: 100%; }",
    "  .wvl-result { flex-direction: column; text-align: center; }",
    "  .wvl-dropdown { width: calc(100vw - 32px); left: 16px; transform: none; }",
    "  .wvl-tabs { font-size: 11px; }",
    "  .wvl-tab { padding: 8px 10px; font-size: 11px; }",
    "}",
  ].join("\n");

  var style = document.createElement("style");
  style.id = "wsm-vin-lookup-styles";
  style.textContent = css;
  document.head.appendChild(style);
}
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
/**
 * Shared UI builders used across layouts.
 */

var CHECK_SVG = '<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
var VIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>';

/**
 * Build VIN input pane content.
 * Returns { pane, input, btn, error, loading, result }
 */
function buildVinPane(cfg) {
  var input = el("input", {
    className: "wvl-input wvl-input-vin",
    placeholder: "Enter 17-character VIN",
    maxlength: "17",
  });
  var btn = el("button", { className: "wvl-btn", textContent: "Decode" });

  // Add scan button on mobile if BarcodeDetector is available
  var rowChildren = [input, btn];
  if (isScannerAvailable()) {
    var scanBtn = buildScanButton(function (scannedVin) {
      input.value = scannedVin;
      handleVinDecode(scannedVin, cfg, error, loading, result, btn);
    });
    rowChildren = [input, scanBtn, btn];
  }

  var row = el("div", { className: "wvl-row" }, rowChildren);
  var hintText = isScannerAvailable()
    ? "Enter your VIN or tap the camera to scan the barcode"
    : "Find your VIN on the driver's side dashboard or door jamb sticker";
  var hint = el("div", { className: "wvl-hint", textContent: hintText });
  var error = el("div", { className: "wvl-error" });
  error.style.display = "none";
  var loading = el("div", { className: "wvl-loading", textContent: "Decoding VIN..." });
  loading.style.display = "none";
  var result = el("div");
  result.style.display = "none";

  var pane = el("div", null, [row, hint, error, loading, result]);

  btn.addEventListener("click", function () {
    handleVinDecode(input.value, cfg, error, loading, result, btn);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") btn.click();
  });

  return { pane: pane, input: input, btn: btn, error: error, loading: loading, result: result };
}

/**
 * Build plate input pane content.
 * Returns { pane, plateInput, stateSelect, btn, error, loading, result }
 */
function buildPlatePane(cfg) {
  var plateInput = el("input", {
    className: "wvl-input wvl-input-plate",
    placeholder: "License plate",
    maxlength: "8",
  });
  var stateSelect = buildStateSelect("wvl-select");
  var btn = el("button", { className: "wvl-btn", textContent: "Look Up" });
  var row = el("div", { className: "wvl-row" }, [plateInput, stateSelect, btn]);
  var hint = el("div", { className: "wvl-hint", textContent: "We'll identify your vehicle from your plate number" });
  var error = el("div", { className: "wvl-error" });
  error.style.display = "none";
  var loading = el("div", { className: "wvl-loading", textContent: "Looking up plate..." });
  loading.style.display = "none";
  var result = el("div");
  result.style.display = "none";

  var pane = el("div", null, [row, hint, error, loading, result]);

  btn.addEventListener("click", function () {
    handlePlateLookup(plateInput.value, stateSelect.value, cfg, error, loading, result, btn);
  });
  plateInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") btn.click();
  });

  return { pane: pane, plateInput: plateInput, stateSelect: stateSelect, btn: btn, error: error, loading: loading, result: result };
}

/**
 * Build a result card from decoded vehicle.
 */
function buildResultCard(vehicle, cfg) {
  var icon = el("div", { className: "wvl-result-icon", innerHTML: CHECK_SVG });
  var title = el("div", { className: "wvl-result-title", textContent: vehicleTitle(vehicle) });
  var specs = vehicleSpecs(vehicle);
  var specsEl = el("div", { className: "wvl-result-specs", textContent: specs.join(" \u2022 ") });
  var info = el("div", { className: "wvl-result-info" }, [title, specsEl]);
  var shopBtn = el("button", { className: "wvl-btn", textContent: "Shop Parts" });

  shopBtn.addEventListener("click", function () {
    navigateToShop(vehicle, cfg.shopUrl);
  });

  return el("div", { className: "wvl-result" }, [icon, info, shopBtn]);
}

/**
 * Build a vehicle badge (sidebar style).
 */
function buildVehicleBadge(vehicle, cfg, onClear) {
  var label = el("div", { className: "wvl-badge-label", textContent: "Vehicle Identified" });
  var title = el("div", { className: "wvl-badge-title", textContent: vehicleTitle(vehicle) });
  var specs = vehicleSpecs(vehicle);
  var specsEl = el("div", { className: "wvl-badge-specs", textContent: specs.join(" \u2022 ") });
  var change = el("button", { className: "wvl-badge-change", textContent: "Change vehicle" });
  change.addEventListener("click", function () { if (onClear) onClear(); });

  var badge = el("div", { className: "wvl-badge" }, [label, title, specsEl, change]);
  var shopBtn = el("button", { className: "wvl-btn", textContent: "Shop Parts for This Vehicle" });
  shopBtn.addEventListener("click", function () { navigateToShop(vehicle, cfg.shopUrl); });
  var clearBtn = el("button", { className: "wvl-btn-ghost", textContent: "Clear Selection" });
  clearBtn.addEventListener("click", function () { if (onClear) onClear(); });

  return el("div", null, [badge, shopBtn, clearBtn]);
}

/**
 * Handle VIN decode action.
 */
function handleVinDecode(vin, cfg, errorEl, loadingEl, resultEl, btn) {
  errorEl.style.display = "none";
  resultEl.style.display = "none";
  resultEl.innerHTML = "";

  var err = validateVin(vin);
  if (err) {
    errorEl.textContent = err;
    errorEl.style.display = "block";
    return;
  }

  loadingEl.style.display = "block";
  btn.disabled = true;

  decodeVin(vin)
    .then(function (vehicle) {
      loadingEl.style.display = "none";
      btn.disabled = false;
      resultEl.style.display = "block";
      resultEl.appendChild(buildResultCard(vehicle, cfg));
      if (cfg.onVehicleDecoded) cfg.onVehicleDecoded(vehicle);
    })
    .catch(function (e) {
      loadingEl.style.display = "none";
      btn.disabled = false;
      errorEl.textContent = e.message || "Could not decode VIN. Please check and try again.";
      errorEl.style.display = "block";
    });
}

/**
 * Demo VINs for when the plate proxy is unavailable.
 * Cycles deterministically based on plate+state input.
 */
var DEMO_VINS = [
  "1FMEE5DPXMLA66891", // 2021 Ford Bronco
  "1HGCM82633A004352", // 2003 Honda Accord
  "1G1ZT53826F109149", // 2006 Chevrolet Malibu
  "WBA3A5C51DF359218", // 2013 BMW 3 Series
  "5TDJZRFH6HS381043", // 2017 Toyota Highlander
];

function getDemoVin(plate, state) {
  var seed = 0;
  var str = plate + state;
  for (var i = 0; i < str.length; i++) seed += str.charCodeAt(i);
  return DEMO_VINS[seed % DEMO_VINS.length];
}

/**
 * Handle plate lookup action.
 */
function handlePlateLookup(plate, state, cfg, errorEl, loadingEl, resultEl, btn) {
  errorEl.style.display = "none";
  resultEl.style.display = "none";
  resultEl.innerHTML = "";

  var err = validatePlate(plate, state);
  if (err) {
    errorEl.textContent = err;
    errorEl.style.display = "block";
    return;
  }

  loadingEl.style.display = "block";
  btn.disabled = true;

  var plateClean = plate.trim().toUpperCase();

  // If demoMode is on, skip the proxy entirely
  if (cfg.demoMode) {
    var demoVin = getDemoVin(plateClean, state);
    decodeVin(demoVin)
      .then(function (vehicle) {
        loadingEl.style.display = "none";
        btn.disabled = false;
        resultEl.style.display = "block";
        resultEl.appendChild(buildResultCard(vehicle, cfg));
        if (cfg.onVehicleDecoded) cfg.onVehicleDecoded(vehicle);
      })
      .catch(function (e) {
        loadingEl.style.display = "none";
        btn.disabled = false;
        errorEl.textContent = e.message || "Could not decode vehicle.";
        errorEl.style.display = "block";
      });
    return;
  }

  fetch(cfg.plateProxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plate: plateClean, state: state }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error) {
        throw new Error(
          data.error === "not_configured" ? "Plate lookup is not available." :
          data.error === "no_credits" ? "Plate lookup service temporarily unavailable." :
          data.error
        );
      }
      return decodeVin(data.vin);
    })
    .then(function (vehicle) {
      loadingEl.style.display = "none";
      btn.disabled = false;
      resultEl.style.display = "block";
      resultEl.appendChild(buildResultCard(vehicle, cfg));
      if (cfg.onVehicleDecoded) cfg.onVehicleDecoded(vehicle);
    })
    .catch(function (e) {
      loadingEl.style.display = "none";
      btn.disabled = false;
      errorEl.textContent = e.message || "Could not look up plate. Try entering your VIN instead.";
      errorEl.style.display = "block";
    });
}
/**
 * Layout: Auto
 *
 * Detects page context and picks the right layout:
 * 1. Container inside a sidebar/facet parent → "sidebar"
 * 2. Container inside a hero or full-width section → "tabbed"
 * 3. Fallback → "button"
 */
function detectLayout(container) {
  var parent = container.parentElement;
  var depth = 0;

  while (parent && depth < 6) {
    var cls = (parent.className || "").toLowerCase();
    var id = (parent.id || "").toLowerCase();
    var tag = parent.tagName.toLowerCase();

    // Sidebar indicators
    if (
      cls.indexOf("sidebar") !== -1 ||
      cls.indexOf("facet") !== -1 ||
      cls.indexOf("filter") !== -1 ||
      id.indexOf("sidebar") !== -1 ||
      id.indexOf("facet") !== -1
    ) {
      return "sidebar";
    }

    // Hero / banner indicators
    if (
      cls.indexOf("hero") !== -1 ||
      cls.indexOf("banner") !== -1 ||
      cls.indexOf("jumbotron") !== -1 ||
      cls.indexOf("slideshow") !== -1 ||
      id.indexOf("hero") !== -1 ||
      id.indexOf("banner") !== -1
    ) {
      return "tabbed";
    }

    parent = parent.parentElement;
    depth++;
  }

  // Check container width — if it's wide (likely full-width placement), use tabbed
  var rect = container.getBoundingClientRect();
  if (rect.width > 600) {
    return "tabbed";
  }

  return "button";
}
/**
 * Layout: Tabbed Inline
 *
 * Wraps the existing PartsLogic selector with tabs:
 * [ Shop by Vehicle ] [ VIN Lookup ] [ License Plate ]
 */
function renderTabbed(container, cfg) {
  var root = el("div", { className: "wvl-root" });

  // Tab buttons
  var tabYMM = el("button", { className: "wvl-tab wvl-active", textContent: "Shop by Vehicle" });
  var tabVIN = el("button", { className: "wvl-tab", textContent: "VIN Lookup" });
  var tabs = [tabYMM, tabVIN];
  var tabPlate;
  if (cfg.enablePlate) {
    tabPlate = el("button", { className: "wvl-tab", textContent: "License Plate" });
    tabs.push(tabPlate);
  }
  var tabRow = el("div", { className: "wvl-tabs" }, tabs);

  // Panes
  // YMM pane: capture existing PartsLogic content
  var ymmPane = el("div", { className: "wvl-pane wvl-active" });
  // Move existing children of container into the YMM pane
  while (container.firstChild) {
    ymmPane.appendChild(container.firstChild);
  }

  var vinUI = buildVinPane(cfg);
  var vinPane = el("div", { className: "wvl-pane" }, [vinUI.pane]);

  var panes = [ymmPane, vinPane];
  var platePane;
  if (cfg.enablePlate) {
    var plateUI = buildPlatePane(cfg);
    platePane = el("div", { className: "wvl-pane" }, [plateUI.pane]);
    panes.push(platePane);
  }

  var body = el("div", { className: "wvl-tab-body" }, panes);
  root.appendChild(tabRow);
  root.appendChild(body);

  // Tab switching
  function activateTab(index) {
    tabs.forEach(function (t, i) {
      t.classList.toggle("wvl-active", i === index);
    });
    panes.forEach(function (p, i) {
      p.classList.toggle("wvl-active", i === index);
    });
  }
  tabYMM.addEventListener("click", function () { activateTab(0); });
  tabVIN.addEventListener("click", function () { activateTab(1); });
  if (tabPlate) {
    tabPlate.addEventListener("click", function () { activateTab(2); });
  }

  container.appendChild(root);
}
/**
 * Layout: Trigger Button + Dropdown
 *
 * Adds a "Know your VIN?" button next to the existing YMM bar.
 * Clicking opens a floating dropdown panel. Zero modification to existing markup.
 */
function renderButton(container, cfg) {
  var wrapper = el("div", { className: "wvl-root", style: "position: relative; display: inline-block;" });

  var orText = el("span", { className: "wvl-or", textContent: "or" });

  var triggerBtn = el("button", {
    className: "wvl-trigger",
    innerHTML: VIN_SVG + " Know your VIN?",
  });

  // Dropdown panel
  var dropdown = el("div", { className: "wvl-dropdown" });
  dropdown.style.display = "none";

  var heading = el("h3", { textContent: "Quick Vehicle Lookup" });
  var sub = el("div", { className: "wvl-hint", textContent: "Enter your VIN or license plate to find your exact vehicle" });

  // Toggle between VIN and Plate inside dropdown
  var vinToggle = el("button", { className: "wvl-active", textContent: "VIN" });
  var plateToggle = el("button", { textContent: "License Plate" });
  var toggleRow = el("div", { className: "wvl-dp-toggle" }, cfg.enablePlate ? [vinToggle, plateToggle] : [vinToggle]);

  var vinUI = buildVinPane(cfg);
  vinUI.pane.style.display = "block";

  var plateUI = cfg.enablePlate ? buildPlatePane(cfg) : null;
  if (plateUI) plateUI.pane.style.display = "none";

  dropdown.appendChild(heading);
  dropdown.appendChild(sub);
  if (cfg.enablePlate) dropdown.appendChild(toggleRow);
  dropdown.appendChild(vinUI.pane);
  if (plateUI) dropdown.appendChild(plateUI.pane);

  vinToggle.addEventListener("click", function () {
    vinToggle.classList.add("wvl-active");
    plateToggle.classList.remove("wvl-active");
    vinUI.pane.style.display = "block";
    if (plateUI) plateUI.pane.style.display = "none";
  });
  if (cfg.enablePlate) {
    plateToggle.addEventListener("click", function () {
      plateToggle.classList.add("wvl-active");
      vinToggle.classList.remove("wvl-active");
      vinUI.pane.style.display = "none";
      if (plateUI) plateUI.pane.style.display = "block";
    });
  }

  // Toggle dropdown
  triggerBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = dropdown.style.display === "block";
    dropdown.style.display = open ? "none" : "block";
  });

  // Close on outside click
  document.addEventListener("click", function (e) {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  wrapper.appendChild(orText);
  wrapper.appendChild(triggerBtn);
  wrapper.appendChild(dropdown);

  // Insert after the container (next to existing YMM bar)
  if (container.parentNode) {
    container.parentNode.insertBefore(wrapper, container.nextSibling);
  } else {
    container.appendChild(wrapper);
  }
}
/**
 * Layout: Secondary Bar
 *
 * Slim always-visible bar below the YMM selector with inline VIN + plate inputs.
 */
function renderBar(container, cfg) {
  var root = el("div", { className: "wvl-root" });
  var bar = el("div", { className: "wvl-bar" });

  var label = el("span", { className: "wvl-bar-label", textContent: "Quick lookup:" });

  var vinInput = el("input", {
    className: "wvl-input wvl-input-vin",
    placeholder: "Enter VIN",
    maxlength: "17",
  });

  var parts = [label, vinInput];

  var plateInput, stateSelect;
  if (cfg.enablePlate) {
    var orText = el("span", { className: "wvl-or", textContent: "or" });
    plateInput = el("input", {
      className: "wvl-input wvl-input-plate",
      placeholder: "Plate #",
      maxlength: "8",
    });
    stateSelect = buildStateSelect("wvl-select");
    parts.push(orText, plateInput, stateSelect);
  }

  var goBtn = el("button", { className: "wvl-btn", textContent: "Go" });
  parts.push(goBtn);

  parts.forEach(function (p) { bar.appendChild(p); });

  // Error and result area below the bar
  var errorEl = el("div", { className: "wvl-error", style: "text-align: center; padding: 0 24px;" });
  errorEl.style.display = "none";
  var loadingEl = el("div", { className: "wvl-loading", style: "text-align: center; padding: 8px 24px;" });
  loadingEl.style.display = "none";
  var resultEl = el("div", { style: "padding: 0 24px 16px; display: flex; justify-content: center;" });
  resultEl.style.display = "none";

  root.appendChild(bar);
  root.appendChild(errorEl);
  root.appendChild(loadingEl);
  root.appendChild(resultEl);

  goBtn.addEventListener("click", function () {
    // Decide which input has content
    var vin = vinInput.value.trim();
    var plate = plateInput ? plateInput.value.trim() : "";

    if (vin.length > 0) {
      handleVinDecode(vin, cfg, errorEl, loadingEl, resultEl, goBtn);
    } else if (plate.length > 0 && stateSelect) {
      handlePlateLookup(plate, stateSelect.value, cfg, errorEl, loadingEl, resultEl, goBtn);
    } else {
      errorEl.textContent = "Enter a VIN or license plate";
      errorEl.style.display = "block";
    }
  });

  vinInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") goBtn.click();
  });
  if (plateInput) {
    plateInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") goBtn.click();
    });
  }

  // Insert after the container
  if (container.nextSibling) {
    container.parentNode.insertBefore(root, container.nextSibling);
  } else if (container.parentNode) {
    container.parentNode.appendChild(root);
  }
}
/**
 * Layout: Sidebar
 *
 * Vertical layout for search/shop pages. Renders above existing facets.
 * Shows vehicle badge after successful decode.
 */
function renderSidebar(container, cfg) {
  var root = el("div", { className: "wvl-root wvl-sidebar" });
  var title = el("div", { className: "wvl-sidebar-title", textContent: "Quick Vehicle Lookup" });

  var vinInput = el("input", {
    className: "wvl-input wvl-input-vin",
    placeholder: "Enter VIN",
    maxlength: "17",
  });
  var vinBtn = el("button", { className: "wvl-btn", textContent: "Decode VIN" });

  var errorEl = el("div", { className: "wvl-error" });
  errorEl.style.display = "none";
  var loadingEl = el("div", { className: "wvl-loading" });
  loadingEl.style.display = "none";
  var resultEl = el("div");
  resultEl.style.display = "none";

  var formContainer = el("div");
  formContainer.appendChild(vinInput);
  formContainer.appendChild(vinBtn);

  if (cfg.enablePlate) {
    var orText = el("div", { className: "wvl-or", textContent: "or" });
    var plateRow = el("div", { className: "wvl-row" });
    var plateInput = el("input", {
      className: "wvl-input wvl-input-plate",
      placeholder: "Plate #",
      maxlength: "8",
      style: "font-size: 13px;",
    });
    var stateSelect = buildStateSelect("wvl-select");
    stateSelect.style.width = "70px";
    plateRow.appendChild(plateInput);
    plateRow.appendChild(stateSelect);
    var plateBtn = el("button", { className: "wvl-btn", textContent: "Look Up Plate" });

    formContainer.appendChild(orText);
    formContainer.appendChild(plateRow);
    formContainer.appendChild(plateBtn);

    plateBtn.addEventListener("click", function () {
      handlePlateLookup(plateInput.value, stateSelect.value, cfg, errorEl, loadingEl, resultEl, plateBtn);
    });
    plateInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") plateBtn.click();
    });
  }

  root.appendChild(title);
  root.appendChild(formContainer);
  root.appendChild(errorEl);
  root.appendChild(loadingEl);
  root.appendChild(resultEl);

  // Override result rendering for sidebar — use badge instead of card
  var origVinDecode = handleVinDecode;
  var origPlateLookup = handlePlateLookup;

  vinBtn.addEventListener("click", function () {
    errorEl.style.display = "none";
    resultEl.style.display = "none";
    resultEl.innerHTML = "";

    var err = validateVin(vinInput.value);
    if (err) {
      errorEl.textContent = err;
      errorEl.style.display = "block";
      return;
    }

    loadingEl.textContent = "Decoding VIN...";
    loadingEl.style.display = "block";
    vinBtn.disabled = true;

    decodeVin(vinInput.value)
      .then(function (vehicle) {
        loadingEl.style.display = "none";
        vinBtn.disabled = false;
        showSidebarResult(vehicle);
        if (cfg.onVehicleDecoded) cfg.onVehicleDecoded(vehicle);
      })
      .catch(function (e) {
        loadingEl.style.display = "none";
        vinBtn.disabled = false;
        errorEl.textContent = e.message || "Could not decode VIN.";
        errorEl.style.display = "block";
      });
  });
  vinInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") vinBtn.click();
  });

  function showSidebarResult(vehicle) {
    formContainer.style.display = "none";
    title.textContent = "Your Vehicle";
    resultEl.style.display = "block";
    resultEl.innerHTML = "";
    resultEl.appendChild(buildVehicleBadge(vehicle, cfg, function () {
      // Clear / change vehicle
      formContainer.style.display = "block";
      title.textContent = "Quick Vehicle Lookup";
      resultEl.style.display = "none";
      resultEl.innerHTML = "";
    }));
  }

  // Insert at top of container (above existing facets)
  if (container.firstChild) {
    container.insertBefore(root, container.firstChild);
  } else {
    container.appendChild(root);
  }
}
/**
 * WSMVinLookup — Entry point.
 *
 * Usage:
 *   <script src="wsm-vin-lookup.min.js"></script>
 *   <script>
 *     WSMVinLookup.init({ layout: "auto" });
 *   </script>
 */
(function (global) {
  "use strict";

  var DEFAULTS = {
    layout: "auto",
    container: "#pl-fitment-selector-wrapper",
    shopUrl: "/shop.html",
    enablePlate: true,
    accentColor: "#b60000",
    plateProxyUrl: "/api/wsm-plate-lookup",
    demoMode: false,
    onVehicleDecoded: null,
  };

  function init(userOpts) {
    var cfg = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      cfg[key] = (userOpts && userOpts[key] !== undefined) ? userOpts[key] : DEFAULTS[key];
    });

    // Wait for DOM if needed
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { _mount(cfg); });
    } else {
      _mount(cfg);
    }
  }

  function _mount(cfg) {
    var container = document.querySelector(cfg.container);
    if (!container) {
      console.warn("WSMVinLookup: container not found: " + cfg.container);
      return;
    }

    // Inject styles
    injectStyles(cfg.accentColor);

    // Resolve layout
    var layout = cfg.layout;
    if (layout === "auto") {
      layout = detectLayout(container);
    }

    switch (layout) {
      case "tabbed":
        renderTabbed(container, cfg);
        break;
      case "button":
        renderButton(container, cfg);
        break;
      case "bar":
        renderBar(container, cfg);
        break;
      case "sidebar":
        renderSidebar(container, cfg);
        break;
      default:
        console.warn("WSMVinLookup: unknown layout: " + layout + ", falling back to button");
        renderButton(container, cfg);
    }
  }

  global.WSMVinLookup = { init: init };

})(typeof window !== "undefined" ? window : this);
