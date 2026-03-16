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
