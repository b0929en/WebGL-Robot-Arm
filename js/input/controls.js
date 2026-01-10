"use strict";

// =========================================================================
// INPUT CONTROLS (Keyboard / Mouse)
// =========================================================================

function setupMouseControls() {
  canvas.onmousedown = function (e) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };

  document.onmouseup = function (e) {
    isDragging = false;
  };

  document.onmousemove = function (e) {
    if (!isDragging) return;
    var dx = e.clientX - lastMouseX;
    var dy = e.clientY - lastMouseY;

    cameraAzimuth += dx * 0.5;
    cameraElevation += dy * 0.5;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };

  canvas.onwheel = function (e) {
    e.preventDefault();
    var delta = Math.sign(e.deltaY);
    zoomLevel += delta * 1.0;
    zoomLevel = Math.max(5.0, Math.min(50.0, zoomLevel));
  };
}

function setupKeyboard() {
  document.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();
    keys[key] = true;

    // Toggle Gripper immediately on press (not continuous)
    if (key === 'x') {
      targetTheta[Gripper] = (targetTheta[Gripper] > 80) ? 70 : 90;
      updateUI();
    }
  });

  document.addEventListener('keyup', function (event) {
    var key = event.key.toLowerCase();
    keys[key] = false;
  });
}

function handleKeys(deltaTime) {
  if (isAnimating) return;

  var speed = 100.0 * deltaTime; // Degrees per second

  // Base (A / D)
  if (keys['a'] || keys['arrowleft']) targetTheta[Base] = Math.max(-180, targetTheta[Base] - speed);
  if (keys['d'] || keys['arrowright']) targetTheta[Base] = Math.min(180, targetTheta[Base] + speed);

  // Lower Arm (W / S)
  if (keys['w'] || keys['arrowup']) targetTheta[LowerArm] = Math.min(60, targetTheta[LowerArm] + speed);
  if (keys['s'] || keys['arrowdown']) targetTheta[LowerArm] = Math.max(-60, targetTheta[LowerArm] - speed);

  // Upper Arm (Q / E)
  if (keys['q']) targetTheta[UpperArm] = Math.min(120, targetTheta[UpperArm] + speed);
  if (keys['e']) targetTheta[UpperArm] = Math.max(-120, targetTheta[UpperArm] - speed);

  // Gripper Base (Z / C)
  if (keys['z']) targetTheta[GripperBase] = Math.max(-60, targetTheta[GripperBase] - speed);
  if (keys['c']) targetTheta[GripperBase] = Math.min(60, targetTheta[GripperBase] + speed);

  // Sync UI if any key is pressed
  if (Object.values(keys).some(k => k)) {
    updateUI();
  }
}
