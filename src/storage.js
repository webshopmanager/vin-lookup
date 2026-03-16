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
