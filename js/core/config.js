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
