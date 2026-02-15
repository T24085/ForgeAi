const clockEl = document.getElementById("clock");
const workspaceEl = document.getElementById("workspace");
const menuEl = document.getElementById("context-menu");
const windowsLayerEl = document.getElementById("windows-layer");
const selectionBoxEl = document.getElementById("selection-box");
const modalEl = document.getElementById("project-modal");
const projectFormEl = document.getElementById("project-form");
const newProjectBtn = document.getElementById("new-project-btn");
const exportJsonBtn = document.getElementById("export-json-btn");
const importJsonBtn = document.getElementById("import-json-btn");
const importJsonInput = document.getElementById("import-json-input");
const startBtn = document.getElementById("start-btn");
const cancelProjectBtn = document.getElementById("cancel-project");
const isMobileView = window.matchMedia("(max-width: 900px)");

const STORAGE_KEYS = {
  positions: "desktopDesigner.iconPositions.v2",
  names: "desktopDesigner.iconNames.v1",
  customProjects: "desktopDesigner.customProjects.v1"
};
const EXPORT_VERSION = 1;

const FOLDERS = [
  { id: "folder:all", name: "All Links", abbr: "ALL", category: "all" },
  { id: "folder:project", name: "Projects", abbr: "PRJ", category: "project" },
  { id: "folder:team", name: "Teams", abbr: "TEAM", category: "team" },
  { id: "folder:store", name: "Stores", abbr: "SHOP", category: "store" }
];

const BASE_PROJECTS = [
  { id: "project:tpl", name: "Tribes Professional League", abbr: "TPL", url: "https://www.tribesprofessionalleague.online/", category: "team", custom: false },
  { id: "project:mythiq", name: "MythiQ", abbr: "MYQ", url: "https://t24085.github.io/MythiQ/", category: "project", custom: false },
  { id: "project:team-ft", name: "Team FT", abbr: "TFT", url: "https://t24085.github.io/Team-FT/", category: "team", custom: false },
  { id: "project:x-ring-classic", name: "X-Ring Classic", abbr: "XRC", url: "https://t24085.github.io/X-Ring-Classic", category: "project", custom: false },
  { id: "project:sunfire", name: "Sunfire Chili Spice Co.", abbr: "SCS", url: "https://t24085.github.io/Sunfire-Chili-Spice-Co/", category: "store", custom: false },
  { id: "project:teamdprk", name: "Team DPRK", abbr: "DPRK", url: "https://t24085.github.io/TeamDPRK/", category: "team", custom: false },
  { id: "project:raindance", name: "RainDance", abbr: "RD", url: "https://t24085.github.io/RainDance/", category: "project", custom: false },
  { id: "project:donut-palace", name: "Donut Palace", abbr: "DP", url: "http://www.donutpalace.store/index.luxe.html", category: "store", custom: false },
  { id: "project:johns-service", name: "John's Service", abbr: "JS", url: "https://t24085.github.io/JohnsService/", category: "project", custom: false },
  { id: "project:material-girls", name: "Material Girls Quilt Shop", abbr: "MGQ", url: "https://t24085.github.io/Material-Girls-Quilt-Shop/", category: "store", custom: false }
];

const state = {
  positions: readJson(STORAGE_KEYS.positions, {}),
  names: readJson(STORAGE_KEYS.names, {}),
  customProjects: sanitizeCustomProjects(readJson(STORAGE_KEYS.customProjects, [])),
  selected: new Set(),
  dragState: null,
  selectBoxState: null,
  activeContextTarget: null,
  openWindows: new Map(),
  zCursor: 100
};

init();

function init() {
  renderDesktopIcons();
  bindGlobalEvents();
  bindMenuEvents();
  bindProjectModalEvents();

  updateClock();
  setInterval(updateClock, 30000);
}

function bindGlobalEvents() {
  workspaceEl.addEventListener("pointerdown", onWorkspacePointerDown);
  workspaceEl.addEventListener("contextmenu", onWorkspaceContextMenu);

  document.addEventListener("click", (event) => {
    if (!menuEl.contains(event.target)) {
      closeContextMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeContextMenu();
      closeProjectModal();
      clearSelection();
    }
  });

  newProjectBtn.addEventListener("click", () => openProjectModal());
  startBtn.addEventListener("click", () => openProjectModal());
  exportJsonBtn.addEventListener("click", exportBackupJson);
  importJsonBtn.addEventListener("click", () => importJsonInput.click());
  importJsonInput.addEventListener("change", handleImportFile);

  window.addEventListener("resize", () => {
    closeContextMenu();
    if (!isMobileView.matches) {
      applyIconPositions();
    }
  });
}

