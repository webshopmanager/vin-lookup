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
