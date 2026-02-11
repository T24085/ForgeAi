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

const formatTier = (tier) => tier.charAt(0).toUpperCase() + tier.slice(1);
const encodePath = (path) => encodeURI(path);

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

  visible.forEach((item) => {
    const card = document.createElement("article");
    card.className = "template-card";
    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="${encodePath(item.preview)}" alt="Preview of ${item.title}" loading="lazy" />
        <span class="tier-pill" data-tier="${item.tier}">${formatTier(item.tier)}</span>
      </div>
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
    if (img) {
      img.addEventListener("error", () => {
        img.src = "./forgeai-logo.png";
      });
    }

    templatesGrid.appendChild(card);
  });
}

function resetAllFilters() {
  searchInput.value = "";
  tierFilter.value = "all";
  categoryFilter.value = "all";
  statusFilter.value = "all";
  renderCards();
}

populateFilters();
renderCards();

[searchInput, tierFilter, categoryFilter, statusFilter].forEach((el) => {
  el.addEventListener("input", renderCards);
  el.addEventListener("change", renderCards);
});

resetFilters.addEventListener("click", resetAllFilters);
