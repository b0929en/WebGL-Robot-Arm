"use strict";

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
var theta = [0, 30, -60, -60, 90];

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

var keys = {}; // defined in input/controls.js logically, but needed globally

// Physics State
var velocity = vec3(0.0, 0.0, 0.0);
var settlingState = null; // Stores { pivotIdx, faceIndex, faceSign } when landing
var GRAVITY = 9.8;
var GROUND_Y = 0.5;

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

// Joint Indices
var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var GripperBase = 3;
var Gripper = 4;

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

  // --- Geometry Generation (Defined in geometry/*.js) ---
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

  // Drop Zone (Lines)
  var zonePoints = generateDropZoneGeometry();
  var zoneColors = [];
  for (var i = 0; i < zonePoints.length; i++) zoneColors.push(COLOR_ZONE);
  numZoneVertices = zonePoints.length;

  // Joint Box
  points = []; colors = [];
  jointCube();
  var jointPoints = points.slice();
  var jointColors = colors.slice();
  numJointVertices = jointPoints.length;

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
  else handleKeys(deltaTime);

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
  modelViewMatrix = mult(modelViewMatrix, translate(10.4, -5.0, 0.0));
  drawDropZoneA();

  // Drop Zone B
  modelViewMatrix = worldMatrix;
  modelViewMatrix = mult(modelViewMatrix, translate(-10.4, -5.0, 0.0));
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
