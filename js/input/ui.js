"use strict";

// =========================================================================
// UI HELPERS
// =========================================================================

function setupSliders() {
  function attach(id, index, isGripper) {
    var el = document.getElementById(id);
    el.oninput = function (e) {
      targetTheta[index] = Number(e.target.value);
      var valId = "val" + (index + 1);
      if (isGripper) {
        document.getElementById(valId).innerText = theta[index] < 80 ? "Closed" : "Open";
      } else {
        document.getElementById(valId).innerText = Math.round(targetTheta[index]) + "°";
      }
    };
  }

  attach("slider1", Base, false);
  attach("slider2", LowerArm, false);
  attach("slider3", UpperArm, false);
  attach("slider4", GripperBase, false);

}

function setupButtons() {
  document.getElementById("playBtn").onclick = startAnimation;
  document.getElementById("btnAtoB").onclick = startAtoB;
  document.getElementById("btnBtoA").onclick = startBtoA;
  document.getElementById("stopBtn").onclick = stopAnimation;
  document.getElementById("resetBtn").onclick = resetArm;
  var switchEl = document.getElementById("gripperSwitch");
  if (switchEl) {
    switchEl.onchange = function (e) {
      targetTheta[Gripper] = e.target.checked ? 70 : 90; // Checked = Closed (70), Unchecked = Open (90)
      updateUI();
    };
  }
}

function updateUI() {
  document.getElementById("slider1").value = targetTheta[Base];
  document.getElementById("slider2").value = targetTheta[LowerArm];
  document.getElementById("slider3").value = targetTheta[UpperArm];
  document.getElementById("slider4").value = targetTheta[GripperBase];

  // Sync switch state - use targetTheta so it toggles instantly visually
  var switchEl = document.getElementById("gripperSwitch");
  if (switchEl) {
    switchEl.checked = (targetTheta[Gripper] < 80);
  }


  document.getElementById("val1").innerText = Math.round(theta[Base]) + "°";
  document.getElementById("val2").innerText = Math.round(theta[LowerArm]) + "°";
  document.getElementById("val3").innerText = Math.round(theta[UpperArm]) + "°";
  document.getElementById("val4").innerText = Math.round(theta[GripperBase]) + "°";

}

function updateStatus(msg) {
  document.getElementById("status").innerText = "Status: " + msg;
}
