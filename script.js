const pages = Array.from(document.querySelectorAll(".page"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageStatus = document.getElementById("pageStatus");

let currentPage = 0;

function renderBook() {
  pages.forEach((page, index) => {
    const isFlipped = index < currentPage;
    page.classList.toggle("flipped", isFlipped);
    page.style.zIndex = String(pages.length - index + (isFlipped ? 0 : pages.length));
  });

  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = false;
  pageStatus.textContent = `Page ${currentPage + 1} of ${pages.length}`;
}

prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage -= 1;
    renderBook();
  }
});

nextBtn.addEventListener("click", () => {
  currentPage = currentPage >= pages.length - 1 ? 0 : currentPage + 1;
  renderBook();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" && currentPage < pages.length) {
    currentPage = currentPage >= pages.length - 1 ? 0 : currentPage + 1;
    renderBook();
  }

  if (event.key === "ArrowLeft" && currentPage > 0) {
    currentPage -= 1;
    renderBook();
  }
});

renderBook();

const typedLine = document.getElementById("typed-line");
const typedText =
  "ForgeAI Design Studio blends human creativity with artificial intelligence to build brands, interfaces, and experiences that don’t just look impressive — they work relentlessly to drive growth.";

function typeLineLoop(text, target, speed = 52, pause = 1400) {
  if (!target) return;
  target.textContent = "";
  let index = 0;

  const step = () => {
    target.textContent += text[index];
    index += 1;
    if (index >= text.length) {
      window.setTimeout(() => {
        target.textContent = "";
        index = 0;
        window.setTimeout(step, speed);
      }, pause);
      return;
    }
    window.setTimeout(step, speed);
  };

  step();
}

typeLineLoop(typedText, typedLine);

const coverReveal = document.getElementById("coverReveal");

if (coverReveal) {
  const svg = coverReveal.querySelector(".cover-mask-svg");
  const mask = svg.querySelector("#coverMask");
  const wrapper = svg.querySelector(".cover-mask-wrapper");

  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0, vx: 0, vy: 0 };
  const particles = [];

  const updateViewBox = () => {
    const rect = coverReveal.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    mask.setAttribute("x", "0");
    mask.setAttribute("y", "0");
    mask.setAttribute("width", rect.width);
    mask.setAttribute("height", rect.height);
  };

  const onPointerMove = (event) => {
    const rect = coverReveal.getBoundingClientRect();
    pointer.vx = pointer.x - event.clientX;
    pointer.vy = pointer.y - event.clientY;
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  const emitParticle = () => {
    if (pointer.diff < 0.05) return;
    const size = Math.min(pointer.diff * 0.45, 70);
    const particle = new Particle(pointer.smoothX, pointer.smoothY, size);
    particles.push(particle);
    wrapper.appendChild(particle.el);
  };

  class Particle {
    constructor(x, y, size) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.life = 1;
      this.grow = 1;
      this.el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      this.el.setAttribute("cx", this.x);
      this.el.setAttribute("cy", this.y);
      this.el.setAttribute("r", this.size);
      this.el.setAttribute("fill", "white");
    }

    render(delta) {
      if (this.life > 0.6) {
        this.size += this.grow * delta * 0.12;
      } else {
        this.size -= delta * 0.18;
      }
      this.life -= delta * 0.18;
      if (this.life <= 0 || this.size <= 0) {
        this.el.remove();
        return false;
      }
      this.el.setAttribute("r", Math.max(this.size, 0));
      return true;
    }
  }

  const render = () => {
    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.2;
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.2;
    pointer.diff = Math.hypot(pointer.x - pointer.smoothX, pointer.y - pointer.smoothY);

    emitParticle();

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const alive = particles[i].render(1);
      if (!alive) particles.splice(i, 1);
    }

    requestAnimationFrame(render);
  };

  coverReveal.addEventListener("pointermove", onPointerMove);
  coverReveal.addEventListener("pointerleave", () => {
    pointer.diff = 0;
  });
  window.addEventListener("resize", updateViewBox);
  updateViewBox();
  render();
}
