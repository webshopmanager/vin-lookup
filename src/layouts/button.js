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
