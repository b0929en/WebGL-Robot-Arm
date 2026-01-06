"use strict";

// =========================================================================
// PHYSICS ENGINE
// =========================================================================

// Helper: Transform local vertex to world space
function getCornerPos(localPos, center, rotMat) {
  var x = localPos[0], y = localPos[1], z = localPos[2];
  var rx = rotMat[0][0] * x + rotMat[0][1] * y + rotMat[0][2] * z;
  var ry = rotMat[1][0] * x + rotMat[1][1] * y + rotMat[1][2] * z;
  var rz = rotMat[2][0] * x + rotMat[2][1] * y + rotMat[2][2] * z;
  return vec3(center[0] + rx, center[1] + ry, center[2] + rz);
}

// Main Physics Update Loop
// assumes globals: isObjectPicked, objectPosition, objectRotation
function updatePhysics(deltaTime) {
  if (isObjectPicked) {
    velocity = vec3(0, 0, 0);
    settlingState = null;
    return;
  }

  if (settlingState !== null) {
    velocity = vec3(0, 0, 0);
  } else {
    velocity[1] -= GRAVITY * deltaTime;
  }

  // Predict step
  var predY = objectPosition[1] + velocity[1] * deltaTime;
  var h = 0.4;
  var localCorners = [
    vec3(h, h, h), vec3(-h, h, h), vec3(h, -h, h), vec3(-h, -h, h),
    vec3(h, h, -h), vec3(-h, h, -h), vec3(h, -h, -h), vec3(-h, -h, -h)
  ];

  // Ground check
  var curMinY = 1000, curMinIdx = -1;
  var predPos = vec3(objectPosition[0] + velocity[0] * deltaTime, predY, objectPosition[2] + velocity[2] * deltaTime);

  for (var i = 0; i < 8; i++) {
    var wc = getCornerPos(localCorners[i], predPos, objectRotation);
    if (wc[1] < curMinY) { curMinY = wc[1]; curMinIdx = i; }
  }

  var groundLevel = 0.0;

  if (curMinY <= groundLevel || settlingState !== null) {
    // --- COLLISION / SETTLING ---
    velocity = vec3(0, 0, 0);

    if (settlingState === null) {
      // New Landing
      var bestPivotIdx = curMinIdx;
      var pivot = getCornerPos(localCorners[bestPivotIdx], objectPosition, objectRotation);

      // A. Stability Pre-Check
      var worldUp = vec3(0, 1, 0);
      var right = vec3(objectRotation[0][0], objectRotation[1][0], objectRotation[2][0]);
      var up = vec3(objectRotation[0][1], objectRotation[1][1], objectRotation[2][1]);
      var fwd = vec3(objectRotation[0][2], objectRotation[1][2], objectRotation[2][2]);

      var candidates = [
        { vec: up, index: 1, sign: 1 }, { vec: negate(up), index: 1, sign: -1 },
        { vec: right, index: 0, sign: 1 }, { vec: negate(right), index: 0, sign: -1 },
        { vec: fwd, index: 2, sign: 1 }, { vec: negate(fwd), index: 2, sign: -1 }
      ];

      var stabilityDot = -2.0;
      var stableFace = candidates[0];
      for (var i = 0; i < candidates.length; i++) {
        var d = dot(candidates[i].vec, worldUp);
        if (d > stabilityDot) { stabilityDot = d; stableFace = candidates[i]; }
      }

      var targetIndex, targetSign;

      if (stabilityDot > 0.99) {
        // Already Stable
        targetIndex = stableFace.index;
        targetSign = stableFace.sign;
      } else {
        // Tipping Needed
        var comVector = subtract(objectPosition, pivot);
        if (length(comVector) < 0.001) comVector = vec3(0, 1, 0);
        comVector = normalize(comVector);

        var maxDot = -2.0;
        var fallFace = candidates[0];
        for (var i = 0; i < candidates.length; i++) {
          var d = dot(candidates[i].vec, comVector);
          if (d > maxDot) { maxDot = d; fallFace = candidates[i]; }
        }
        targetIndex = fallFace.index;
        targetSign = -fallFace.sign;
      }

      settlingState = { pivotIdx: bestPivotIdx, faceIndex: targetIndex, faceSign: targetSign };
    }

    // Execute Settling
    var pivot = getCornerPos(localCorners[settlingState.pivotIdx], objectPosition, objectRotation);
    var lift = groundLevel - pivot[1];
    objectPosition[1] += lift;
    pivot[1] += lift;

    var worldUp = vec3(0, 1, 0);
    var colIdx = settlingState.faceIndex;
    var colVec = vec3(objectRotation[0][colIdx], objectRotation[1][colIdx], objectRotation[2][colIdx]);
    if (settlingState.faceSign < 0) colVec = negate(colVec);

    var currentAxis = colVec;
    var d = dot(currentAxis, worldUp);

    if (d > 0.995) {
      // Final Snap
      var targetAxis = worldUp;
      currentAxis = normalize(currentAxis);
      var snapAxis = cross(currentAxis, targetAxis);
      var snapDot = dot(currentAxis, targetAxis);

      if (length(snapAxis) > 0.0001) {
        snapAxis = normalize(snapAxis);
        var snapAngle = Math.acos(Math.min(1, snapDot)) * 180 / Math.PI;
        objectRotation = mult(rotate(snapAngle, snapAxis), objectRotation);
      }

      objectPosition[1] = h; // Final Height Correct
      settlingState = null;
      return;
    } else {
      // Animate
      var rotAxis = cross(currentAxis, worldUp);
      var angleDiff = Math.acos(Math.max(-1, Math.min(1, d))) * (180 / Math.PI);

      if (length(rotAxis) > 0.001) {
        rotAxis = normalize(rotAxis);
        var speed = 150 * deltaTime;
        var step = Math.min(speed, angleDiff);
        var R_step = rotate(step, rotAxis);
        objectRotation = mult(R_step, objectRotation);

        var p_to_c = subtract(objectPosition, pivot);
        var rx = R_step[0][0] * p_to_c[0] + R_step[0][1] * p_to_c[1] + R_step[0][2] * p_to_c[2];
        var ry = R_step[1][0] * p_to_c[0] + R_step[1][1] * p_to_c[1] + R_step[1][2] * p_to_c[2];
        var rz = R_step[2][0] * p_to_c[0] + R_step[2][1] * p_to_c[1] + R_step[2][2] * p_to_c[2];
        objectPosition = vec3(pivot[0] + rx, pivot[1] + ry, pivot[2] + rz);
      }
    }
  } else {
    // Falling
    objectPosition[0] += velocity[0] * deltaTime;
    objectPosition[1] += velocity[1] * deltaTime;
    objectPosition[2] += velocity[2] * deltaTime;
  }
}

