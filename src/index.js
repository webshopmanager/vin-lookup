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
