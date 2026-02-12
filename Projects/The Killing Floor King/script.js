const panels = Array.from(document.querySelectorAll(".panel"));
const dots = Array.from(document.querySelectorAll(".dot"));
const jumpButtons = Array.from(document.querySelectorAll(".jump"));
const panelsContainer = document.getElementById("panels");
const flipCards = Array.from(document.querySelectorAll(".flip-card"));

let currentIndex = 0;
let isAnimating = false;

const targets = [
  { x: 0, y: 0, z: 14, rx: 0.1, ry: 0.2 },
  { x: 2, y: 0.5, z: 11, rx: -0.1, ry: -0.4 },
  { x: -1.5, y: -0.5, z: 12, rx: 0.2, ry: 0.6 },
  { x: 0, y: 0.8, z: 10, rx: -0.2, ry: 0 },
];

function updateUI() {
  panelsContainer.style.setProperty("--page", currentIndex);
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
  });
}

function goTo(index) {
  if (isAnimating || index === currentIndex) return;
  if (index < 0 || index >= panels.length) return;
  isAnimating = true;
  document.body.classList.add("is-animating");
  currentIndex = index;
  updateUI();
  setTimeout(() => {
    isAnimating = false;
    document.body.classList.remove("is-animating");
  }, 900);
}

function handleWheel(event) {
  if (isAnimating) return;
  const delta = Math.sign(event.deltaY);
  if (delta > 0) {
    goTo(currentIndex + 1);
  } else if (delta < 0) {
    goTo(currentIndex - 1);
  }
}

let touchStartY = 0;
function handleTouchStart(event) {
  touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
  if (isAnimating) return;
  const currentY = event.touches[0].clientY;
  const delta = touchStartY - currentY;
  if (Math.abs(delta) > 50) {
    goTo(currentIndex + (delta > 0 ? 1 : -1));
    touchStartY = currentY;
  }
}

window.addEventListener("wheel", handleWheel, { passive: true });
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: true });
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "PageDown") {
    goTo(currentIndex + 1);
  }
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    goTo(currentIndex - 1);
  }
});

jumpButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = Number(btn.dataset.jump || 0);
    goTo(target);
  });
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const target = Number(dot.dataset.jump || 0);
    goTo(target);
  });
});

updateUI();

flipCards.forEach((card) => {
  const button = card.querySelector(".flip-inner");
  if (!button) return;
  button.addEventListener("click", () => {
    card.classList.toggle("is-flipped");
  });
});

const canvas = document.getElementById("stage");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050507, 6, 22);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const ambient = new THREE.AmbientLight(0xff203b, 0.4);
scene.add(ambient);

const rim = new THREE.DirectionalLight(0xff4d5a, 1.2);
rim.position.set(4, 6, 5);
scene.add(rim);

const group = new THREE.Group();
scene.add(group);

const material = new THREE.MeshStandardMaterial({
  color: 0x120007,
  emissive: 0x7a0013,
  metalness: 0.6,
  roughness: 0.3,
  wireframe: true,
});

const knots = [
  new THREE.Mesh(new THREE.TorusKnotGeometry(2.2, 0.4, 140, 12), material),
  new THREE.Mesh(new THREE.TorusKnotGeometry(1.6, 0.3, 120, 12), material),
  new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.25, 100, 10), material),
];

knots.forEach((mesh, i) => {
  mesh.position.set(i - 1, i * 0.6 - 0.6, -2);
  mesh.rotation.set(Math.random(), Math.random(), Math.random());
  group.add(mesh);
});

const particleCount = 1400;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i += 1) {
  positions[i * 3] = (Math.random() - 0.5) * 22;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
}
const particles = new THREE.BufferGeometry();
particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({
  color: 0xff1f3a,
  size: 0.05,
  transparent: true,
  opacity: 0.6,
});
const points = new THREE.Points(particles, particleMaterial);
scene.add(points);

let lastTime = 0;
function animate(time) {
  const delta = (time - lastTime) * 0.001;
  lastTime = time;

  const target = targets[currentIndex] || targets[0];
  camera.position.x += (target.x - camera.position.x) * 0.04;
  camera.position.y += (target.y - camera.position.y) * 0.04;
  camera.position.z += (target.z - camera.position.z) * 0.04;
  camera.rotation.x += (target.rx - camera.rotation.x) * 0.04;
  camera.rotation.y += (target.ry - camera.rotation.y) * 0.04;

  group.rotation.y += delta * 0.2;
  group.rotation.x += delta * 0.1;
  knots.forEach((mesh, i) => {
    mesh.rotation.z += delta * (0.3 + i * 0.1);
  });

  points.rotation.y -= delta * 0.03;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);

animate(0);
