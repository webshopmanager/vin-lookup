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
