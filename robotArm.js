"use strict";

// =========================================================================
// GLOBAL VARIABLES & CONSTANTS
// =========================================================================

var canvas, gl, program;

// --- Geometry Parameters ---
var NumVertices = 36;

var ACTUAL_BASE_HEIGHT = 1.0;
var ACTUAL_BASE_WIDTH = 5.0;
var BASE_HEIGHT = 1.5;
var BASE_WIDTH = 3.0;
var JOINT_LENGTH = 0.8;
var JOINT_HEIGHT = 1.2;
var JOINT_WIDTH = 1.2;
var LOWER_ARM_HEIGHT = 8.0;
var LOWER_ARM_WIDTH = 0.5;
var UPPER_ARM_HEIGHT = 8.0;
var UPPER_ARM_WIDTH = 0.5;
var GRIPPER_BASE_LENGTH = 1.4;
var GRIPPER_BASE_HEIGHT = 0.5;
var GRIPPER_BASE_WIDTH = 0.8;
var GRIPPER_HEIGHT = 1.0;
var GRIPPER_WIDTH = 0.2;
var GRIPPER_LENGTH = 0.8;

var GROUND_WIDTH = 30.0;
var GROUND_HEIGHT = 0.5;

// --- Application State ---
// Joints: Base, Lower, Upper, Gripper Base, Gripper
var theta = [0, 30, -60, -60, 80];

// Weight Object State
var isObjectPicked = false;
var objectPosition = vec3(10.0, 0.0, 0.0);
var objectRotation = mat4();
var lastTime = 0;

// Animation State
var isAnimating = false;
var animationStep = 0;
var animationCounter = 0;
var isReturnCycle = false;

// Camera State
var cameraAzimuth = 45;
var cameraElevation = 30;
var zoomLevel = 20.0; // Initial Zoom
var isDragging = false;
var lastMouseX = 0;
var lastMouseY = 0;

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

// --- WebGL Globals ---
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc;
var uUseSolidColorLoc, uSolidColorLoc;
var vColor, vPosition;
var points = [];
var colors = [];

// Buffers
var vBufferRobot, cBufferRobot;
var vBufferGround, cBufferGround;
var vBufferObject, cBufferObject;
var vBufferZone, cBufferZone;
var vBufferJoint, cBufferJoint;

// Vertex Counts
var numRobotVertices = 0;
var numGroundVertices = 0;
var numObjectVertices = 0;
var numZoneVertices = 0;
var numZoneAVertices = 0;
var numJointVertices = 0;

// --- Colors & Palettes ---

// Ground palette (uniform)
// --- Colors ---
var COLOR_ZONE = vec4(1.0, 1.0, 1.0, 1.0);

// Joint Indices
var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var GripperBase = 3;
var Gripper = 4;

// --- Vertex Data ---
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

var robotVertexColors = [
  vec4(0.0, 0.0, 0.0, 1.0),
  vec4(0.6, 0.6, 0.6, 1.0),
  vec4(0.8, 0.8, 0.8, 1.0),
  vec4(0.4, 0.4, 0.4, 1.0),
  vec4(0.6, 0.6, 0.6, 1.0),
  vec4(0.8, 0.8, 0.8, 1.0),
  vec4(0.9, 0.9, 0.9, 1.0),
  vec4(0.0, 1.0, 1.0, 1.0)
];

var objectVertexColors = [
  vec4(0.9, 0.7, 0.2, 1.0),
  vec4(0.9, 0.7, 0.2, 0.8), // bottom
  vec4(0.9, 0.7, 0.2, 1.0), // side
  vec4(0.9, 0.7, 0.2, 0.9), // side
  vec4(0.9, 0.7, 0.2, 0.8), // top
  vec4(0.9, 0.7, 0.2, 1.0), // side
  vec4(0.9, 0.7, 0.2, 0.9), // side
  vec4(0.9, 0.7, 0.2, 1.0)
];

var jointVertexColors = [
  vec4(0.3, 0.3, 0.3, 1.0),
  vec4(0.3, 0.3, 0.3, 1.0), // side
  vec4(0.3, 0.3, 0.3, 0.9), // side
  vec4(0.3, 0.3, 0.3, 0.8), // bottom
  vec4(0.3, 0.3, 0.3, 1.0), // side
  vec4(0.3, 0.3, 0.3, 0.9), // side
  vec4(0.3, 0.3, 0.3, 0.85), // top
  vec4(0.9, 0.7, 0.1, 1.0)
];

