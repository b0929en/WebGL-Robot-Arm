"use strict";

// =========================================================================
// UI HELPERS
// =========================================================================

function setupSliders() {
  function attach(id, index, isGripper) {
    var el = document.getElementById(id);
    el.oninput = function (e) {
      theta[index] = Number(e.target.value);
      var valId = "val" + (index + 1);
      if (isGripper) {
        document.getElementById(valId).innerText = theta[index] < 80 ? "Closed" : "Open";
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
  document.getElementById("val5").innerText = theta[Gripper] < 80 ? "Closed" : "Open";
}

function updateStatus(msg) {
  document.getElementById("status").innerText = "Status: " + msg;
}