function bindMenuEvents() {
  menuEl.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const target = state.activeContextTarget;

    if (action === "open" && target) {
      activateIcon(target, false);
    } else if (action === "open-new" && target?.dataset.kind === "project") {
      activateIcon(target, true);
    } else if (action === "open-folder" && target?.dataset.kind === "folder") {
      openFolderWindow(target.dataset.category);
    } else if (action === "copy-link" && target?.dataset.kind === "project") {
      await copyText(target.dataset.url);
    } else if (action === "rename" && target) {
      startRename(target);
    } else if (action === "delete-project" && target?.dataset.kind === "project" && target.dataset.custom === "true") {
      deleteCustomProject(target.dataset.id);
    } else if (action === "new-project") {
      openProjectModal();
    } else if (action === "reset-icon" && target) {
      delete state.positions[target.dataset.id];
      writeJson(STORAGE_KEYS.positions, state.positions);
      applyIconPositions();
    } else if (action === "reset-all") {
      state.positions = {};
      writeJson(STORAGE_KEYS.positions, state.positions);
      applyIconPositions();
    }

    closeContextMenu();
  });
}

function bindProjectModalEvents() {
  projectFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(projectFormEl);
    const name = `${formData.get("name") || ""}`.trim();
    const urlValue = `${formData.get("url") || ""}`.trim();
    const category = `${formData.get("category") || "project"}`;
    const rawAbbr = `${formData.get("abbr") || ""}`.trim();

    if (!name || !urlValue) {
      return;
    }

    let validUrl;
    try {
      validUrl = new URL(urlValue).toString();
    } catch {
      alert("Please enter a valid URL including https://");
      return;
    }

    const autoAbbr = rawAbbr.length === 0;
    const abbr = autoAbbr ? "" : normalizeAbbr(rawAbbr);

    const record = {
      id: `project:custom:${Date.now()}${Math.floor(Math.random() * 1000)}`,
      name,
      url: validUrl,
      category: ["project", "team", "store"].includes(category) ? category : "project",
      abbr,
      autoAbbr,
      custom: true
    };

    state.customProjects.push(record);
    writeJson(STORAGE_KEYS.customProjects, state.customProjects);

    renderDesktopIcons();
    refreshAllOpenWindows();
    closeProjectModal();
  });

  cancelProjectBtn.addEventListener("click", closeProjectModal);

  modalEl.addEventListener("click", (event) => {
    if (event.target === modalEl) {
      closeProjectModal();
    }
  });
}

function renderDesktopIcons() {
  workspaceEl.querySelectorAll(".desktop-icon").forEach((node) => node.remove());
  state.selected.clear();

  const projects = getAllProjects();
  const items = [
    ...FOLDERS.map((folder) => ({ ...folder, kind: "folder" })),
    ...projects.map((project, index) => ({ ...project, kind: "project", defaultIndex: index }))
  ];

  items.forEach((item) => {
    const icon = createIconElement(item);
    workspaceEl.append(icon);
  });

  applyIconPositions();
}

