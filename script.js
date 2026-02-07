const pages = Array.from(document.querySelectorAll(".page"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageStatus = document.getElementById("pageStatus");

let currentPage = 0;
let glitchTimeoutId = null;
const PAGE_TURN_MS = 900;

function renderBook(glitchIndex = null) {
  pages.forEach((page, index) => {
    const isFlipped = index < currentPage;
    page.classList.toggle("flipped", isFlipped);
    page.style.zIndex = String(pages.length - index + (isFlipped ? 0 : pages.length));
  });

  hydrateVisibleIframes();
  triggerPageGlitch(glitchIndex);

  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = false;
  pageStatus.textContent = `Page ${currentPage + 1} of ${pages.length}`;
}

function triggerPageGlitch(glitchIndex) {
  pages.forEach((page) => page.classList.remove("page--glitch-in"));

  if (glitchTimeoutId) {
    window.clearTimeout(glitchTimeoutId);
    glitchTimeoutId = null;
  }

  if (glitchIndex == null) return;

  const targetPage = pages[glitchIndex];
  if (!targetPage) return;

  glitchTimeoutId = window.setTimeout(() => {
    // Force reflow so the class animation restarts every page turn.
    void targetPage.offsetWidth;
    targetPage.classList.add("page--glitch-in");
  }, PAGE_TURN_MS);
}

function hydrateVisibleIframes() {
  const currentArticle = pages[currentPage];
  if (!currentArticle) return;

  const localIframes = currentArticle.querySelectorAll(".project-preview iframe[data-src]");
  localIframes.forEach((frame) => {
    frame.src = frame.dataset.src;
    frame.removeAttribute("data-src");
  });
}

prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    const turningPageIndex = currentPage - 1;
    currentPage -= 1;
    renderBook(turningPageIndex);
  }
});

nextBtn.addEventListener("click", () => {
  const turningPageIndex = currentPage;
  currentPage = currentPage >= pages.length - 1 ? 0 : currentPage + 1;
  renderBook(turningPageIndex);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" && currentPage < pages.length) {
    const turningPageIndex = currentPage;
    currentPage = currentPage >= pages.length - 1 ? 0 : currentPage + 1;
    renderBook(turningPageIndex);
  }

  if (event.key === "ArrowLeft" && currentPage > 0) {
    const turningPageIndex = currentPage - 1;
    currentPage -= 1;
    renderBook(turningPageIndex);
  }
});

renderBook(0);

const typedLine = document.getElementById("typed-line");
const topTitle = document.querySelector(".book-top h1");
const typedText =
  "ForgeAI Design Studio blends human creativity with artificial intelligence to build brands, interfaces, and experiences that don't just look impressive - they work relentlessly to drive growth.";

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

if (topTitle && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const targetText = topTitle.textContent.trim();
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charSpans = [];
  const PASS_CLASS = "title-scanline-pass";
  const SCRAMBLE_CLASS = "title-scrambling";
  let passTimer = null;
  let scrambleRunning = false;

  topTitle.dataset.titleText = targetText;

  const triggerTitlePass = () => {
    topTitle.classList.remove(PASS_CLASS);
    void topTitle.offsetWidth;
    topTitle.classList.add(PASS_CLASS);

    if (passTimer) window.clearTimeout(passTimer);
    passTimer = window.setTimeout(() => {
      topTitle.classList.remove(PASS_CLASS);
    }, 820);
  };

  topTitle.textContent = "";
  for (const char of targetText) {
    const span = document.createElement("span");
    span.className = char === " " ? "title-char title-char--space" : "title-char";
    span.textContent =
      char === " " ? " " : randomChars[Math.floor(Math.random() * randomChars.length)];
    topTitle.appendChild(span);
    charSpans.push(span);
  }

  const runTitleScramble = () => {
    if (scrambleRunning) return;
    scrambleRunning = true;
    triggerTitlePass();
    topTitle.classList.add(SCRAMBLE_CLASS);

    const revealDurationMs = 1500;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / revealDurationMs, 1);
      const fixedChars = Math.floor(targetText.length * progress);

      for (let i = 0; i < targetText.length; i += 1) {
        const original = targetText[i];
        const span = charSpans[i];
        if (!span) continue;

        if (original === " ") {
          span.textContent = " ";
          continue;
        }
        if (i < fixedChars || progress >= 1) {
          span.textContent = original;
        } else {
          span.textContent = randomChars[Math.floor(Math.random() * randomChars.length)];
        }
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }

      scrambleRunning = false;
    };

    requestAnimationFrame(tick);
  };

  window.setTimeout(() => {
    runTitleScramble();
    window.setInterval(runTitleScramble, 7000);
  }, PAGE_TURN_MS);
}

