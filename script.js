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