function createIconElement(item) {
  const displayName = getDisplayName(item.id, item.name);
  const autoAbbr = item.kind === "project" && (item.autoAbbr === true || !item.abbr);

  const icon = document.createElement("div");
  icon.className = `desktop-icon${item.kind === "folder" ? " is-folder" : ""}`;
  icon.tabIndex = 0;
  icon.dataset.id = item.id;
  icon.dataset.kind = item.kind;
  icon.dataset.category = item.category || "project";
  icon.dataset.custom = item.custom ? "true" : "false";
  icon.dataset.abbr = item.abbr || "";
  icon.dataset.autoAbbr = autoAbbr ? "true" : "false";
  icon.dataset.defaultIndex = `${item.defaultIndex || 0}`;
  if (item.url) {
    icon.dataset.url = item.url;
  }

  const art = document.createElement("span");
  art.className = "icon-art";
  art.textContent = autoAbbr ? deriveAbbr(displayName) : normalizeAbbr(item.abbr || deriveAbbr(displayName));
  if (item.kind === "project") {
    applyProjectIconTheme(art, displayName);
  }

  const label = document.createElement("span");
  label.className = "icon-label";
  label.textContent = displayName;

  icon.append(art, label);

  icon.addEventListener("dblclick", (event) => {
    event.preventDefault();
    activateIcon(icon, false);
  });

  icon.addEventListener("click", () => {
    if (isMobileView.matches) {
      activateIcon(icon, false);
    }
  });

  icon.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      activateIcon(icon, false);
    } else if (event.key === "F2") {
      startRename(icon);
    } else if (event.key === "Delete" && icon.dataset.custom === "true") {
      deleteCustomProject(icon.dataset.id);
    }
  });

  icon.addEventListener("pointerdown", (event) => onIconPointerDown(event, icon));
  icon.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    selectSingle(icon);
    openContextMenu(event.clientX, event.clientY, icon);
  });

  return icon;
}

function onIconPointerDown(event, icon) {
  if (isMobileView.matches || event.button !== 0 || icon.classList.contains("is-renaming")) {
    return;
  }

  closeContextMenu();

  const iconId = icon.dataset.id;
  const additive = event.ctrlKey || event.metaKey;

  if (additive) {
    toggleSelect(iconId);
  } else if (!state.selected.has(iconId)) {
    clearSelection();
    state.selected.add(iconId);
  }
  applySelectionStyles();

  const selectedIcons = getSelectedIcons();
  const origin = selectedIcons.map((node) => ({
    node,
    left: getIconLeft(node),
    top: getIconTop(node),
    width: node.offsetWidth,
    height: node.offsetHeight
  }));

  state.dragState = {
    pointerId: event.pointerId,
    lead: icon,
    startX: event.clientX,
    startY: event.clientY,
    origin,
    moved: false
  };

  icon.setPointerCapture(event.pointerId);
  icon.addEventListener("pointermove", onIconPointerMove);
  icon.addEventListener("pointerup", onIconPointerEnd);
  icon.addEventListener("pointercancel", onIconPointerEnd);
}

function onIconPointerMove(event) {
  const drag = state.dragState;
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }

  const deltaX = event.clientX - drag.startX;
  const deltaY = event.clientY - drag.startY;

  if (!drag.moved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
    drag.moved = true;
    drag.origin.forEach((entry) => entry.node.classList.add("is-dragging"));
  }

  if (!drag.moved) {
    return;
  }

  const bounds = drag.origin.reduce(
    (acc, entry) => {
      acc.minLeft = Math.min(acc.minLeft, entry.left);
      acc.minTop = Math.min(acc.minTop, entry.top);
      acc.maxRight = Math.max(acc.maxRight, entry.left + entry.width);
      acc.maxBottom = Math.max(acc.maxBottom, entry.top + entry.height);
      return acc;
    },
    { minLeft: Number.POSITIVE_INFINITY, minTop: Number.POSITIVE_INFINITY, maxRight: 0, maxBottom: 0 }
  );

  const clampedDx = clamp(deltaX, -bounds.minLeft, workspaceEl.clientWidth - bounds.maxRight);
  const clampedDy = clamp(deltaY, -bounds.minTop, workspaceEl.clientHeight - bounds.maxBottom);

  drag.origin.forEach((entry) => {
    entry.node.style.left = `${Math.round(entry.left + clampedDx)}px`;
    entry.node.style.top = `${Math.round(entry.top + clampedDy)}px`;
  });
}

function onIconPointerEnd(event) {
  const drag = state.dragState;
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }

  drag.lead.releasePointerCapture(event.pointerId);
  drag.lead.removeEventListener("pointermove", onIconPointerMove);
  drag.lead.removeEventListener("pointerup", onIconPointerEnd);
  drag.lead.removeEventListener("pointercancel", onIconPointerEnd);

  if (drag.moved) {
    drag.origin.forEach((entry) => entry.node.classList.remove("is-dragging"));
    savePositionsFromDom();
  }

  state.dragState = null;
}

