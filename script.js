
const canvas = document.getElementById("dnaCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("sequenceInput");
const complementBox = document.getElementById("complement");
const complementPanel = document.getElementById("complementPanel");

const strandMode = document.getElementById("strandMode");
const baseChoice = document.getElementById("baseChoice");
const baseCount = document.getElementById("baseCount");

const colors = {
  A: "#4cbaff",
  T: "#ffb65c",
  G: "#59dfa0",
  C: "#bc8cff"
};

const pairs = {
  A: "T",
  T: "A",
  G: "C",
  C: "G"
};

let sequence = "GGGGG";
let angle = 0;
let rotating = true;
let dragging = false;
let lastX = 0;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = strandMode.value === "single" ? 0 : Math.min(w * 0.25, 80);

  const total = sequence.length;

  if (total === 0) {
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Enter DNA bases", centerX, centerY);
    return;
  }

  const step = Math.min(24, (h - 45) / Math.max(total - 1, 1));
  const points = [];

  for (let i = 0; i < total; i++) {
    const theta = i * 0.75 + angle;
    const y = centerY + (i - (total - 1) / 2) * step;

    const x1 = strandMode.value === "single"
      ? centerX + Math.cos(theta) * 45
      : centerX + Math.cos(theta) * radius;

    const x2 = centerX - Math.cos(theta) * radius;

    points.push({
      x1,
      x2,
      y,
      z1: Math.sin(theta),
      z2: -Math.sin(theta),
      i
    });
  }

  // First backbone
  ctx.beginPath();

  points.forEach((p, i) => {
    if (i === 0) {
      ctx.moveTo(p.x1, p.y);
    } else {
      ctx.lineTo(p.x1, p.y);
    }
  });

  ctx.strokeStyle = "#55d8ff";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Second backbone only in double strand mode
  if (strandMode.value === "double") {
    ctx.beginPath();

    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x2, p.y);
      } else {
        ctx.lineTo(p.x2, p.y);
      }
    });

    ctx.strokeStyle = "#a17aff";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  points.forEach(p => {
    const base = sequence[p.i];

    function sphere(x, y, color, z, letter) {
      const r = 10 + z * 2;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.fillStyle = "#07111d";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, x, y);
    }

    if (strandMode.value === "double") {
      const opposite = pairs[base];

      ctx.beginPath();
      ctx.moveTo(p.x1, p.y);
      ctx.lineTo(p.x2, p.y);
      ctx.strokeStyle = "#a8c5df";
      ctx.lineWidth = 2;
      ctx.stroke();

      sphere(p.x1, p.y, colors[base], p.z1, base);
      sphere(p.x2, p.y, colors[opposite], p.z2, opposite);

    } else {
      sphere(p.x1, p.y, colors[base], p.z1, base);
    }
  });
}

function update() {
  const complementary = [...sequence]
    .map(base => pairs[base])
    .join("");

  complementPanel.style.display =
    strandMode.value === "double" ? "block" : "none";

  complementBox.textContent = complementary || "---";

  document.getElementById("count").textContent =
    sequence.length;

  const gc = [...sequence].filter(
    base => base === "G" || base === "C"
  ).length;

  const percent = sequence.length
    ? Math.round(gc / sequence.length * 100)
    : 0;

  document.getElementById("gc").textContent =
    percent + "%";

  draw();
}

// Generate repeated bases
document.getElementById("generateButton")
  .addEventListener("click", () => {

    const base = baseChoice.value;

    const count = Math.max(
      1,
      Math.min(80, Number(baseCount.value) || 1)
    );

    sequence = base.repeat(count);

    input.value = sequence;

    update();
  });

// Change strand mode
strandMode.addEventListener("change", update);

// Manual sequence input
input.addEventListener("input", () => {
  sequence = input.value
    .toUpperCase()
    .replace(/[^ATGC]/g, "")
    .slice(0, 80);

  input.value = sequence;
  update();
});

// Add individual bases
document.querySelectorAll("[data-base]")
  .forEach(button => {
    button.addEventListener("click", () => {
      sequence = (
        sequence + button.dataset.base
      ).slice(0, 80);

      input.value = sequence;
      update();
    });
  });

// Clear
document.getElementById("clearButton")
  .addEventListener("click", () => {
    sequence = "";
    input.value = "";
    update();
  });

// Rotation
document.getElementById("rotateButton")
  .addEventListener("click", event => {
    rotating = !rotating;

    event.target.textContent =
      rotating ? "Pause Rotation" : "Resume Rotation";
  });

// Touch and mouse rotation
canvas.addEventListener("pointerdown", event => {
  dragging = true;
  lastX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (!dragging) return;

  const dx = event.clientX - lastX;
  angle += dx * 0.012;
  lastX = event.clientX;

  draw();
});

function stopDragging() {
  dragging = false;
}

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);

// Animation
function animate() {
  if (rotating && !dragging) {
    angle += 0.012;
    draw();
  }

  requestAnimationFrame(animate);
}

// Start
input.value = sequence;
resize();

window.addEventListener("resize", resize);

update();
animate();
