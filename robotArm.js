"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
];

// RGBA colors
var vertexColors = [
  vec4(0.0, 0.0, 0.0, 1.0),  // black
  vec4(1.0, 0.0, 0.0, 1.0),  // red
  vec4(1.0, 1.0, 0.0, 1.0),  // yellow
  vec4(0.0, 1.0, 0.0, 1.0),  // green
  vec4(0.0, 0.0, 1.0, 1.0),  // blue
  vec4(1.0, 0.0, 1.0, 1.0),  // magenta
  vec4(1.0, 1.0, 1.0, 1.0),  // white
  vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

// Parameters controlling the size of the Robot's arm
var BASE_HEIGHT = 1.0;
var BASE_WIDTH = 5.0;
var LOWER_ARM_HEIGHT = 8.0;
var LOWER_ARM_WIDTH = 0.5;
var UPPER_ARM_HEIGHT = 8.0;
var UPPER_ARM_WIDTH = 0.5;
var GRIPPER_BASE_HEIGHT = 0.5;
var GRIPPER_BASE_WIDTH = 1.0;
var GRIPPER_HEIGHT = 1.0;
var GRIPPER_WIDTH = 0.2;

// Shader transformation matrices
var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis
var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var GripperBase = 3;
var Gripper = 4;

// Weight Object 
var isObjectPicked = false;
var objectPosition = vec3(10.0, 0.0, 0.0);
var objectRotation = mat4(); // Identity matrix for rotation

// Ground
var GROUND_WIDTH = 40.0;
var GROUND_HEIGHT = 0.5;

// Physics Constants
var GRAVITY = 9.8;
var GROUND_Y = 0.4; // Slightly above 0 to prevent visual clipping

// Physics State
var velocity = vec3(0.0, 0.0, 0.0);
var lastTime = 0;

// Initial angles: Base, Lower, Upper, Gripper Base, Gripper
var theta = [0, 0, 0, 0, 40];

var modelViewMatrixLoc;

var vBuffer, cBuffer;

// Animation State
var isAnimating = false;
var animationStep = 0;
var animationCounter = 0;

// Keyframes for the animation sequence
// Format: [Base, Lower, Upper, Gripper Base, Gripper]
// Forward: Pick A -> Drop B
var keyframesForward = [
  [0, 0, 0, 0, 60],        // 0: Home
  [90, 0, 0, 0, 60],       // 1: Align with object A
  [90, 35, 115, -60, 60],  // 2: Reach Down A
  [90, 35, 115, -60, 40],  // 3: Grasp A (Close)
  [90, 10, 120, -40, 40],  // 4: Lift A
  [180, 10, 120, -40, 40], // 5: Move to Drop Zone B
  [180, 35, 115, -60, 40], // 6: Lower B
  [180, 35, 115, -60, 60], // 7: Release B (Open)
  [180, 10, 120, -40, 60], // 8: Lift Empty B
  [0, 0, 0, 0, 60]         // 9: Return Home
];

// Backward: Pick B -> Drop A
var keyframesBackward = [
  [0, 0, 0, 0, 60],        // 0: Home
  [180, 0, 0, 0, 60],      // 1: Align with object B
  [180, 35, 115, -60, 60], // 2: Reach Down B
  [180, 35, 115, -60, 40], // 3: Grasp B (Close)
  [180, 10, 120, -40, 40], // 4: Lift B
  [90, 10, 120, -40, 40],  // 5: Move to Drop Zone A
  [90, 35, 115, -60, 40],  // 6: Lower A
  [90, 35, 115, -60, 60],  // 7: Release A (Open)
  [90, 10, 120, -40, 60],  // 8: Lift Empty A
  [0, 0, 0, 0, 60]         // 9: Return Home
];

var keyframes = keyframesForward;
var isReturnCycle = false;




// Initialize the application
window.onload = function init() {
  lastTime = Date.now();
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 0.95, 0.95, 1.0); // Slightly lighter bg
  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  colorCube();

  // Position buffer
  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  // Color buffer
  cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // Initialize Sliders
  setupSliders();

  // Initialize Keyboard Controls
  document.addEventListener('keydown', function (event) {
    if (isAnimating) return; // Disable manual control during animation

    switch (event.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        theta[Base] = Math.max(-180, theta[Base] - 5);
        break;
      case 'd':
      case 'arrowright':
        theta[Base] = Math.min(180, theta[Base] + 5);
        break;
      case 'w':
      case 'arrowup':
        theta[LowerArm] = Math.min(60, theta[LowerArm] + 5);
        break;
      case 's':
      case 'arrowdown':
        theta[LowerArm] = Math.max(-60, theta[LowerArm] - 5);
        break;
      case 'q':
        theta[UpperArm] = Math.min(120, theta[UpperArm] + 5);
        break;
      case 'e':
        theta[UpperArm] = Math.max(-120, theta[UpperArm] - 5);
        break;
      case 'z': // Close Gripper
        theta[Gripper] = Math.max(0, theta[Gripper] - 5);
        break;
      case 'x': // Open Gripper
        theta[Gripper] = Math.min(60, theta[Gripper] + 5);
        break;
    }
    updateUI();
  });

  // Initialize Buttons
  document.getElementById("playBtn").onclick = startAnimation;
  document.getElementById("stopBtn").onclick = stopAnimation;
  document.getElementById("resetBtn").onclick = resetArm;

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

  projectionMatrix = ortho(-20, 20, -20, 20, -20, 20);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  render();
}