function onWorkspacePointerDown(event) {
  if (isMobileView.matches || event.button !== 0) {
    return;
  }

  const hitIcon = event.target.closest(".desktop-icon");
  const inWindow = event.target.closest(".folder-window");
  if (hitIcon || inWindow) {
    return;
  }

  closeContextMenu();

  const additive = event.ctrlKey || event.metaKey;
  if (!additive) {
    clearSelection();
  }

  const workspaceRect = workspaceEl.getBoundingClientRect();
  const startX = event.clientX - workspaceRect.left;
  const startY = event.clientY - workspaceRect.top;

  selectionBoxEl.style.display = "block";
  selectionBoxEl.style.left = `${startX}px`;
  selectionBoxEl.style.top = `${startY}px`;
  selectionBoxEl.style.width = "0px";
  selectionBoxEl.style.height = "0px";

  state.selectBoxState = {
    pointerId: event.pointerId,
    startX,
    startY,
    baseSelected: new Set(state.selected),
    additive
  };

  workspaceEl.setPointerCapture(event.pointerId);
  workspaceEl.addEventListener("pointermove", onWorkspacePointerMove);
  workspaceEl.addEventListener("pointerup", onWorkspacePointerEnd);
  workspaceEl.addEventListener("pointercancel", onWorkspacePointerEnd);
}

function onWorkspacePointerMove(event) {
  const box = state.selectBoxState;
  if (!box || event.pointerId !== box.pointerId) {
    return;
  }

  const workspaceRect = workspaceEl.getBoundingClientRect();
  const currentX = event.clientX - workspaceRect.left;
  const currentY = event.clientY - workspaceRect.top;

  const left = Math.min(box.startX, currentX);
  const top = Math.min(box.startY, currentY);
  const width = Math.abs(currentX - box.startX);
  const height = Math.abs(currentY - box.startY);

  selectionBoxEl.style.left = `${left}px`;
  selectionBoxEl.style.top = `${top}px`;
  selectionBoxEl.style.width = `${width}px`;
  selectionBoxEl.style.height = `${height}px`;

  const rect = { left, top, right: left + width, bottom: top + height };

  const next = box.additive ? new Set(box.baseSelected) : new Set();

  getAllDesktopIcons().forEach((icon) => {
    const iLeft = getIconLeft(icon);
    const iTop = getIconTop(icon);
    const iRight = iLeft + icon.offsetWidth;
    const iBottom = iTop + icon.offsetHeight;

    if (isIntersecting(rect, { left: iLeft, top: iTop, right: iRight, bottom: iBottom })) {
      next.add(icon.dataset.id);
    }
  });

  state.selected = next;
  applySelectionStyles();
}

function onWorkspacePointerEnd(event) {
  const box = state.selectBoxState;
  if (!box || event.pointerId !== box.pointerId) {
    return;
  }

  workspaceEl.releasePointerCapture(event.pointerId);
  workspaceEl.removeEventListener("pointermove", onWorkspacePointerMove);
  workspaceEl.removeEventListener("pointerup", onWorkspacePointerEnd);
  workspaceEl.removeEventListener("pointercancel", onWorkspacePointerEnd);
  selectionBoxEl.style.display = "none";
  state.selectBoxState = null;
}

function onWorkspaceContextMenu(event) {
  const icon = event.target.closest(".desktop-icon");
  event.preventDefault();

  if (icon) {
    selectSingle(icon);
    openContextMenu(event.clientX, event.clientY, icon);
    return;
  }

  openContextMenu(event.clientX, event.clientY, null);
}

function activateIcon(icon, openInNewTab) {
  if (!icon) {
    return;
  }

  if (icon.dataset.kind === "folder") {
    openFolderWindow(icon.dataset.category);
    return;
  }

  const url = icon.dataset.url;
  if (!url) {
    return;
  }

  if (openInNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.open(url, "_self");
  }
}

