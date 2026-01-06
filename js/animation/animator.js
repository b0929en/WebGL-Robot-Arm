"use strict";

// =========================================================================
// ANIMATION LOGIC
// =========================================================================

function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;
  animationStep = 0;
  updateStatus("Running Sequence...");
}

function stopAnimation() {
  isAnimating = false;
  updateStatus("Stopped");
}

function resetArm() {
  stopAnimation();
  theta = [0, 30, -60, -60, 90];
  isObjectPicked = false;
  objectPosition = vec3(10.0, 0.0, 0.0);
  objectRotation = mult(rotate(-90, vec3(0, 1, 0)), rotate(-90, vec3(1, 0, 0)));
  isReturnCycle = false;
  keyframes = keyframesForward;
  settlingState = null;
  velocity = vec3(0, 0, 0);

  updateUI();
  updateStatus("Reset");
}

function handleAnimation() {
  var target = keyframes[animationStep];
  var done = true;

  for (var i = 0; i < 5; i++) {
    var diff = target[i] - theta[i];
    if (Math.abs(diff) > 0.5) {
      theta[i] += diff * 0.05;
      done = false;
    } else {
      theta[i] = target[i];
    }
  }

  updateUI();

  if (done) {
    animationCounter++;
    if (animationCounter > 20) {
      animationStep++;
      animationCounter = 0;
      if (animationStep >= keyframes.length) {
        animationStep = 0;
        isReturnCycle = !isReturnCycle;
        keyframes = isReturnCycle ? keyframesBackward : keyframesForward;
        updateStatus(isReturnCycle ? "Returning (Cycle 2)..." : "Running Sequence (Cycle 1)...");
      }
    }
  }
}