var groundVertexColors = [
  vec4(0.5, 0.3, 0.3, 1.0),
  vec4(0.6, 0.4, 0.4, 1.0),
  vec4(0.7, 0.5, 0.5, 1.0),
  vec4(0.4, 0.2, 0.2, 1.0),
  vec4(0.6, 0.4, 0.4, 1.0),
  vec4(0.7, 0.5, 0.5, 1.0),
  vec4(0.5, 0.3, 0.3, 1.0),
  vec4(0.5, 0.3, 0.3, 1.0)
];

// =========================================================================
// INITIALIZATION
// =========================================================================

window.onload = function init() {
  lastTime = Date.now();
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 0.95, 0.95, 1.0);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Initialize Attributes
  vPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(vPosition);
  vColor = gl.getAttribLocation(program, "aColor");
  gl.enableVertexAttribArray(vColor);

  points = []; colors = [];
  robotCube();
  var robotPoints = points.slice();
  var robotColors = colors.slice();
  numRobotVertices = robotPoints.length;

  points = []; colors = [];
  groundCube();
  var groundPoints = points.slice();
  var groundColors = colors.slice();
  numGroundVertices = groundPoints.length;

  points = []; colors = [];
  objectCube();
  var objectPoints = points.slice();
  var objectColors = colors.slice();
  numObjectVertices = objectPoints.length;

  // 4. Drop Zone (Lines)
  var zonePoints = generateDropZoneGeometry();
  var zoneColors = [];
  for (var i = 0; i < zonePoints.length; i++) zoneColors.push(COLOR_ZONE);
  numZoneVertices = zonePoints.length;

  // --- Create Buffers ---

  // Robot
  vBufferRobot = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferRobot);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(robotPoints), gl.STATIC_DRAW);

  cBufferRobot = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBufferRobot);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(robotColors), gl.STATIC_DRAW);

  // Ground
  vBufferGround = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferGround);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(groundPoints), gl.STATIC_DRAW);

  cBufferGround = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBufferGround);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(groundColors), gl.STATIC_DRAW);

  // Object
  vBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(objectPoints), gl.STATIC_DRAW);

  cBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(objectColors), gl.STATIC_DRAW);

  // Joint Box
  points = []; colors = [];
  jointCube();
  var jointPoints = points.slice();
  var jointColors = colors.slice();
  numJointVertices = jointPoints.length;

  vBufferJoint = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferJoint);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(jointPoints), gl.STATIC_DRAW);

  cBufferJoint = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBufferJoint);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(jointColors), gl.STATIC_DRAW);

  // Buffer Zone
  vBufferZone = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferZone);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(zonePoints), gl.STATIC_DRAW);

  cBufferZone = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBufferZone);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(zoneColors), gl.STATIC_DRAW);

  // Bind Robot Buffer (Default for generic components)
  gl.bindBuffer(gl.ARRAY_BUFFER, vBufferRobot);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cBufferRobot);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

  // Initialize UI & Controls
  setupSliders();
  setupKeyboard();
  setupMouseControls();
  setupButtons();

  // Shader Uniforms
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  uUseSolidColorLoc = gl.getUniformLocation(program, "uUseSolidColor");
  uSolidColorLoc = gl.getUniformLocation(program, "uSolidColor");

  projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

  resetArm();
  render();
};


// =========================================================================
// UI & CONTROLS
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

    // Clamp elevation slightly to prevent confusing flips if desired
    // cameraElevation = Math.max(-85, Math.min(85, cameraElevation));

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

function setupSliders() {
  function attach(id, index, isGripper) {
    var el = document.getElementById(id);
    el.oninput = function (e) {
      theta[index] = Number(e.target.value);
      var valId = "val" + (index + 1);
      if (isGripper) {
        document.getElementById(valId).innerText = theta[index] < 70 ? "Closed" : "Open";
      } else {
        document.getElementById(valId).innerText = Math.round(theta[index]) + "°";
      }
    };
  }

  attach("slider1", Base, false);
  attach("slider2", LowerArm, false);
  attach("slider3", UpperArm, false);
  attach("slider4", GripperBase, false);
  attach("slider5", Gripper, true);
}