const coverReveal = document.getElementById("coverReveal");
const coverVideo = document.querySelector(".cover-reveal-video");

if (coverVideo) {
  let lastRecovery = 0;
  let lastTime = -1;
  let stagnantTicks = 0;
  coverVideo.loop = true;

  const playVideo = () => {
    coverVideo.play().catch(() => {});
  };

  const recoverFromStall = () => {
    const now = performance.now();
    if (now - lastRecovery < 1200) return;
    lastRecovery = now;

    const current = coverVideo.currentTime || 0;
    coverVideo.currentTime = Math.max(0, current - 0.06);
    playVideo();
  };

  if (coverVideo.readyState >= 2) {
    playVideo();
  } else {
    coverVideo.addEventListener("canplay", playVideo, { once: true });
  }

  coverVideo.addEventListener("waiting", recoverFromStall);
  coverVideo.addEventListener("stalled", recoverFromStall);
  coverVideo.addEventListener("ended", () => {
    coverVideo.currentTime = 0;
    playVideo();
  });
  coverVideo.addEventListener("error", () => {
    const current = coverVideo.currentTime || 0;
    coverVideo.load();
    coverVideo.currentTime = Math.max(0, current - 0.1);
    playVideo();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      coverVideo.pause();
      return;
    }
    playVideo();
  });

  window.setInterval(() => {
    if (document.hidden || coverVideo.paused || coverVideo.ended || coverVideo.seeking) return;

    const nowTime = coverVideo.currentTime || 0;
    if (Math.abs(nowTime - lastTime) < 0.01) {
      stagnantTicks += 1;
    } else {
      stagnantTicks = 0;
      lastTime = nowTime;
    }

    if (stagnantTicks >= 3) {
      recoverFromStall();
      stagnantTicks = 0;
      lastTime = coverVideo.currentTime || nowTime;
    }
  }, 900);
}

if (coverReveal) {
  const svg = coverReveal.querySelector(".cover-mask-svg");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchFirst = window.matchMedia("(pointer: coarse)").matches;

  if (svg && !prefersReducedMotion && !isTouchFirst) {
    const mask = svg.querySelector("#coverMask");
    const wrapper = svg.querySelector(".cover-mask-wrapper");
    if (mask && wrapper) {
      const pointer = { x: 0, y: 0, lastX: 0, lastY: 0 };
      const revealDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      revealDot.setAttribute("fill", "black");
      revealDot.setAttribute("fill-opacity", "0.72");
      revealDot.setAttribute("r", "0");
      wrapper.appendChild(revealDot);

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
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;

        const speed = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
        const radius = Math.max(32, Math.min(78, 28 + speed * 0.45));

        revealDot.setAttribute("cx", pointer.x.toFixed(2));
        revealDot.setAttribute("cy", pointer.y.toFixed(2));
        revealDot.setAttribute("r", radius.toFixed(2));
      };

      coverReveal.addEventListener("pointermove", onPointerMove);
      coverReveal.addEventListener("pointerleave", () => {
        revealDot.setAttribute("r", "0");
      });
      window.addEventListener("resize", updateViewBox);
      updateViewBox();
    }
  }
}