// =========================================================================
// PICKING LOGIC (Moved from picking.js)
// =========================================================================

function updatePickingState() {
  // Threshold for picking (distance)
  var threshold = 5.0;
  var pickingThresholdAngle = 80;
  var gripperAngle = theta[Gripper];

  // Calculate Gripper Transform (FK) relative to Scene
  var gripperMatrix = getGripperTransform();
  var gripperPosition = vec3(gripperMatrix[0][3], gripperMatrix[1][3], gripperMatrix[2][3]);

  // Ground Level check
  // Gripper Height > roughly 2.0 (Account for base height + object offset)
  var groundThreshold = 2.0;
  var isAboveGround = gripperPosition[1] > groundThreshold;

  if (isObjectPicked) {
    // Handling Release
    if (gripperAngle > pickingThresholdAngle) {
      // Release Object
      isObjectPicked = false;
      // Update Object Position/Rotation to stay where it was dropped
      // New Position is Gripper Position (minus offset if needed, but let's say it drops at gripper center)
      objectPosition = vec3(gripperPosition[0], gripperPosition[1], gripperPosition[2]);

      // Update Rotation
      // Zero out translation from matrix to get rotation only
      var rot = mat4(
        gripperMatrix[0][0], gripperMatrix[0][1], gripperMatrix[0][2], 0,
        gripperMatrix[1][0], gripperMatrix[1][1], gripperMatrix[1][2], 0,
        gripperMatrix[2][0], gripperMatrix[2][1], gripperMatrix[2][2], 0,
        0, 0, 0, 1
      );
      objectRotation = rot;

      // If we are high up, the physics engine in robotArm.js / physics.js will take care of falling.
    }
  } else {
    // Handling Pick
    if (gripperAngle <= pickingThresholdAngle) {
      if (checkCollision(threshold)) {
        isObjectPicked = true;
      }
    }
  }
}

// Forward Kinematics to finding gripper Transform relative to Scene
function getGripperTransform() {
  // Start with Identity (Scene Origin relative to Scene Origin is Identity)
  var m = mat4();

  // 1. Base Rotation (Y-axis)
  m = mult(m, rotate(theta[Base], vec3(0, 1, 0)));

  // 2. Move to Lower Arm Base
  m = mult(m, translate(0.0, BASE_HEIGHT, 0.0));
  // Rotation
  m = mult(m, rotate(theta[LowerArm], vec3(1, 0, 0)));

  // 3. Move to Upper Arm Base
  m = mult(m, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
  // Rotation
  m = mult(m, rotate(theta[UpperArm], vec3(1, 0, 0)));

  // 4. Move to Gripper Base
  m = mult(m, translate(0.0, UPPER_ARM_HEIGHT, 0.0));
  // Rotation
  m = mult(m, rotate(theta[GripperBase], vec3(1, 0, 0)));

  // 5. Move to Gripper Fingers Base / Tip
  m = mult(m, translate(0.0, GRIPPER_BASE_HEIGHT, 0.0));

  // EXTRA VISUAL OFFSET matching robotArm.js logic
  m = mult(m, translate(0.0, GRIPPER_BASE_HEIGHT, 0.0));

  return m;
}

function checkCollision(threshold) {
  var gripperMatrix = getGripperTransform();
  var gripperPos = vec3(gripperMatrix[0][3], gripperMatrix[1][3], gripperMatrix[2][3]);

  var objPos = objectPosition;

  var dx = gripperPos[0] - objPos[0];
  var dy = gripperPos[1] - objPos[1];
  var dz = gripperPos[2] - objPos[2];
  var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return dist < threshold;
}