function setupSliders() {
  // Defines a helper to attach listener and update visual
  function attach(id, index, isGripper) {
    var el = document.getElementById(id);
    el.oninput = function (e) {
      theta[index] = Number(e.target.value);
      // Update display text
      var valId = "val" + (index + 1);
      if (isGripper) {
        document.getElementById(valId).innerText = theta[index] < 5 ? "Closed" : Math.round(theta[index]);
      } else {
        document.getElementById(valId).innerText = Math.round(theta[index]) + "°";
      }
    };
  }

  attach("slider1", Base, false);
  attach("slider2", LowerArm, false);
  attach("slider3", UpperArm, false);

  // Slider 4: Gripper Base (Index 3) - Rotation
  attach("slider4", GripperBase, false);

  // Slider 5: Gripper Fingers (Index 4) - Open/Close
  attach("slider5", Gripper, true);
}

function updateUI() {
  document.getElementById("slider1").value = theta[Base];
  document.getElementById("slider2").value = theta[LowerArm];
  document.getElementById("slider3").value = theta[UpperArm];
  document.getElementById("slider4").value = theta[GripperBase];
  document.getElementById("slider5").value = theta[Gripper];

  document.getElementById("val1").innerText = Math.round(theta[Base]) + "°";
  document.getElementById("val2").innerText = Math.round(theta[LowerArm]) + "°";
  document.getElementById("val3").innerText = Math.round(theta[UpperArm]) + "°";
  document.getElementById("val4").innerText = Math.round(theta[GripperBase]) + "°";
  document.getElementById("val5").innerText = theta[Gripper] < 5 ? "Closed" : Math.round(theta[Gripper]);
}

// Animation Control Functions
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
  theta = [0, 0, 0, 0, 40];

  // Reset Object State
  isObjectPicked = false;
  objectPosition = vec3(10.0, 0.0, 0.0);
  objectRotation = mat4();

  // Reset Animation Cycle
  isReturnCycle = false;
  keyframes = keyframesForward;

  updateUI();
  updateStatus("Reset");
}

function updateStatus(msg) {
  document.getElementById("status").innerText = "Status: " + msg;
}

// Animation Loop Logic
function handleAnimation() {
  var target = keyframes[animationStep];
  var done = true;
  var speed = 1.0;

  // Interpolate each joint
  for (var i = 0; i < 5; i++) {
    var diff = target[i] - theta[i];
    if (Math.abs(diff) > 0.5) {
      theta[i] += diff * 0.05; // Smooth transition
      done = false;
    } else {
      theta[i] = target[i];
    }
  }

  // Update picked state moved to updatePickingState() called in render()

  updateUI(); // Keep sliders in sync during animation

  if (done) {
    animationCounter++;
    if (animationCounter > 20) { // Pause at keyframe
      animationStep++;
      animationCounter = 0;
      if (animationStep >= keyframes.length) {
        // Animation sequence complete. Switch direction.
        animationStep = 0;
        isReturnCycle = !isReturnCycle;

        if (isReturnCycle) {
          keyframes = keyframesBackward;
          updateStatus("Returning (Cycle 2)...");
        } else {
          keyframes = keyframesForward;
          updateStatus("Running Sequence (Cycle 1)...");
        }
      }
    }
  }
}




// Geometry Helpers
function quad(a, b, c, d) {
  colors.push(vertexColors[a]);
  points.push(vertices[a]);
  colors.push(vertexColors[a]);
  points.push(vertices[b]);
  colors.push(vertexColors[a]);
  points.push(vertices[c]);
  colors.push(vertexColors[a]);
  points.push(vertices[a]);
  colors.push(vertexColors[a]);
  points.push(vertices[c]);
  colors.push(vertexColors[a]);
  points.push(vertices[d]);
}

function colorCube() {
  quad(1, 0, 3, 2);
  quad(2, 3, 7, 6);
  quad(3, 0, 4, 7);
  quad(6, 5, 1, 2);
  quad(4, 5, 6, 7);
  quad(5, 4, 0, 1);
}