function openFolderWindow(category) {
  const key = `window:${category}`;
  const existing = state.openWindows.get(key);
  if (existing) {
    bringWindowToFront(existing);
    refreshFolderWindow(existing, category);
    return;
  }

  const windowEl = document.createElement("article");
  windowEl.className = "folder-window is-opening";
  windowEl.dataset.windowKey = key;

  const titlebar = document.createElement("header");
  titlebar.className = "folder-titlebar";

  const title = document.createElement("p");
  title.style.margin = "0";
  title.textContent = `${getFolderDisplayName(category)} Folder`;

  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "x";

  titlebar.append(title, close);

  const content = document.createElement("div");
  content.className = "folder-content";

  windowEl.append(titlebar, content);
  windowsLayerEl.append(windowEl);

  windowEl.style.left = `${40 + state.openWindows.size * 24}px`;
  windowEl.style.top = `${38 + state.openWindows.size * 20}px`;

  refreshFolderWindow(windowEl, category);
  state.openWindows.set(key, windowEl);
  bringWindowToFront(windowEl);

  close.addEventListener("click", () => closeFolderWindow(windowEl, key));
  windowEl.addEventListener("pointerdown", () => bringWindowToFront(windowEl));
  bindWindowDrag(windowEl, titlebar);

  setTimeout(() => windowEl.classList.remove("is-opening"), 180);
}

function refreshFolderWindow(windowEl, category) {
  const title = windowEl.querySelector(".folder-titlebar p");
  title.textContent = `${getFolderDisplayName(category)} Folder`;

  const list = document.createElement("ul");
  list.className = "folder-list";

  getProjectsForCategory(category).forEach((project) => {
    const item = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.href = project.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = getDisplayName(project.id, project.name);
    item.append(anchor);
    list.append(item);
  });

  const content = windowEl.querySelector(".folder-content");
  content.innerHTML = "";
  content.append(list);
}

function closeFolderWindow(windowEl, key) {
  windowEl.classList.add("is-closing");
  setTimeout(() => {
    windowEl.remove();
    state.openWindows.delete(key);
  }, 150);
}

function bringWindowToFront(windowEl) {
  state.zCursor += 1;
  windowEl.style.zIndex = `${state.zCursor}`;
}

function bindWindowDrag(windowEl, handleEl) {
  handleEl.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    const startLeft = parseInt(windowEl.style.left, 10) || 0;
    const startTop = parseInt(windowEl.style.top, 10) || 0;
    const startX = event.clientX;
    const startY = event.clientY;

    bringWindowToFront(windowEl);

    const onMove = (moveEvent) => {
      const nextLeft = clamp(startLeft + (moveEvent.clientX - startX), 0, workspaceEl.clientWidth - windowEl.offsetWidth);
      const nextTop = clamp(startTop + (moveEvent.clientY - startY), 0, workspaceEl.clientHeight - windowEl.offsetHeight);
      windowEl.style.left = `${nextLeft}px`;
      windowEl.style.top = `${nextTop}px`;
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });
}

function openContextMenu(clientX, clientY, target) {
  state.activeContextTarget = target;

  const kind = target?.dataset.kind || "background";
  const isCustomProject = target?.dataset.kind === "project" && target?.dataset.custom === "true";

  setActionVisible("open", kind === "project");
  setActionVisible("open-new", kind === "project");
  setActionVisible("open-folder", kind === "folder");
  setActionVisible("copy-link", kind === "project");
  setActionVisible("rename", kind !== "background");
  setActionVisible("delete-project", isCustomProject);
  setActionVisible("new-project", true);
  setActionVisible("reset-icon", kind !== "background");
  setActionVisible("reset-all", true);

  menuEl.style.display = "block";

  const width = menuEl.offsetWidth;
  const height = menuEl.offsetHeight;
  const x = Math.min(clientX, window.innerWidth - width - 6);
  const y = Math.min(clientY, window.innerHeight - height - 6);

  menuEl.style.left = `${x}px`;
  menuEl.style.top = `${y}px`;
}

function setActionVisible(action, visible) {
  const button = menuEl.querySelector(`button[data-action="${action}"]`);
  if (!button) {
    return;
  }
  button.classList.toggle("is-hidden", !visible);
}

function closeContextMenu() {
  menuEl.style.display = "none";
  state.activeContextTarget = null;
}