function setupKeyboard() {
  document.addEventListener('keydown', function (event) {
    if (isAnimating) return;

    switch (event.key.toLowerCase()) {
      case 'a':
      case 'arrowleft': theta[Base] = Math.max(-180, theta[Base] - 5); break;
      case 'd':
      case 'arrowright': theta[Base] = Math.min(180, theta[Base] + 5); break;
      case 'w':
      case 'arrowup': theta[LowerArm] = Math.min(60, theta[LowerArm] + 5); break;
      case 's':
      case 'arrowdown': theta[LowerArm] = Math.max(-60, theta[LowerArm] - 5); break;
      case 'q': theta[UpperArm] = Math.min(120, theta[UpperArm] + 5); break;
      case 'e': theta[UpperArm] = Math.max(-120, theta[UpperArm] - 5); break;
      case 'z': theta[GripperBase] = Math.max(-60, theta[GripperBase] - 5); break;
      case 'c': theta[GripperBase] = Math.min(60, theta[GripperBase] + 5); break;
      case 'x': theta[Gripper] = (theta[Gripper] > 70) ? 60 : 80; break;
    }
    updateUI();
  });
}

function setupButtons() {
  document.getElementById("playBtn").onclick = startAnimation;
  document.getElementById("stopBtn").onclick = stopAnimation;
  document.getElementById("resetBtn").onclick = resetArm;
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
  document.getElementById("val5").innerText = theta[Gripper] < 70 ? "Closed" : "Open";
}

function updateStatus(msg) {
  document.getElementById("status").innerText = "Status: " + msg;
}


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
  theta = [0, 30, -60, -60, 80];
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

// =========================================================================
// RENDER LOOP
// =========================================================================

function render() {
  var now = Date.now();
  var deltaTime = (now - lastTime) / 1000.0;
  lastTime = now;
  if (deltaTime > 0.1) deltaTime = 0.016;

  // Update Projection
  projectionMatrix = ortho(-zoomLevel, zoomLevel, -zoomLevel, zoomLevel, -50, 50);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  updatePhysics(deltaTime);
  if (isAnimating) handleAnimation();
  updatePickingState();

  var worldMatrix = mat4();
  worldMatrix = mult(worldMatrix, rotate(-cameraElevation, vec3(1, 0, 0)));
  worldMatrix = mult(worldMatrix, rotate(cameraAzimuth, vec3(0, 1, 0)));

  modelViewMatrix = mult(worldMatrix, translate(0.0, -5.0, 0.0));
  ground();
  actualBase();

  // Joint Hierarchy
  modelViewMatrix = mult(modelViewMatrix, rotate(theta[Base], vec3(0, 0.5, 0)));
  base();

  modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
  jointBox();

  modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(1, 0, 0)));
  lowerArm();

  modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
  jointBox();

  modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(1, 0, 0)));
  upperArm();

  // Gripper
  modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));
  modelViewMatrix = mult(modelViewMatrix, rotate(theta[GripperBase], vec3(1, 0, 0)));
  gripperBase();

  modelViewMatrix = mult(modelViewMatrix, translate(0.0, GRIPPER_BASE_HEIGHT, 0.0));
  gripper();

  // Drop Zone A
  var savedMatrix = modelViewMatrix;
  modelViewMatrix = worldMatrix;
  modelViewMatrix = mult(modelViewMatrix, translate(10.0, -5.0, 0.0));
  drawDropZoneA();

  // Drop Zone B
  modelViewMatrix = worldMatrix;
  modelViewMatrix = mult(modelViewMatrix, translate(-10.0, -5.0, 0.0));
  drawDropZoneB();

  modelViewMatrix = savedMatrix;

  // Object
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


// =========================================================================
// GEOMETRY & DRAWING HELPERS
// =========================================================================

// --- Drop Zone Geometry ---
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

function robotQuad(a, b, c, d) {
  colors.push(robotVertexColors[a]); points.push(vertices[a]);
  colors.push(robotVertexColors[a]); points.push(vertices[b]);
  colors.push(robotVertexColors[a]); points.push(vertices[c]);
  colors.push(robotVertexColors[a]); points.push(vertices[a]);
  colors.push(robotVertexColors[a]); points.push(vertices[c]);
  colors.push(robotVertexColors[a]); points.push(vertices[d]);
}

function objectQuad(a, b, c, d) {
  colors.push(objectVertexColors[a]); points.push(vertices[a]);
  colors.push(objectVertexColors[a]); points.push(vertices[b]);
  colors.push(objectVertexColors[a]); points.push(vertices[c]);
  colors.push(objectVertexColors[a]); points.push(vertices[a]);
  colors.push(objectVertexColors[a]); points.push(vertices[c]);
  colors.push(objectVertexColors[a]); points.push(vertices[d]);
}

