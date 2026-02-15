(function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("siteNav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const next = siteNav.getAttribute("data-open") !== "true";
      siteNav.setAttribute("data-open", String(next));
      menuToggle.setAttribute("aria-expanded", String(next));
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const heroCanvas = document.getElementById("heroCanvas");
  if (!heroCanvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({
    canvas: heroCanvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(54, 1, 0.1, 120);
  camera.position.set(0, 0, 16);

  const pointsGeometry = new THREE.BufferGeometry();
  const count = 380;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 28;
    positions[i3 + 1] = (Math.random() - 0.5) * 18;
    positions[i3 + 2] = (Math.random() - 0.5) * 8;
    speeds[i] = 0.002 + Math.random() * 0.004;
  }

  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x10b981,
    size: 0.08,
    transparent: true,
    opacity: 0.6,
  });

  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  scene.add(points);

  const ringGeometry = new THREE.TorusGeometry(6, 0.04, 12, 180);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.35,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2.1;
  scene.add(ring);

  const clock = new THREE.Clock();

  function resize() {
    const parent = heroCanvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    const attr = pointsGeometry.getAttribute("position");

    for (let i = 0; i < count; i += 1) {
      const yIndex = i * 3 + 1;
      attr.array[yIndex] += Math.sin(elapsed + i) * speeds[i];
      if (attr.array[yIndex] > 9) attr.array[yIndex] = -9;
    }

    attr.needsUpdate = true;

    points.rotation.y = elapsed * 0.06;
    ring.rotation.z = elapsed * 0.12;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
})();