function startRename(icon) {
  if (!icon || icon.classList.contains("is-renaming")) {
    return;
  }

  const label = icon.querySelector(".icon-label");
  const currentName = label.textContent || "";

  icon.classList.add("is-renaming");
  label.style.display = "none";

  const input = document.createElement("input");
  input.className = "rename-input";
  input.type = "text";
  input.value = currentName;
  input.maxLength = 60;
  icon.append(input);
  input.focus();
  input.select();

  const finish = (save) => {
    if (save) {
      const next = input.value.trim();
      if (next) {
        state.names[icon.dataset.id] = next;
        writeJson(STORAGE_KEYS.names, state.names);
        label.textContent = next;
        if (icon.dataset.kind === "project") {
          const art = icon.querySelector(".icon-art");
          if (icon.dataset.autoAbbr === "true") {
            art.textContent = deriveAbbr(next);
          }
          applyProjectIconTheme(art, next);
        }
        refreshAllOpenWindows();
      }
    }

    input.remove();
    label.style.display = "";
    icon.classList.remove("is-renaming");
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      finish(true);
    } else if (event.key === "Escape") {
      finish(false);
    }
  });

  input.addEventListener("blur", () => finish(true), { once: true });
}

function deleteCustomProject(projectId) {
  state.customProjects = state.customProjects.filter((project) => project.id !== projectId);
  writeJson(STORAGE_KEYS.customProjects, state.customProjects);

  delete state.positions[projectId];
  writeJson(STORAGE_KEYS.positions, state.positions);

  delete state.names[projectId];
  writeJson(STORAGE_KEYS.names, state.names);

  state.selected.delete(projectId);
  renderDesktopIcons();
  refreshAllOpenWindows();
}

function applyIconPositions() {
  if (isMobileView.matches) {
    getAllDesktopIcons().forEach((icon) => {
      icon.style.left = "";
      icon.style.top = "";
    });
    return;
  }

  const folders = getAllDesktopIcons().filter((icon) => icon.dataset.kind === "folder");
  const projects = getAllDesktopIcons().filter((icon) => icon.dataset.kind === "project");

  folders.forEach((icon, index) => {
    const saved = state.positions[icon.dataset.id];
    if (saved) {
      icon.style.left = `${saved.x}px`;
      icon.style.top = `${saved.y}px`;
      return;
    }

    icon.style.left = "10px";
    icon.style.top = `${8 + index * 98}px`;
  });

  const maxRows = Math.max(1, Math.floor(workspaceEl.clientHeight / 98));
  projects.forEach((icon, i) => {
    const saved = state.positions[icon.dataset.id];
    if (saved) {
      icon.style.left = `${saved.x}px`;
      icon.style.top = `${saved.y}px`;
      return;
    }

    const col = Math.floor(i / maxRows);
    const row = i % maxRows;
    icon.style.left = `${132 + col * 112}px`;
    icon.style.top = `${8 + row * 98}px`;
  });
}

function savePositionsFromDom() {
  getAllDesktopIcons().forEach((icon) => {
    if (isMobileView.matches) {
      return;
    }
    state.positions[icon.dataset.id] = {
      x: getIconLeft(icon),
      y: getIconTop(icon)
    };
  });

  writeJson(STORAGE_KEYS.positions, state.positions);
}

function selectSingle(icon) {
  clearSelection();
  state.selected.add(icon.dataset.id);
  applySelectionStyles();
}

function toggleSelect(iconId) {
  if (state.selected.has(iconId)) {
    state.selected.delete(iconId);
  } else {
    state.selected.add(iconId);
  }
}

function clearSelection() {
  state.selected.clear();
  applySelectionStyles();
}

function applySelectionStyles() {
  getAllDesktopIcons().forEach((icon) => {
    icon.classList.toggle("is-selected", state.selected.has(icon.dataset.id));
  });
}

function getSelectedIcons() {
  return getAllDesktopIcons().filter((icon) => state.selected.has(icon.dataset.id));
}

function getAllDesktopIcons() {
  return [...workspaceEl.querySelectorAll(".desktop-icon")];
}

function getProjectsForCategory(category) {
  const projects = getAllProjects();
  if (category === "all") {
    return projects;
  }
  return projects.filter((item) => item.category === category);
}

function getAllProjects() {
  return [...BASE_PROJECTS, ...state.customProjects];
}

function getFolderDisplayName(category) {
  const folder = FOLDERS.find((node) => node.category === category);
  if (!folder) {
    return "Folder";
  }
  return getDisplayName(folder.id, folder.name);
}

function getDisplayName(id, fallback) {
  return state.names[id] || fallback;
}

function refreshAllOpenWindows() {
  state.openWindows.forEach((windowEl, key) => {
    const category = key.replace("window:", "");
    refreshFolderWindow(windowEl, category);
  });
}

