"use strict";

// =========================================================================
// KEYFRAME DATA
// =========================================================================

var keyframesForward = [
  [0, 30, -60, -60, 90],   // 0: Home
  [-90, 30, -60, -60, 90],  // 1: Align with object A
  [-90, -40, -111, 61, 90],  // 2: Reach Down A
  [-90, -40, -111, 61, 70],  // 3: Grasp A (Close)
  [-90, -10, -120, 40, 70],  // 4: Lift A
  [90, -10, -120, 40, 70], // 5: Move to Drop Zone B
  [90, -40, -111, 61, 70], // 6: Lower B
  [90, -40, -111, 61, 90], // 7: Release B (Open)
  [90, 30, -60, -60, 90]   // 8: Return Home
];

var keyframesBackward = [
  [90, 30, -60, -60, 90],        // 0: Home
  [90, -40, -111, 61, 90], // 1: Reach Down B
  [90, -40, -111, 61, 70], // 2: Grasp B (Close)
  [90, -10, -120, 40, 70], // 3: Lift B
  [-90, -10, -120, 40, 70],  // 4: Move to Drop Zone A
  [-90, -40, -111, 61, 70],  // 5: Lower A
  [-90, -40, -111, 61, 90],  // 6: Release A (Open)
  [-90, -10, -120, 40, 90],  // 7: Lift Empty A
  [0, 30, -60, -60, 90]         // 8: Return Home
];

var keyframes = keyframesForward;
