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