// Drawing Functions
function ground() {
  var s = scale(GROUND_WIDTH, GROUND_HEIGHT, GROUND_WIDTH);
  var instanceMatrix = mult(translate(0.0, -0.5 * GROUND_HEIGHT, 0.0), s);
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function actualBase() {
  var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function base() {
  var s = scale(1.5, 1.5, 1.5);
  var instanceMatrix = mult(translate(0.0, 0.5, 0.0), s);
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function upperArm() {
  var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function lowerArm() {
  var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function gripperBase() {
  var s = scale(GRIPPER_BASE_WIDTH, GRIPPER_BASE_HEIGHT, GRIPPER_BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * GRIPPER_BASE_HEIGHT, 0.0), s);
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function gripper() {
  // Scale for gripper fingers
  var s = scale(GRIPPER_WIDTH, GRIPPER_HEIGHT, GRIPPER_WIDTH);

  // Distance between fingers is controlled by theta[Gripper]
  // Map 0-60 range to 0.1-0.4 distance
  var d = 0.15 + (theta[Gripper] / 200.0);

  // Left Finger
  var instanceMatrix1 = mult(translate(d, 0.5 * GRIPPER_HEIGHT, 0.0), s);
  var t1 = mult(modelViewMatrix, instanceMatrix1);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t1));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

  // Right Finger
  var instanceMatrix2 = mult(translate(-d, 0.5 * GRIPPER_HEIGHT, 0.0), s);
  var t2 = mult(modelViewMatrix, instanceMatrix2);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t2));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function weightObject() {
  var s = scale(0.8, 0.8, 0.8);
  var instanceMatrix = s;
  var t = mult(modelViewMatrix, instanceMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
  gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function updatePhysics(deltaTime) {
  if (isObjectPicked) {
    velocity = vec3(0, 0, 0); // Reset velocity while holding
  } else {
    // Apply Gravity
    velocity[1] -= GRAVITY * deltaTime;

    // Apply Velocity to Position
    objectPosition[0] += velocity[0] * deltaTime;
    objectPosition[1] += velocity[1] * deltaTime;
    objectPosition[2] += velocity[2] * deltaTime;

    // Ground Collision Detection
    // Ground level defined at objectPosition.y = GROUND_Y
    if (objectPosition[1] <= GROUND_Y) {
      objectPosition[1] = GROUND_Y;

      // Simple Bounce / Stop
      if (Math.abs(velocity[1]) > 0.5) {
        velocity[1] *= -0.3; // Bounce damping
      } else {
        velocity[1] = 0;
      }

      // Friction (simple stop)
      velocity[0] *= 0.9;
      velocity[2] *= 0.9;
    }
  }
}

function render() {
  // Calculate Delta Time
  var now = Date.now();
  var deltaTime = (now - lastTime) / 1000.0;
  lastTime = now;

  // prevent huge dt jumps (e.g. switching tabs)
  if (deltaTime > 0.1) deltaTime = 0.016;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Update Physics
  updatePhysics(deltaTime);

  if (isAnimating) {
    handleAnimation();
  }

  // Check picking every frame (Manual + Animation)
  updatePickingState();

  var worldMatrix = mat4();
  worldMatrix = mult(worldMatrix, rotate(-30, vec3(1, 0, 0)));
  worldMatrix = mult(worldMatrix, rotate(45, vec3(0, 1, 0)));

  modelViewMatrix = mult(worldMatrix, translate(0.0, -5.0, 0.0));
  ground();
  actualBase();

  // Base
  modelViewMatrix = mult(modelViewMatrix, rotate(theta[Base], vec3(0, 0.5, 0)));
  base();

  // Lower Arm
  modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
  modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(1, 0, 0)));
  lowerArm();

  // Upper Arm
  modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
  modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(1, 0, 0)));
  upperArm();

  // Gripper
  // Translate to end of Upper Arm
  modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));

  // Apply Gripper Base Rotation (Around Y-axis of arm)
  modelViewMatrix = mult(modelViewMatrix, rotate(theta[GripperBase], vec3(1, 0, 0)));
  gripperBase();

  modelViewMatrix = mult(modelViewMatrix, translate(0.0, GRIPPER_BASE_HEIGHT, 0.0));
  gripper();

  // Weight Object
  var gripperMatrix = modelViewMatrix;

  if (isObjectPicked) {
    modelViewMatrix = mult(modelViewMatrix, translate(0, GRIPPER_BASE_HEIGHT, 0));
    weightObject();
  } else {
    modelViewMatrix = worldMatrix;
    modelViewMatrix = mult(modelViewMatrix, translate(objectPosition[0], objectPosition[1] - 5.0, objectPosition[2]));
    modelViewMatrix = mult(modelViewMatrix, objectRotation);

    weightObject();
  }

  modelViewMatrix = gripperMatrix;

  requestAnimationFrame(render);
}