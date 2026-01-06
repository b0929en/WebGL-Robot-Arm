"use strict";

// =========================================================================
// GEOMETRY GENERATORS (Primitives)
// =========================================================================

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

function jointQuad(a, b, c, d) {
  colors.push(jointVertexColors[a]); points.push(vertices[a]);
  colors.push(jointVertexColors[a]); points.push(vertices[b]);
  colors.push(jointVertexColors[a]); points.push(vertices[c]);
  colors.push(jointVertexColors[a]); points.push(vertices[a]);
  colors.push(jointVertexColors[a]); points.push(vertices[c]);
  colors.push(jointVertexColors[a]); points.push(vertices[d]);
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
