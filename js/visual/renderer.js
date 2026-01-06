"use strict";

// =========================================================================
// COMPONENT DRAWERS & VISUALS
// =========================================================================

function bindBuffers(vBuf, cBuf) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
}

function ground() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferGround, cBufferGround);
  var s = scale(GROUND_WIDTH, GROUND_HEIGHT, GROUND_WIDTH);
  var instanceMatrix = mult(translate(0.0, -0.5 * GROUND_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numGroundVertices);
}

function actualBase() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferJoint, cBufferJoint);
  var s = scale(ACTUAL_BASE_WIDTH, ACTUAL_BASE_HEIGHT, ACTUAL_BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * ACTUAL_BASE_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numJointVertices);
}

function jointBox() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferJoint, cBufferJoint);
  var s = scale(JOINT_LENGTH, JOINT_HEIGHT, JOINT_WIDTH);
  var r = rotate(45, vec3(1, 0, 0));
  var instanceMatrix = mult(r, s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numJointVertices);
}

function base() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function upperArm() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function lowerArm() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function gripperBase() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferRobot, cBufferRobot);
  var s = scale(GRIPPER_BASE_LENGTH, GRIPPER_BASE_HEIGHT, GRIPPER_BASE_WIDTH);
  var instanceMatrix = mult(translate(0.0, 0.5 * GRIPPER_BASE_HEIGHT, 0.0), s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numRobotVertices);
}

function gripper() {
  gl.uniform1i(uUseSolidColorLoc, false);
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

function weightObject() {
  gl.uniform1i(uUseSolidColorLoc, false);
  bindBuffers(vBufferObject, cBufferObject);
  var s = scale(0.8, 0.8, 0.8);
  var instanceMatrix = mult(translate(0.0, 0.4, 0.0), s); // 0.4 half height
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(modelViewMatrix, instanceMatrix)));
  gl.drawArrays(gl.TRIANGLES, 0, numObjectVertices);
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
