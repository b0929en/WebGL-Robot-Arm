"use strict";

// Picking State Management
// Requires globals from robotArm.js: 
// theta, Base, LowerArm, UpperArm, GripperBase, Gripper, 
// isObjectPicked, objectPosition, objectRotation
// BASE_HEIGHT, LOWER_ARM_HEIGHT, UPPER_ARM_HEIGHT, GRIPPER_BASE_HEIGHT

function updatePickingState() {
  // Threshold for picking (distance)
  var threshold = 5.0;
  var pickingThresholdAngle = 42;
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
      if (isAboveGround) {
        // CONSTRAINT: Cannot open gripper if object is in air
        theta[Gripper] = 40; // Force closed
        // Update UI to reflect forced value
        document.getElementById("slider5").value = 40;
        document.getElementById("val5").innerText = "Closed";
      } else {
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
      }
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

  // Add offset to where the object is held (approx -2.5 down from base if hanging)
  // But for "Tip" position we might want just the base center.
  // Let's use the Base position for calculation consistency.

  return m;
}

function checkCollision(threshold) {
  var gripperMatrix = getGripperTransform();
  var gripperPos = vec3(gripperMatrix[0][3], gripperMatrix[1][3], gripperMatrix[2][3]);

  // Object Position (Relative to Scene)
  // objectPosition is vec3(x, y, z) relative to Scene Origin
  // NOTE: In robotArm.js logic, render loop uses translate(objectPosition).
  // So object is at SceneOrigin * T(objectPosition).
  // Our gripperMatrix is relative to SceneOrigin.
  // So we can compare directly.

  // The previous logic in robotArm.js subtracted 5.0 from Y because 
  // it was comparing World Coord FK (SceneOrigin included -5) vs Local Object Pos.
  // Here transform is Local to Scene.

  var objPos = objectPosition;

  var dx = gripperPos[0] - objPos[0];
  var dy = gripperPos[1] - objPos[1];
  var dz = gripperPos[2] - objPos[2];
  var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return dist < threshold;
}
