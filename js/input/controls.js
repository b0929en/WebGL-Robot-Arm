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
      theta[Gripper] = (theta[Gripper] > 80) ? 70 : 90;
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
  if (keys['a'] || keys['arrowleft']) theta[Base] = Math.max(-180, theta[Base] - speed);
  if (keys['d'] || keys['arrowright']) theta[Base] = Math.min(180, theta[Base] + speed);

  // Lower Arm (W / S)
  if (keys['w'] || keys['arrowup']) theta[LowerArm] = Math.min(60, theta[LowerArm] + speed);
  if (keys['s'] || keys['arrowdown']) theta[LowerArm] = Math.max(-60, theta[LowerArm] - speed);

  // Upper Arm (Q / E)
  if (keys['q']) theta[UpperArm] = Math.min(120, theta[UpperArm] + speed);
  if (keys['e']) theta[UpperArm] = Math.max(-120, theta[UpperArm] - speed);

  // Gripper Base (Z / C)
  if (keys['z']) theta[GripperBase] = Math.max(-60, theta[GripperBase] - speed);
  if (keys['c']) theta[GripperBase] = Math.min(60, theta[GripperBase] + speed);

  // Sync UI if any key is pressed
  if (Object.values(keys).some(k => k)) {
    updateUI();
  }
}
