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
