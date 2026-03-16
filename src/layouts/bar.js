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
