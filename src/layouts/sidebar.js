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
