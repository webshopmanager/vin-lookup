/**
 * Shared utilities — validation, state list, DOM helpers.
 */

var US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],
  ["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],
  ["WI","Wisconsin"],["WY","Wyoming"],["DC","District of Columbia"]
];

/**
 * Validate a VIN: 17 alphanumeric characters, no I, O, or Q.
 * Returns null if valid, or an error string.
 */
function validateVin(vin) {
  var clean = vin.trim().toUpperCase();
  if (clean.length !== 17) return "VIN must be exactly 17 characters";
  if (/[IOQ]/.test(clean)) return "VIN cannot contain I, O, or Q";
  if (!/^[A-Z0-9]{17}$/.test(clean)) return "VIN must be letters and numbers only";
  return null;
}

/**
 * Validate plate input. Returns null if valid, or error string.
 */
function validatePlate(plate, state) {
  if (!plate || plate.trim().length < 2) return "Enter a license plate number";
  if (!state) return "Select a state";
  return null;
}

/**
 * Create a DOM element with attributes and children.
 */
function el(tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      if (key === "className") {
        node.className = attrs[key];
      } else if (key === "textContent") {
        node.textContent = attrs[key];
      } else if (key === "innerHTML") {
        node.innerHTML = attrs[key];
      } else if (key.indexOf("on") === 0) {
        node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      } else {
        node.setAttribute(key, attrs[key]);
      }
    });
  }
  if (children) {
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (typeof child === "string") {
        node.appendChild(document.createTextNode(child));
      } else if (child) {
        node.appendChild(child);
      }
    });
  }
  return node;
}

/**
 * Build a <select> for US states.
 */
function buildStateSelect(className) {
  var select = el("select", { className: className });
  select.appendChild(el("option", { value: "", textContent: "State" }));
  US_STATES.forEach(function (s) {
    select.appendChild(el("option", { value: s[0], textContent: s[0] }));
  });
  return select;
}

/**
 * Build specs array from decoded vehicle for display.
 */
function vehicleSpecs(v) {
  var specs = [];
  if (v.trim) specs.push(v.trim);
  if (v.displacement && v.engine) specs.push(v.displacement + " " + v.engine);
  else if (v.engine) specs.push(v.engine);
  else if (v.displacement) specs.push(v.displacement);
  if (v.drive) specs.push(v.drive);
  if (v.fuel && v.fuel.toLowerCase() !== "gasoline") specs.push(v.fuel);
  return specs;
}

/**
 * Format vehicle as "Year Make Model"
 */
function vehicleTitle(v) {
  return v.year + " " + v.make + " " + v.model;
}

/**
 * Format vehicle as PartsLogic fitment string: "year|make|model"
 */
function fitmentString(v) {
  return v.year + "|" + v.make + "|" + v.model;
}
