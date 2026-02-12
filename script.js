const pages = Array.from(document.querySelectorAll(".page"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageStatus = document.getElementById("pageStatus");
const neoSequence = document.getElementById("neoSequence");
const neoWakeLine = document.getElementById("neoWakeLine");
const neoInstallLine = document.getElementById("neoInstallLine");
const neoConfirmLabel = document.getElementById("neoConfirmLabel");
const neoConfirmInput = document.getElementById("neoConfirmInput");
const neoConfirmMeta = document.getElementById("neoConfirmMeta");
const neoConfirmSubmit = document.getElementById("neoConfirmSubmit");
const neoWalkStage = document.getElementById("neoWalkStage");
const neoWalkMatrix = document.getElementById("neoWalkMatrix");
const neoWalkVideo = document.getElementById("neoWalkVideo");
const neoWalkPhase = document.getElementById("neoWalkPhase");
const neoWalkProgressFill = document.getElementById("neoWalkProgressFill");
const neoAboutStage = document.getElementById("neoAboutStage");
const neoReturnBtn = document.getElementById("neoReturnBtn");
const neoReturnRain = document.getElementById("neoReturnRain");
const dejaVuCat = document.getElementById("dejaVuCat");
const sourceCodeRain = document.getElementById("sourceCodeRain");
const titleMatrixVideo = document.getElementById("titleMatrixVideo");
const WALK_VIDEO_SOURCES = ["./walking.mp4", "./MatrixCodeHero.mp4"];
const IS_FILE_PROTOCOL = window.location.protocol === "file:";

let currentPage = 0;
let glitchTimeoutId = null;
let pageLoopCount = 0;
let neoModeActive = false;
let matrixBubble = null;
let matrixBubbleCode = null;
let matrixBubbleTimerId = null;
let walkVideoSourceIndex = 0;
let neoReturnInProgress = false;
let neoConfirmTimeoutId = null;
let neoConfirmCountdownId = null;
let neoConfirmDeadline = 0;
let typeAudioContext = null;
let sourceRainRunning = false;
let sourceRainTokens = [];
let sourceRainAnimationId = 0;
let dejaVuPlayed = false;
let walkMatrixAnimationId = 0;
let walkMatrixResizeHandler = null;
const PAGE_TURN_MS = 900;
const NEO_CONFIRM_TIMEOUT_MS = 12000;
const mobilePreviewMedia = window.matchMedia("(max-width: 900px), (pointer: coarse)");

function isMobilePreviewBlocked() {
  return mobilePreviewMedia.matches;
}

function renderBook(glitchIndex = null) {
  pages.forEach((page, index) => {
    const isFlipped = index < currentPage;
    page.classList.toggle("flipped", isFlipped);
    page.style.zIndex = String(pages.length - index + (isFlipped ? 0 : pages.length));
  });

  hydrateVisibleIframes();
  triggerPageGlitch(glitchIndex);

  prevBtn.disabled = neoModeActive || currentPage === 0;
  nextBtn.disabled = neoModeActive;
  pageStatus.textContent = `Page ${currentPage + 1} of ${pages.length}`;
}

function ensureTypeAudioContext() {
  if (typeAudioContext) return typeAudioContext;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  typeAudioContext = new AudioCtx();
  return typeAudioContext;
}

function playTypeTick(isSpace = false) {
  const ctx = ensureTypeAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(isSpace ? 920 : 1260 + Math.random() * 170, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(isSpace ? 0.003 : 0.008, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.045);
}

function typeLineOnce(text, target, speed = 90, onComplete = null) {
  if (!target) return;
  target.textContent = "";
  let index = 0;

  const step = () => {
    const char = text[index];
    target.textContent += char;
    playTypeTick(char === " ");
    index += 1;

    if (index >= text.length) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    window.setTimeout(step, speed);
  };

  window.setTimeout(step, speed);
}

function clearNeoConfirmTimers() {
  if (neoConfirmTimeoutId) {
    window.clearTimeout(neoConfirmTimeoutId);
    neoConfirmTimeoutId = null;
  }
  if (neoConfirmCountdownId) {
    window.clearInterval(neoConfirmCountdownId);
    neoConfirmCountdownId = null;
  }
}

function updateNeoConfirmStatus() {
  if (!neoConfirmMeta) return;
  const remainingMs = Math.max(0, neoConfirmDeadline - Date.now());
  const seconds = Math.ceil(remainingMs / 1000);
  neoConfirmMeta.textContent = `Awaiting input... auto-continue in ${seconds}s`;
}

function beginNeoInstallPrompt() {
  if (!neoConfirmLabel || !neoConfirmInput) {
    startWalkPlayback();
    return;
  }

  neoConfirmLabel.hidden = false;
  neoConfirmInput.disabled = false;
  neoConfirmInput.value = "";
  if (neoConfirmSubmit) neoConfirmSubmit.disabled = true;
  neoConfirmInput.focus({ preventScroll: true });

  neoConfirmDeadline = Date.now() + NEO_CONFIRM_TIMEOUT_MS;
  updateNeoConfirmStatus();

  clearNeoConfirmTimers();
  neoConfirmCountdownId = window.setInterval(updateNeoConfirmStatus, 250);
  neoConfirmTimeoutId = window.setTimeout(() => {
    if (neoConfirmMeta) {
      neoConfirmMeta.textContent = "No response detected. Continuing install...";
    }
    startWalkPlayback();
  }, NEO_CONFIRM_TIMEOUT_MS);
}

function playDejaVuCat() {
  if (!dejaVuCat || dejaVuPlayed) return;
  dejaVuPlayed = true;

  const burstCount = Math.max(24, Math.min(54, Math.floor(window.innerWidth / 34)));
  const fragment = document.createDocumentFragment();
  let maxEndMs = 0;

  const randomEdgeStart = () => {
    const side = Math.floor(Math.random() * 4);
    const margin = 180;
    if (side === 0) return { x: -margin, y: Math.random() * window.innerHeight };
    if (side === 1) return { x: window.innerWidth + margin, y: Math.random() * window.innerHeight };
    if (side === 2) return { x: Math.random() * window.innerWidth, y: -margin };
    return { x: Math.random() * window.innerWidth, y: window.innerHeight + margin };
  };

  for (let i = 0; i < burstCount; i += 1) {
    const clone = dejaVuCat.cloneNode(true);
    clone.removeAttribute("id");
    clone.removeAttribute("hidden");
    clone.hidden = false;
    clone.setAttribute("aria-hidden", "true");
    clone.classList.add("deja-vu-cat--burst");

    const start = randomEdgeStart();
    const end = {
      x: Math.random() * (window.innerWidth + 240) - 120,
      y: Math.random() * (window.innerHeight + 240) - 120,
    };

    const delayMs = Math.random() * 1600;
    const durationMs = 1700 + Math.random() * 2400;
    maxEndMs = Math.max(maxEndMs, delayMs + durationMs);

    clone.style.setProperty("--dv-start-x", `${start.x}px`);
    clone.style.setProperty("--dv-start-y", `${start.y}px`);
    clone.style.setProperty("--dv-end-x", `${end.x}px`);
    clone.style.setProperty("--dv-end-y", `${end.y}px`);
    clone.style.setProperty("--dv-delay", `${delayMs.toFixed(0)}ms`);
    clone.style.setProperty("--dv-duration", `${durationMs.toFixed(0)}ms`);
    clone.style.setProperty("--dv-hue", `${(-20 + Math.random() * 40).toFixed(1)}deg`);
    clone.style.setProperty("--dv-start-scale", (0.5 + Math.random() * 0.55).toFixed(2));
    clone.style.setProperty("--dv-end-scale", (0.9 + Math.random() * 0.8).toFixed(2));
    clone.style.setProperty("--dv-start-rot", `${(-28 + Math.random() * 56).toFixed(1)}deg`);
    clone.style.setProperty("--dv-end-rot", `${(-26 + Math.random() * 52).toFixed(1)}deg`);

    fragment.appendChild(clone);
  }

  document.body.appendChild(fragment);

  window.setTimeout(() => {
    const virusNodes = document.querySelectorAll(".deja-vu-cat--burst");
    virusNodes.forEach((node) => node.remove());
  }, maxEndMs + 240);
}

async function buildSourceCodeTokens() {
  const fallbackSource = `
const pages = Array.from(document.querySelectorAll(".page"));
function renderBook(glitchIndex = null) { /* ... */ }
function startNeoSequence() { /* wake up neo */ }
.cover-reveal--unlocked .cover-base { animation: coverGlitchReveal 2.6s both; }
<main class="scene" aria-label="Magazine style portfolio">
<div class="neo-about-stage" id="neoAboutStage" hidden>
const WALK_VIDEO_SOURCES = ["./walking.mp4", "./MatrixCodeHero.mp4"];
function returnFromNeoSequence() { runMatrixReturnTransition(finishReturnToHome); }
@keyframes pageGlitchOverlay { 0% { opacity: 0.75; } 100% { opacity: 0; } }
`;

  const tryFetch = async (path) => {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) return "";
      return await res.text();
    } catch {
      return "";
    }
  };

  if (IS_FILE_PROTOCOL) {
    return fallbackSource.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  const [htmlText, cssText, jsText] = await Promise.all([
    tryFetch("./index.html"),
    tryFetch("./styles.css"),
    tryFetch("./script.js"),
  ]);

  const merged = [htmlText, cssText, jsText].filter(Boolean).join("\n") || fallbackSource;
  const lines = merged
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 8 && line.length <= 90)
    .filter((line) => /[A-Za-z]/.test(line))
    .filter((line) => /[<>{}=;().:#/_-]/.test(line));

  const unique = [];
  const seen = new Set();
  for (const line of lines) {
    if (seen.has(line)) continue;
    seen.add(line);
    unique.push(line);
    if (unique.length >= 260) break;
  }

  return unique.length ? unique : fallbackSource.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function startSourceCodeRain() {
  if (sourceRainRunning || !sourceCodeRain) return;
  sourceRainRunning = true;

  if (!sourceRainTokens.length) {
    sourceRainTokens = await buildSourceCodeTokens();
  }

  const ctx = sourceCodeRain.getContext("2d");
  if (!ctx) return;

  const scene = document.querySelector(".scene");
  if (scene) scene.classList.add("scene--code-rain-active");

  let width = 0;
  let height = 0;
  let dpr = 1;
  const columnStep = 16;
  const columns = [];
  const tokenCount = sourceRainTokens.length;
  const startTime = performance.now();

  const setup = () => {
    const rect = sourceCodeRain.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.max(1, window.devicePixelRatio || 1);
    sourceCodeRain.width = Math.floor(width * dpr);
    sourceCodeRain.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(12, Math.floor(width / columnStep));
    columns.length = 0;
    for (let i = 0; i < count; i += 1) {
      const token = sourceRainTokens[Math.floor(Math.random() * tokenCount)] || "const forge = true;";
      columns.push({
        x: i * columnStep,
        y: -Math.random() * height,
        speed: 0.35 + Math.random() * 0.45,
        token,
        charIndex: Math.floor(Math.random() * token.length),
      });
    }
  };

  const onResize = () => setup();
  setup();
  window.addEventListener("resize", onResize);

  const draw = (now) => {
    const elapsed = now - startTime;
    const ramp = Math.min(elapsed / 4500, 1);
    const intensity = 0.34 + ramp * ramp * 0.78;

    // Keep a gray scene but let character heads stay crisp and readable.
    ctx.fillStyle = "rgba(217, 218, 223, 0.032)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${Math.round(13 + intensity * 4)}px "Space Grotesk", monospace`;

    for (const col of columns) {
      const line = col.token || "const forge = true;";
      const char = line[col.charIndex % line.length] || ";";

      ctx.shadowColor = "rgba(150, 255, 194, 0.55)";
      ctx.shadowBlur = 5;
      ctx.fillStyle = `rgba(173, 255, 202, ${(0.64 + intensity * 0.22).toFixed(3)})`;
      ctx.fillText(char, col.x, col.y);

      if (Math.random() < 0.42) {
        const prevChar = line[(col.charIndex - 1 + line.length) % line.length] || "/";
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(108, 179, 145, ${(0.2 + intensity * 0.15).toFixed(3)})`;
        ctx.fillText(prevChar, col.x, col.y - 14);
      }

      ctx.shadowBlur = 0;
      col.y += col.speed + intensity * 1.3;
      col.charIndex += 1;

      if (col.y > height + 40) {
        col.y = -Math.random() * 220;
        col.token = sourceRainTokens[Math.floor(Math.random() * tokenCount)] || "const forge = true;";
        col.charIndex = Math.floor(Math.random() * col.token.length);
        col.speed = 0.35 + Math.random() * (0.42 + intensity * 0.58);
      }
    }

    sourceRainAnimationId = window.requestAnimationFrame(draw);
  };

  sourceRainAnimationId = window.requestAnimationFrame(draw);
}

function startNeoSequence() {
  if (neoModeActive || !neoSequence) return;
  neoModeActive = true;

  document.body.classList.add("neo-mode");
  neoSequence.hidden = false;
  neoSequence.setAttribute("aria-hidden", "false");
  neoSequence.classList.add("neo-sequence--boot");

  prevBtn.disabled = true;
  nextBtn.disabled = true;

  clearNeoConfirmTimers();
  if (neoWakeLine) neoWakeLine.textContent = "";
  if (neoInstallLine) neoInstallLine.textContent = "";
  if (neoConfirmLabel) neoConfirmLabel.hidden = true;
  if (neoConfirmInput) {
    neoConfirmInput.disabled = false;
    neoConfirmInput.value = "";
  }
  if (neoConfirmSubmit) neoConfirmSubmit.disabled = true;
  if (neoConfirmMeta) neoConfirmMeta.textContent = "";

  window.setTimeout(() => {
    neoSequence.classList.remove("neo-sequence--boot");
    typeLineOnce("wake up Neo.", neoWakeLine, 88, () => {
      typeLineOnce("npm install project NEO. Y/N", neoInstallLine, 58, () => {
        beginNeoInstallPrompt();
      });
    });
  }, 1250);
}

function showNeoAboutStage() {
  if (!neoAboutStage) return;
  neoAboutStage.hidden = false;
  requestAnimationFrame(() => {
    neoAboutStage.classList.add("neo-about-stage--visible");
  });
}

function finishReturnToHome() {
  if (neoWalkVideo) {
    neoWalkVideo.pause();
    neoWalkVideo.currentTime = 0;
  }

  if (neoWalkStage) neoWalkStage.hidden = true;
  stopWalkMatrixRain();

  if (neoAboutStage) {
    neoAboutStage.classList.remove("neo-about-stage--visible");
    neoAboutStage.hidden = true;
  }

  clearNeoConfirmTimers();
  if (neoWakeLine) neoWakeLine.textContent = "";
  if (neoInstallLine) neoInstallLine.textContent = "";
  if (neoConfirmLabel) neoConfirmLabel.hidden = true;
  if (neoConfirmInput) {
    neoConfirmInput.disabled = false;
    neoConfirmInput.value = "";
  }
  if (neoConfirmSubmit) neoConfirmSubmit.disabled = true;
  if (neoConfirmMeta) neoConfirmMeta.textContent = "";

  if (neoReturnRain) {
    neoReturnRain.classList.remove("neo-return-rain--active");
    neoReturnRain.hidden = true;
  }

  if (neoSequence) {
    neoSequence.classList.remove("neo-sequence--boot", "neo-sequence--returning");
    neoSequence.hidden = true;
    neoSequence.setAttribute("aria-hidden", "true");
  }

  document.body.classList.remove("neo-mode");
  neoModeActive = false;
  pageLoopCount = 0;
  currentPage = 0;
  neoReturnInProgress = false;
  if (neoReturnBtn) neoReturnBtn.disabled = false;
  renderBook(0);
}

function startWalkMatrixRain() {
  if (!neoWalkMatrix || walkMatrixAnimationId) return;
  const ctx = neoWalkMatrix.getContext("2d");
  if (!ctx) return;

  const chars = "アイウエオカキクケコサシスセソ0123456789{}[]()<>=+-/*";
  const colStep = 16;
  const cols = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    const rect = neoWalkMatrix.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.max(1, window.devicePixelRatio || 1);

    neoWalkMatrix.width = Math.floor(width * dpr);
    neoWalkMatrix.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(1, Math.floor(width / colStep));
    cols.length = 0;
    for (let i = 0; i < count; i += 1) {
      cols.push({
        x: i * colStep,
        y: Math.random() * -height,
        speed: 0.8 + Math.random() * 1.5,
      });
    }
  };

  walkMatrixResizeHandler = resize;
  window.addEventListener("resize", walkMatrixResizeHandler);
  resize();

  const draw = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = '15px "Space Grotesk", monospace';

    for (const col of cols) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillStyle = "rgba(128, 255, 160, 0.75)";
      ctx.fillText(ch, col.x, col.y);
      ctx.fillStyle = "rgba(64, 180, 104, 0.22)";
      ctx.fillText(ch, col.x, col.y - 14);

      col.y += col.speed;
      if (col.y > height + 24) {
        col.y = -Math.random() * 280;
        col.speed = 0.8 + Math.random() * 1.6;
      }
    }

    walkMatrixAnimationId = window.requestAnimationFrame(draw);
  };

  walkMatrixAnimationId = window.requestAnimationFrame(draw);
}

function stopWalkMatrixRain() {
  if (walkMatrixAnimationId) {
    window.cancelAnimationFrame(walkMatrixAnimationId);
    walkMatrixAnimationId = 0;
  }
  if (walkMatrixResizeHandler) {
    window.removeEventListener("resize", walkMatrixResizeHandler);
    walkMatrixResizeHandler = null;
  }
  if (neoWalkMatrix) {
    const ctx = neoWalkMatrix.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, neoWalkMatrix.width, neoWalkMatrix.height);
  }
}

function runMatrixReturnTransition(onComplete) {
  if (!neoReturnRain) {
    onComplete();
    return;
  }

  const ctx = neoReturnRain.getContext("2d");
  if (!ctx) {
    onComplete();
    return;
  }

  neoReturnRain.hidden = false;
  neoReturnRain.classList.add("neo-return-rain--active");

  const glyphs = "アァカサタナハマヤャラワン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const durationMs = 4200;
  const columnStep = 16;
  let fontSize = 16;
  let columns = 0;
  let drops = [];
  let animationFrameId = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const initGrid = () => {
    const rect = neoReturnRain.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.max(1, window.devicePixelRatio || 1);
    neoReturnRain.width = Math.floor(width * dpr);
    neoReturnRain.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    columns = Math.max(1, Math.floor(width / columnStep));
    drops = Array.from({ length: columns }, () => Math.random() * (height / fontSize));
  };

  const onResize = () => {
    initGrid();
  };

  const start = performance.now();
  initGrid();
  window.addEventListener("resize", onResize);

  const draw = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / durationMs, 1);
    const intensity = progress * progress;

    fontSize = Math.round(15 + intensity * 11);
    const fadeAmount = 0.05 + intensity * 0.22;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount.toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${fontSize}px "Space Grotesk", monospace`;

    for (let i = 0; i < columns; i += 1) {
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = i * columnStep;
      const y = drops[i] * fontSize;

      const headAlpha = 0.5 + intensity * 0.45;
      ctx.fillStyle = `rgba(180, 255, 195, ${headAlpha.toFixed(3)})`;
      ctx.fillText(char, x, y);

      if (intensity > 0.4) {
        const echoChar = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillStyle = `rgba(93, 255, 130, ${(0.22 + intensity * 0.34).toFixed(3)})`;
        ctx.fillText(echoChar, x, y - fontSize * 1.6);
      }

      const resetChance = Math.max(0.01, 0.08 - intensity * 0.05);
      if (y > height + fontSize && Math.random() < resetChance) {
        drops[i] = -Math.random() * 12;
      }

      drops[i] += 0.75 + intensity * 5.2 + Math.random() * (0.45 + intensity * 0.9);
    }

    if (progress < 1) {
      animationFrameId = window.requestAnimationFrame(draw);
      return;
    }

    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", onResize);
    onComplete();
  };

  animationFrameId = window.requestAnimationFrame(draw);
}

function returnFromNeoSequence() {
  if (neoReturnInProgress || !neoSequence) return;
  neoReturnInProgress = true;
  if (neoReturnBtn) neoReturnBtn.disabled = true;

  neoSequence.hidden = false;
  neoSequence.setAttribute("aria-hidden", "false");
  neoSequence.classList.add("neo-sequence--returning");

  runMatrixReturnTransition(() => {
    finishReturnToHome();
  });
}

function startWalkPlayback() {
  if (!neoModeActive) return;
  if (!neoWalkStage || !neoWalkVideo) return;
  clearNeoConfirmTimers();
  if (neoConfirmLabel) neoConfirmLabel.hidden = true;
  if (neoConfirmInput) {
    neoConfirmInput.disabled = true;
    neoConfirmInput.blur();
  }
  if (neoConfirmSubmit) neoConfirmSubmit.disabled = true;
  if (neoConfirmMeta) neoConfirmMeta.textContent = "Installing project NEO...";
  neoWalkStage.hidden = false;
  startWalkMatrixRain();
  neoWalkVideo.muted = false;
  neoWalkVideo.volume = 1;

  const ensureWalkSource = () => {
    const targetSource = WALK_VIDEO_SOURCES[walkVideoSourceIndex];
    if (!targetSource) return;
    if (neoWalkVideo.getAttribute("src") !== targetSource) {
      neoWalkVideo.setAttribute("src", targetSource);
      neoWalkVideo.load();
      }
    };

  const playWalkVideo = () => {
    neoWalkVideo.currentTime = 0;
    if (neoWalkPhase) neoWalkPhase.textContent = "Entering build sequence...";
    if (neoWalkProgressFill) neoWalkProgressFill.style.width = "0%";
    neoWalkVideo.play().catch(() => {});
  };

  ensureWalkSource();
  neoWalkVideo.play().catch(() => {});

  if (neoWalkVideo.readyState >= 2) {
    playWalkVideo();
  } else {
    neoWalkVideo.addEventListener(
      "loadeddata",
      () => {
        playWalkVideo();
      },
      { once: true }
    );
  }
}

function updateWalkHud() {
  if (!neoWalkVideo) return;

  const duration = Number.isFinite(neoWalkVideo.duration) ? neoWalkVideo.duration : 0;
  const progress = duration > 0 ? Math.min(1, neoWalkVideo.currentTime / duration) : 0;

  if (neoWalkProgressFill) {
    neoWalkProgressFill.style.width = `${(progress * 100).toFixed(1)}%`;
  }

  if (!neoWalkPhase) return;
  if (progress < 0.2) {
    neoWalkPhase.textContent = "Synchronizing identity layer...";
    return;
  }
  if (progress < 0.46) {
    neoWalkPhase.textContent = "Compiling visual system...";
    return;
  }
  if (progress < 0.72) {
    neoWalkPhase.textContent = "Aligning code with conversion logic...";
    return;
  }
  if (progress < 0.95) {
    neoWalkPhase.textContent = "Routing to about interface...";
    return;
  }
  neoWalkPhase.textContent = "Transition complete.";
}

function createMatrixCodeBlock(length = 160) {
  const chars = "01ABCDEF";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
    if ((i + 1) % 12 === 0) out += "\n";
  }
  return out;
}

function ensureMatrixBubble() {
  if (matrixBubble) return;

  matrixBubble = document.createElement("div");
  matrixBubble.className = "matrix-cursor-bubble";
  matrixBubble.setAttribute("aria-hidden", "true");

  matrixBubbleCode = document.createElement("pre");
  matrixBubbleCode.className = "matrix-cursor-bubble__code";
  matrixBubbleCode.textContent = createMatrixCodeBlock();
  matrixBubble.appendChild(matrixBubbleCode);
  document.body.appendChild(matrixBubble);
}

function setMatrixBubbleActive(active) {
  ensureMatrixBubble();
  if (!matrixBubble || !matrixBubbleCode) return;

  if (!active) {
    matrixBubble.style.display = "none";
    if (matrixBubbleTimerId) {
      window.clearInterval(matrixBubbleTimerId);
      matrixBubbleTimerId = null;
    }
    return;
  }

  matrixBubble.style.display = "grid";
  if (!matrixBubbleTimerId) {
    matrixBubbleTimerId = window.setInterval(() => {
      matrixBubbleCode.textContent = createMatrixCodeBlock();
    }, 220);
  }
}

window.addEventListener("mousemove", (event) => {
  if (!matrixBubble || matrixBubble.style.display !== "grid") return;
  matrixBubble.style.transform = `translate(${event.clientX - 21}px, ${event.clientY - 21}px)`;
});

setMatrixBubbleActive(true);

if (neoWalkVideo) {
  neoWalkVideo.addEventListener("timeupdate", updateWalkHud);
  neoWalkVideo.addEventListener("loadedmetadata", updateWalkHud);

  neoWalkVideo.addEventListener("ended", () => {
    stopWalkMatrixRain();
    if (neoWalkProgressFill) neoWalkProgressFill.style.width = "100%";
    if (neoWalkPhase) neoWalkPhase.textContent = "Transition complete.";
    showNeoAboutStage();
  });

  neoWalkVideo.addEventListener("error", () => {
    if (walkVideoSourceIndex >= WALK_VIDEO_SOURCES.length - 1) return;
    walkVideoSourceIndex += 1;
    const fallbackSource = WALK_VIDEO_SOURCES[walkVideoSourceIndex];
    neoWalkVideo.setAttribute("src", fallbackSource);
    neoWalkVideo.load();

    if (neoModeActive && neoWalkStage && !neoWalkStage.hidden) {
      startWalkPlayback();
    }
  });
}

if (neoConfirmInput) {
  neoConfirmInput.addEventListener("input", () => {
    const normalized = (neoConfirmInput.value || "").trim().toLowerCase();
    if (neoConfirmSubmit) {
      neoConfirmSubmit.disabled = normalized !== "yes";
    }
    if (neoConfirmMeta && normalized !== "yes") {
      neoConfirmMeta.textContent = 'Type "YES" exactly, then click Enter.';
    }
  });

  neoConfirmInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (neoConfirmMeta) neoConfirmMeta.textContent = 'Click the Enter button to continue.';
  });
}

if (neoConfirmSubmit) {
  neoConfirmSubmit.addEventListener("click", () => {
    if (!neoConfirmInput) return;
    const normalized = (neoConfirmInput.value || "").trim().toLowerCase();
    if (normalized !== "yes") {
      if (neoConfirmMeta) neoConfirmMeta.textContent = 'Input rejected. Type "YES" exactly.';
      neoConfirmSubmit.disabled = true;
      return;
    }

    if (neoConfirmMeta) neoConfirmMeta.textContent = "Confirmed. Installing project NEO...";
    startWalkPlayback();
  });
}

if (neoReturnBtn) {
  neoReturnBtn.addEventListener("click", () => {
    returnFromNeoSequence();
  });
}

function turnNextPage() {
  if (neoModeActive) return;

  const turningPageIndex = currentPage;
  const wrapped = currentPage >= pages.length - 1;
  currentPage = wrapped ? 0 : currentPage + 1;

  if (wrapped) {
    pageLoopCount += 1;
    if (pageLoopCount === 1) {
      playDejaVuCat();
    }
    if (pageLoopCount >= 2) {
      renderBook(turningPageIndex);
      startNeoSequence();
      return;
    }
  }

  renderBook(turningPageIndex);
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
  if (isMobilePreviewBlocked()) return;

  const currentArticle = pages[currentPage];
  if (!currentArticle) return;

  const localIframes = currentArticle.querySelectorAll(".project-preview iframe[data-src]");
  localIframes.forEach((frame) => {
    frame.src = frame.dataset.src;
    frame.removeAttribute("data-src");
  });
}

function applyMobilePreviewMode() {
  const frames = document.querySelectorAll(".project-preview iframe");
  const captions = document.querySelectorAll(".project-preview figcaption");

  captions.forEach((caption) => {
    if (!caption.dataset.defaultText) caption.dataset.defaultText = caption.textContent || "";
    caption.textContent = isMobilePreviewBlocked()
      ? "Mobile preview disabled to keep the magazine experience clean. Use View site."
      : caption.dataset.defaultText;
  });

  if (isMobilePreviewBlocked()) {
    frames.forEach((frame) => {
      if (frame.src && !frame.dataset.src) {
        frame.dataset.src = frame.src;
      }
      frame.removeAttribute("src");
    });
    return;
  }

  hydrateVisibleIframes();
}

prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    const turningPageIndex = currentPage - 1;
    currentPage -= 1;
    renderBook(turningPageIndex);
  }
});