function exportBackupJson() {
  const payload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    customProjects: state.customProjects,
    names: state.names,
    positions: state.positions
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `desktop-designer-backup-${formatDateForFilename(new Date())}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function handleImportFile(event) {
  const file = event.target.files?.[0];
  importJsonInput.value = "";
  if (!file) {
    return;
  }

  let parsed;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    alert("Import failed. Please select a valid JSON file.");
    return;
  }

  const nextCustomProjects = sanitizeCustomProjects(parsed?.customProjects || []);
  const nextNames = sanitizeNames(parsed?.names || {});
  const nextPositions = sanitizePositions(parsed?.positions || {});

  const approved = window.confirm(
    `Import ${nextCustomProjects.length} custom projects? This will replace your current saved custom projects, names, and icon positions.`
  );
  if (!approved) {
    return;
  }

  state.customProjects = nextCustomProjects;
  state.names = nextNames;
  state.positions = nextPositions;
  state.selected.clear();

  writeJson(STORAGE_KEYS.customProjects, state.customProjects);
  writeJson(STORAGE_KEYS.names, state.names);
  writeJson(STORAGE_KEYS.positions, state.positions);

  renderDesktopIcons();
  refreshAllOpenWindows();
}

function openProjectModal() {
  projectFormEl.reset();
  modalEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
  document.getElementById("project-name").focus();
}

function closeProjectModal() {
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function normalizeAbbr(value) {
  const clean = `${value || ""}`.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (clean || "APP").slice(0, 4);
}

function deriveAbbr(name) {
  const clean = `${name || ""}`.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  if (!clean) {
    return "APP";
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return normalizeAbbr(parts.slice(0, 4).map((part) => part[0]).join(""));
  }

  return normalizeAbbr(clean.slice(0, 4));
}

function applyProjectIconTheme(iconArtEl, name) {
  const theme = getProjectTheme(name);
  iconArtEl.style.setProperty("--icon-top", theme.top);
  iconArtEl.style.setProperty("--icon-bottom", theme.bottom);
  iconArtEl.style.setProperty("--icon-fg", theme.fg);
}

function getProjectTheme(name) {
  const hash = hashString(name || "project");
  const hue = hash % 360;
  const sat = 58 + (hash % 18);
  const topLight = 66 + (hash % 7);
  const bottomLight = 36 + (hash % 8);
  return {
    top: `hsl(${hue} ${sat}% ${topLight}%)`,
    bottom: `hsl(${hue} ${Math.max(44, sat - 9)}% ${bottomLight}%)`,
    fg: bottomLight > 46 ? "#1b1b1b" : "#f8f8f8"
  };
}

function hashString(value) {
  let hash = 0;
  const text = `${value}`;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function sanitizeCustomProjects(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const autoAbbr = item.autoAbbr === true || !`${item.abbr || ""}`.trim();
      return {
        id: typeof item.id === "string" && item.id.startsWith("project:custom:") ? item.id : `project:custom:${Date.now()}${Math.floor(Math.random() * 1000)}`,
        name: `${item.name || "Untitled"}`.slice(0, 60),
        abbr: autoAbbr ? "" : normalizeAbbr(item.abbr),
        autoAbbr,
        url: `${item.url || ""}`,
        category: ["project", "team", "store"].includes(item.category) ? item.category : "project",
        custom: true
      };
    })
    .filter((item) => {
      try {
        item.url = new URL(item.url).toString();
        return true;
      } catch {
        return false;
      }
    });
}

function sanitizeNames(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (typeof key !== "string") {
      return;
    }
    const name = `${entry || ""}`.trim();
    if (name) {
      out[key] = name.slice(0, 60);
    }
  });
  return out;
}

function sanitizePositions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out = {};
  Object.entries(value).forEach(([key, entry]) => {
    const rawX = Number(entry?.x);
    const rawY = Number(entry?.y);
    if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) {
      return;
    }
    out[key] = {
      x: Math.max(0, Math.round(rawX)),
      y: Math.max(0, Math.round(rawY))
    };
  });
  return out;
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDateForFilename(date) {
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getIconLeft(icon) {
  return parseInt(icon.style.left, 10) || 0;
}

function getIconTop(icon) {
  return parseInt(icon.style.top, 10) || 0;
}

function isIntersecting(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
}
