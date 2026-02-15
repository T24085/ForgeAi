const templates = Array.isArray(window.TEMPLATES_DATA) ? window.TEMPLATES_DATA : [];

const searchInput = document.getElementById("searchInput");
const tierFilter = document.getElementById("tierFilter");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const resetFilters = document.getElementById("resetFilters");
const templatesGrid = document.getElementById("templatesGrid");
const emptyState = document.getElementById("emptyState");
const templateCount = document.getElementById("templateCount");
const resultSummary = document.getElementById("resultSummary");
const TIER_DISPLAY_ORDER = ["premium", "business", "starter"];

let lightbox;
let lightboxImage;
let lightboxCaption;
let lightboxContent;

const formatTier = (tier) => tier.charAt(0).toUpperCase() + tier.slice(1);
const encodePath = (path) => encodeURI(path);
const resolveAbsoluteUrl = (path) => {
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return encodePath(path);
  }
};

function uniqSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function addFilterOptions(select, values, prefixText) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = prefixText ? `${prefixText}${value}` : value;
    select.appendChild(option);
  });
}

function initLightbox() {
  lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="image-lightbox__backdrop" data-close-lightbox="true"></div>
    <figure class="image-lightbox__content" role="dialog" aria-modal="true" aria-label="Expanded image preview">
      <button class="image-lightbox__close" type="button" aria-label="Close image preview">Close</button>
      <img alt="" />
      <figcaption></figcaption>
    </figure>
  `;

  lightboxImage = lightbox.querySelector("img");
  lightboxCaption = lightbox.querySelector("figcaption");
  lightboxContent = lightbox.querySelector(".image-lightbox__content");
  const lightboxBackdrop = lightbox.querySelector(".image-lightbox__backdrop");
  const lightboxCloseButton = lightbox.querySelector(".image-lightbox__close");

  lightbox.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest("[data-close-lightbox='true']") ||
      target.closest(".image-lightbox__close")
    ) {
      closeLightbox();
    }
  });

  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    });
  }

  if (lightboxContent) {
    lightboxContent.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("img") || target.closest(".image-lightbox__close")) return;
      closeLightbox();
    });
  }

  if (lightboxCloseButton) {
    lightboxCloseButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    });
  }

  if (lightboxImage) {
    lightboxImage.addEventListener("error", () => {
      lightboxImage.src = "./forgeai-logo.png";
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!lightbox.hidden && event.key === "Escape") {
      closeLightbox();
    }
  });

  document.body.appendChild(lightbox);
}

function openLightbox(src, alt, caption) {
  if (!lightbox || !lightboxImage || !lightboxCaption) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightboxCaption.textContent = caption;
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  if (!lightbox || !lightboxImage || !lightboxCaption) return;
  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxCaption.textContent = "";
  document.body.classList.remove("lightbox-open");
}

function populateFilters() {
  addFilterOptions(tierFilter, uniqSorted(templates.map((t) => t.tier)), "");
  addFilterOptions(categoryFilter, uniqSorted(templates.map((t) => t.category)), "");
  addFilterOptions(statusFilter, uniqSorted(templates.map((t) => t.status)), "");
}

function matchesFilters(item) {
  const query = (searchInput.value || "").trim().toLowerCase();
  const tier = tierFilter.value;
  const category = categoryFilter.value;
  const status = statusFilter.value;
  const haystack = `${item.name} ${item.title} ${item.category} ${item.tier} ${item.status}`.toLowerCase();

  if (query && !haystack.includes(query)) return false;
  if (tier !== "all" && item.tier !== tier) return false;
  if (category !== "all" && item.category !== category) return false;
  if (status !== "all" && item.status !== status) return false;
  return true;
}

function renderCards() {
  templatesGrid.innerHTML = "";
  const visible = templates.filter(matchesFilters).sort((a, b) => b.updated.localeCompare(a.updated));
  templateCount.textContent = String(templates.length);
  resultSummary.textContent = `Showing ${visible.length} of ${templates.length} templates`;

  if (!visible.length) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const createCard = (item) => {
    const previewSrc = resolveAbsoluteUrl(item.preview);
    const card = document.createElement("article");
    card.className = "template-card";
    card.innerHTML = `
      <button class="thumb-wrap thumb-button" type="button" aria-label="Open larger preview of ${item.title}">
        <img src="${previewSrc}" alt="Preview of ${item.title}" loading="lazy" />
        <span class="tier-pill" data-tier="${item.tier}">${formatTier(item.tier)}</span>
      </button>
      <div class="card-body">
        <h2>${item.title}</h2>
        <div class="meta-row">
          <span>${item.category}</span>
          <span>${item.status}</span>
        </div>
        <div class="card-foot">
          <p class="updated">Updated ${item.updated}</p>
          <div class="card-links">
            <a href="${encodePath(item.path)}" target="_blank" rel="noopener noreferrer">Preview</a>
            <a href="${encodePath(item.path.replace(/index\.html$/i, ""))}" target="_blank" rel="noopener noreferrer">Files</a>
          </div>
        </div>
      </div>
    `;
    const img = card.querySelector("img");
    const thumbButton = card.querySelector(".thumb-button");
    if (img) {
      img.addEventListener("error", () => {
        img.src = "./forgeai-logo.png";
      });
    }

    if (thumbButton && img) {
      thumbButton.addEventListener("click", () => {
        openLightbox(previewSrc, img.alt, item.title);
      });
    }
    return card;
  };

  const grouped = visible.reduce((acc, item) => {
    const key = String(item.tier || "").toLowerCase() || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const orderedTiers = [...TIER_DISPLAY_ORDER, ...Object.keys(grouped).filter((t) => !TIER_DISPLAY_ORDER.includes(t))];

  orderedTiers.forEach((tierKey) => {
    const items = grouped[tierKey] || [];
    if (!items.length) return;

    const section = document.createElement("section");
    section.className = "templates-tier-section";
    section.setAttribute("data-tier-group", tierKey);

    const heading = document.createElement("h2");
    heading.className = "tier-heading";
    heading.textContent = tierKey === "other" ? "Other" : formatTier(tierKey);
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "templates-tier-grid";
    items.forEach((item) => grid.appendChild(createCard(item)));

    section.appendChild(grid);
    templatesGrid.appendChild(section);
  });
}

function resetAllFilters() {
  searchInput.value = "";
  tierFilter.value = "all";
  categoryFilter.value = "all";
  statusFilter.value = "all";
  renderCards();
}

initLightbox();
populateFilters();
renderCards();

[searchInput, tierFilter, categoryFilter, statusFilter].forEach((el) => {
  el.addEventListener("input", renderCards);
  el.addEventListener("change", renderCards);
});

resetFilters.addEventListener("click", resetAllFilters);