nextBtn.addEventListener("click", () => {
  turnNextPage();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" && currentPage < pages.length) {
    turnNextPage();
  }

  if (event.key === "ArrowLeft" && currentPage > 0) {
    const turningPageIndex = currentPage - 1;
    currentPage -= 1;
    renderBook(turningPageIndex);
  }
});

renderBook(0);
applyMobilePreviewMode();
window.addEventListener("resize", applyMobilePreviewMode);

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

if (
  topTitle &&
  titleMatrixVideo &&
  !IS_FILE_PROTOCOL &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const titleCanvas = document.createElement("canvas");
  const titleCtx = titleCanvas.getContext("2d");
  const FRAME_INTERVAL_MS = 85;
  let lastFrameTime = 0;

  const resizeTitleCanvas = () => {
    const rect = topTitle.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (titleCanvas.width !== width || titleCanvas.height !== height) {
      titleCanvas.width = width;
      titleCanvas.height = height;
    }
  };

  const drawVideoTexture = (now = 0) => {
    if (!titleCtx) return;
    if (now - lastFrameTime < FRAME_INTERVAL_MS) {
      requestAnimationFrame(drawVideoTexture);
      return;
    }

    if (titleMatrixVideo.readyState >= 2) {
      resizeTitleCanvas();
      titleCtx.drawImage(titleMatrixVideo, 0, 0, titleCanvas.width, titleCanvas.height);
      try {
        topTitle.style.backgroundImage = `url("${titleCanvas.toDataURL("image/jpeg", 0.58)}")`;
        topTitle.style.backgroundSize = "cover";
        topTitle.style.backgroundPosition = "center";
      } catch {
        // Media-to-canvas export can fail under restrictive origin rules.
      }
      lastFrameTime = now;
    }

    requestAnimationFrame(drawVideoTexture);
  };

  const playTitleMatrixVideo = () => {
    titleMatrixVideo.play().catch(() => {});
  };

  if (titleMatrixVideo.readyState >= 2) {
    playTitleMatrixVideo();
  } else {
    titleMatrixVideo.addEventListener("canplay", playTitleMatrixVideo, { once: true });
  }

  window.addEventListener("resize", resizeTitleCanvas);
  resizeTitleCanvas();
  requestAnimationFrame(drawVideoTexture);
}

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

    const revealDurationMs = 3200;
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
    window.setInterval(runTitleScramble, 11000);
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
  const coverPage = coverReveal.closest(".page--cover");
  const pointerSurface = coverPage || coverReveal;

  if (svg && !prefersReducedMotion && !isTouchFirst) {
    const mask = svg.querySelector("#coverMask");
    const wrapper = svg.querySelector(".cover-mask-wrapper");
    if (mask && wrapper) {
      const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, stampX: -9999, stampY: -9999 };
      const GRID_SIZE = 24;
      const COVERAGE_THRESHOLD = 0.85;
      const MAX_STAMPS = 900;
      const revealedCells = new Set();
      let revealUnlocked = false;

      const updateViewBox = () => {
        const rect = coverReveal.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
        mask.setAttribute("x", "0");
        mask.setAttribute("y", "0");
        mask.setAttribute("width", rect.width);
        mask.setAttribute("height", rect.height);
      };

      const unlockReveal = () => {
        if (revealUnlocked) return;
        revealUnlocked = true;
        coverReveal.classList.add("cover-reveal--unlocked");
        startSourceCodeRain();
      };

      const stampReveal = (x, y, radius) => {
        const stamp = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        stamp.setAttribute("fill", "black");
        stamp.setAttribute("fill-opacity", "1");
        stamp.setAttribute("cx", x.toFixed(2));
        stamp.setAttribute("cy", y.toFixed(2));
        stamp.setAttribute("r", radius.toFixed(2));
        wrapper.appendChild(stamp);

        while (wrapper.childNodes.length > MAX_STAMPS) {
          wrapper.removeChild(wrapper.firstChild);
        }
      };

      const markCoverage = (x, y, radius) => {
        const rect = coverReveal.getBoundingClientRect();
        const cols = Math.max(1, Math.ceil(rect.width / GRID_SIZE));
        const rows = Math.max(1, Math.ceil(rect.height / GRID_SIZE));
        const totalCells = cols * rows;

        const minCol = Math.max(0, Math.floor((x - radius) / GRID_SIZE));
        const maxCol = Math.min(cols - 1, Math.floor((x + radius) / GRID_SIZE));
        const minRow = Math.max(0, Math.floor((y - radius) / GRID_SIZE));
        const maxRow = Math.min(rows - 1, Math.floor((y + radius) / GRID_SIZE));

        for (let col = minCol; col <= maxCol; col += 1) {
          for (let row = minRow; row <= maxRow; row += 1) {
            revealedCells.add(`${col}:${row}`);
          }
        }

        const progress = revealedCells.size / totalCells;
        if (progress >= COVERAGE_THRESHOLD) {
          unlockReveal();
        }
      };

      const onPointerMove = (event) => {
        if (revealUnlocked) return;
        const rect = coverReveal.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return;

        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
        pointer.x = localX;
        pointer.y = localY;

        const speed = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
        const radius = Math.max(40, Math.min(86, 34 + speed * 0.52));
        const travel = Math.hypot(pointer.x - pointer.stampX, pointer.y - pointer.stampY);
        if (travel < 4) return;

        pointer.stampX = pointer.x;
        pointer.stampY = pointer.y;
        stampReveal(pointer.x, pointer.y, radius);
        markCoverage(pointer.x, pointer.y, radius);
      };

      pointerSurface.addEventListener("pointermove", onPointerMove);
      window.addEventListener("resize", updateViewBox);
      updateViewBox();
    }
  } else {
    coverReveal.addEventListener(
      "click",
      () => {
        coverReveal.classList.add("cover-reveal--unlocked");
      },
      { once: true }
    );
  }
}