function groundQuad(a, b, c, d) {
  colors.push(groundVertexColors[a]); points.push(vertices[a]);
  colors.push(groundVertexColors[a]); points.push(vertices[b]);
  colors.push(groundVertexColors[a]); points.push(vertices[c]);
  colors.push(groundVertexColors[a]); points.push(vertices[a]);
  colors.push(groundVertexColors[a]); points.push(vertices[c]);
  colors.push(groundVertexColors[a]); points.push(vertices[d]);
}

function robotCube() {
  robotQuad(1, 0, 3, 2);
  robotQuad(2, 3, 7, 6);
  robotQuad(3, 0, 4, 7);
  robotQuad(6, 5, 1, 2);
  robotQuad(4, 5, 6, 7);
  robotQuad(5, 4, 0, 1);
}

function objectCube() {
  objectQuad(1, 0, 3, 2);
  objectQuad(2, 3, 7, 6);
  objectQuad(3, 0, 4, 7);
  objectQuad(6, 5, 1, 2);
  objectQuad(4, 5, 6, 7);
  objectQuad(5, 4, 0, 1);
}

function groundCube() {
  groundQuad(1, 0, 3, 2);
  groundQuad(2, 3, 7, 6);
  groundQuad(3, 0, 4, 7);
  groundQuad(6, 5, 1, 2);
  groundQuad(4, 5, 6, 7);
  groundQuad(5, 4, 0, 1);
}

function jointCube() {
  jointQuad(1, 0, 3, 2);
  jointQuad(2, 3, 7, 6);
  jointQuad(3, 0, 4, 7);
  jointQuad(6, 5, 1, 2);
  jointQuad(4, 5, 6, 7);
  jointQuad(5, 4, 0, 1);
}

function jointQuad(a, b, c, d) {
  colors.push(jointVertexColors[a]); points.push(vertices[a]);
  colors.push(jointVertexColors[a]); points.push(vertices[b]);
  colors.push(jointVertexColors[a]); points.push(vertices[c]);
  colors.push(jointVertexColors[a]); points.push(vertices[a]);
  colors.push(jointVertexColors[a]); points.push(vertices[c]);
  colors.push(jointVertexColors[a]); points.push(vertices[d]);
}

// --- Component Drawers ---

function bindBuffers(vBuf, cBuf) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
}

function ground() {
  bindBuffers(vBufferGround, cBufferGround);
  var s = scale(GROUND_WIDTH, GROUND_HEIGHT, GROUND_WIDTH);
  var instanceMatrix = mult(translate(0.0, -0.5 * GROUND_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numGroundVertices);
}

function actualBase() {
  bindBuffers(vBufferJoint, cBufferJoint);
  var s = scale(ACTUAL_BASE_WIDTH, ACTUAL_BASE_HEIGHT, ACTUAL_BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * ACTUAL_BASE_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numJointVertices);
}

function jointBox() {
  bindBuffers(vBufferJoint, cBufferJoint);
  var s = scale(JOINT_LENGTH, JOINT_HEIGHT, JOINT_WIDTH);
  var r = rotate(45, vec3(1, 0, 0));
  var instanceMatrix = mult(r, s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numJointVertices);
}

function base() {
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function upperArm() {
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function lowerArm() {
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function gripperBase() {
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(GRIPPER_BASE_LENGTH, GRIPPER_BASE_HEIGHT, GRIPPER_BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * GRIPPER_BASE_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function gripper() {
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(GRIPPER_WIDTH, GRIPPER_HEIGHT, GRIPPER_LENGTH);
  var d = 0.15 + (theta[Gripper] / 200.0);

  var instanceMatrix1 = mult(translate(d, 0.5 * GRIPPER_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix1)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);

  var instanceMatrix2 = mult(translate(-d, 0.5 * GRIPPER_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix2)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

// --- Drop Zone Drawing ---
function drawDropZoneA() {
  gl.uniform1i(uUseSolidColorLoc, true);
  gl.uniform4fv(uSolidColorLoc, COLOR_ZONE);
  bindBuffers(vBufferZone, cBufferZone);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.drawArrays(gl.LINES, 0, numZoneAVertices);
}

function drawDropZoneB() {
  gl.uniform1i(uUseSolidColorLoc, true);
  gl.uniform4fv(uSolidColorLoc, COLOR_ZONE);
  bindBuffers(vBufferZone, cBufferZone);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.drawArrays(gl.LINES, numZoneAVertices, numZoneVertices - numZoneAVertices);
}

function weightObject() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferObject, cBufferObject);

  var s = scale(0.8, 0.8, 0.8);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, s)));
  gl.drawArrays(gl.TRIANGLES, 0, numObjectVertices);
}