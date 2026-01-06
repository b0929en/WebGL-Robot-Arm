"use strict";

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
