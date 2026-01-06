"use strict";

// =========================================================================
// KEYFRAME DATA
// =========================================================================

var keyframesForward = [
  [0, 30, -60, -60, 80],   // 0: Home
  [-90, 30, -60, -60, 80],  // 1: Align with object A
  [-90, -40, -110, 60, 80],  // 2: Reach Down A
  [-90, -40, -110, 60, 60],  // 3: Grasp A (Close)
  [-90, -10, -120, 40, 60],  // 4: Lift A
  [90, -10, -120, 40, 60], // 5: Move to Drop Zone B
  [90, -40, -110, 60, 60], // 6: Lower B
  [90, -40, -110, 60, 80], // 7: Release B (Open)
  [90, 30, -60, -60, 80]   // 8: Return Home
];

var keyframesBackward = [
  [90, 30, -60, -60, 80],        // 0: Home
  [90, -40, -110, 60, 80], // 1: Reach Down B
  [90, -40, -110, 60, 60], // 2: Grasp B (Close)
  [90, -10, -120, 40, 60], // 3: Lift B
  [-90, -10, -120, 40, 60],  // 4: Move to Drop Zone A
  [-90, -40, -110, 60, 60],  // 5: Lower A
  [-90, -40, -110, 60, 80],  // 6: Release A (Open)
  [-90, -10, -120, 40, 80],  // 7: Lift Empty A
  [0, 30, -60, -60, 80]         // 8: Return Home
];

var keyframes = keyframesForward;
