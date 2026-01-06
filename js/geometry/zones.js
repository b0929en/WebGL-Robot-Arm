"use strict";

// =========================================================================
// GEOMETRY GENERATORS (Drop Zones)
// =========================================================================

function generateDropZoneGeometry() {
  var ptrs = [];
  var y = 0.01; // Slightly above ground

  // Box (Line Loop simulated with Lines)
  // Width 2.0 -> +/- 1.0
  var b1 = vec4(-1.0, y, 1.0, 1.0);
  var b2 = vec4(-1.0, y, -1.0, 1.0);
  var b3 = vec4(1.0, y, -1.0, 1.0);
  var b4 = vec4(1.0, y, 1.0, 1.0);

  ptrs.push(b1); ptrs.push(b2);
  ptrs.push(b2); ptrs.push(b3);
  ptrs.push(b3); ptrs.push(b4);
  ptrs.push(b4); ptrs.push(b1);

  // Letter A
  // A tip is 'Top' (-Z), Legs are 'Bottom' (+Z)
  var aTop = vec4(0, y, -0.4, 1.0);
  var aBL = vec4(-0.3, y, 0.4, 1.0);
  var aBR = vec4(0.3, y, 0.4, 1.0);
  var aMidL = vec4(-0.15, y, 0, 1.0);
  var aMidR = vec4(0.15, y, 0, 1.0);
  ptrs.push(aBL); ptrs.push(aTop);
  ptrs.push(aTop); ptrs.push(aBR);
  ptrs.push(aMidL); ptrs.push(aMidR);

  numZoneAVertices = ptrs.length; // 8 for box + 6 for A = 14

  // --- Zone B Geometry ---
  // Box (Same)
  ptrs.push(b1); ptrs.push(b2);
  ptrs.push(b2); ptrs.push(b3);
  ptrs.push(b3); ptrs.push(b4);
  ptrs.push(b4); ptrs.push(b1);

  // Letter B
  var bTL = vec4(-0.3, y, -0.4, 1.0);
  var bBL = vec4(-0.3, y, 0.4, 1.0);
  var bTR = vec4(0.3, y, -0.4, 1.0); // Top Right
  var bBR = vec4(0.3, y, 0.4, 1.0); // Bot Right
  var bML = vec4(-0.3, y, 0.0, 1.0); // Mid Left
  var bMR = vec4(0.3, y, 0.0, 1.0); // Mid Right

  // Left Vertical
  ptrs.push(bTL); ptrs.push(bBL);
  // Top Horizontal
  ptrs.push(bTL); ptrs.push(bTR);
  // Middle Horizontal
  ptrs.push(bML); ptrs.push(bMR);
  // Bottom Horizontal
  ptrs.push(bBL); ptrs.push(bBR);
  // Right Vertical Top
  ptrs.push(bTR); ptrs.push(bMR);
  // Right Vertical Bottom
  ptrs.push(bMR); ptrs.push(bBR);

  return ptrs;
}
