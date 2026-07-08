const STORAGE_KEY = "portfolioData";
const ADMIN_SESSION_KEY = "portfolioAdminLoggedIn";
const ADMIN_PASSWORD = "admin123";

let adminState = loadInitialData();
let projectPreviewIndex = 0;

const elements = {
  authContent: document.querySelectorAll("[data-auth-content]"),
  loginPanel: document.querySelector("#loginPanel"),
  loginForm: document.querySelector("#loginForm"),
  loginPassword: document.querySelector("#loginPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  logoutButton: document.querySelector("#logoutButton"),
  statusMessage: document.querySelector("#statusMessage"),
  saveChanges: document.querySelector("#saveChanges"),
  resetDefault: document.querySelector("#resetDefault"),
  exportJson: document.querySelector("#exportJson"),
  importJson: document.querySelector("#importJson"),
  importFile: document.querySelector("#importFile"),
  exportPdf: document.querySelector("#exportPdf"),
  exportPpt: document.querySelector("#exportPpt"),
  exportStatus: document.querySelector("#exportStatus"),
  previewHeroImage: document.querySelector("#previewHeroImage"),
  previewAboutImage: document.querySelector("#previewAboutImage"),
  previewProjectImage: document.querySelector("#previewProjectImage"),
  previewToolImage: document.querySelector("#previewToolImage"),
  previewSocialImage: document.querySelector("#previewSocialImage"),
  profileForm: document.querySelector("#profileForm"),
  projectForm: document.querySelector("#projectForm"),
  projectClear: document.querySelector("#projectClear"),
  toolForm: document.querySelector("#toolForm"),
  toolClear: document.querySelector("#toolClear"),
  socialForm: document.querySelector("#socialForm"),
  socialClear: document.querySelector("#socialClear"),
  projectList: document.querySelector("#projectList"),
  toolList: document.querySelector("#toolList"),
  socialList: document.querySelector("#socialList"),
  profilePreviewPhoto: document.querySelector("#profilePreviewPhoto"),
  profilePreviewTitle: document.querySelector("#profilePreviewTitle"),
  profilePreviewName: document.querySelector("#profilePreviewName"),
  profilePreviewSubtitle: document.querySelector("#profilePreviewSubtitle"),
  profilePreviewAbout: document.querySelector("#profilePreviewAbout"),
  projectPreviewImage: document.querySelector("#projectPreviewImage"),
  projectPreviewPrev: document.querySelector("#projectPreviewPrev"),
  projectPreviewNext: document.querySelector("#projectPreviewNext"),
  projectPreviewIndicator: document.querySelector("#projectPreviewIndicator"),
  projectPreviewTitle: document.querySelector("#projectPreviewTitle"),
  projectPreviewCategory: document.querySelector("#projectPreviewCategory"),
  projectPreviewDescription: document.querySelector("#projectPreviewDescription"),
  projectPreviewTechStack: document.querySelector("#projectPreviewTechStack"),
  projectPreviewLinks: document.querySelector("#projectPreviewLinks"),
  toolPreviewIcon: document.querySelector("#toolPreviewIcon"),
  toolPreviewName: document.querySelector("#toolPreviewName"),
  toolPreviewCategory: document.querySelector("#toolPreviewCategory"),
  socialPreviewLink: document.querySelector("#socialPreviewLink"),
  socialPreviewIcon: document.querySelector("#socialPreviewIcon"),
  socialPreviewName: document.querySelector("#socialPreviewName"),
  socialPreviewUrl: document.querySelector("#socialPreviewUrl"),
  profileImageWarning: document.querySelector("#profileImageWarning"),
  projectImageWarning: document.querySelector("#projectImageWarning"),
  toolImageWarning: document.querySelector("#toolImageWarning"),
  socialImageWarning: document.querySelector("#socialImageWarning")
};

const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#303030"/>
  <rect x="90" y="80" width="460" height="260" rx="18" fill="#252525" stroke="#ff7a00" stroke-width="4" stroke-dasharray="12 12"/>
  <circle cx="230" cy="170" r="38" fill="#4a4a4a"/>
  <path d="M140 305l115-105 82 72 56-48 107 81H140z" fill="#4a4a4a"/>
  <text x="320" y="365" text-anchor="middle" fill="#ff7a00" font-family="Arial, sans-serif" font-size="28" font-weight="700">Image not found</text>
</svg>
`)}`;

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function showAdminDashboard() {
  if (elements.loginPanel) {
    elements.loginPanel.hidden = true;
  }

  elements.authContent.forEach((element) => {
    element.hidden = false;
  });
}

function showLoginPanel() {
  if (elements.loginPanel) {
    elements.loginPanel.hidden = false;
  }

  elements.authContent.forEach((element) => {
    element.hidden = true;
  });

  if (elements.loginPassword) {
    elements.loginPassword.focus();
  }
}

function applyAuthState() {
  if (isLoggedIn()) {
    showAdminDashboard();
  } else {
    showLoginPanel();
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeAssetPath(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().replace(/\\/g, "/");
  const assetIndex = normalized.toLowerCase().indexOf("assets/");

  return assetIndex >= 0 ? normalized.slice(assetIndex) : normalized;
}

function getDefaultData() {
  if (typeof portfolioData !== "undefined") {
    return deepClone(portfolioData);
  }

  return {
    profile: {
      name: "",
      title: "",
      subtitle: "",
      photo: {
        hero: "",
        about: ""
      },
      cvLink: "",
      about: []
    },
    socials: [],
    tools: [],
    projects: []
  };
}

function normalizeData(data) {
  const defaults = getDefaultData();
  const safeData = data && typeof data === "object" ? data : {};
  const profile = safeData.profile && typeof safeData.profile === "object" ? safeData.profile : {};
  const photo = profile.photo && typeof profile.photo === "object"
    ? profile.photo
    : { hero: profile.photo || defaults.profile.photo.hero, about: defaults.profile.photo.about };

  return {
    ...defaults,
    ...safeData,
    profile: {
      ...defaults.profile,
      ...profile,
      photo: {
        ...defaults.profile.photo,
        ...photo,
        hero: normalizeAssetPath(photo.hero || defaults.profile.photo.hero),
        about: normalizeAssetPath(photo.about || defaults.profile.photo.about)
      },
      cvLink: normalizeAssetPath(profile.cvLink || defaults.profile.cvLink),
      about: Array.isArray(profile.about)
        ? profile.about
        : String(profile.about || "").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)
    },
    socials: (Array.isArray(safeData.socials) ? safeData.socials : defaults.socials).map((social) => ({
      ...social,
      icon: normalizeAssetPath(social.icon)
    })),
    tools: (Array.isArray(safeData.tools) ? safeData.tools : defaults.tools).map((tool) => ({
      ...tool,
      icon: normalizeAssetPath(tool.icon)
    })),
    projects: (Array.isArray(safeData.projects) ? safeData.projects : defaults.projects).map(normalizeProject)
  };
}

function loadInitialData() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      return normalizeData(JSON.parse(storedData));
    }
  } catch (error) {
    return normalizeData(getDefaultData());
  }

  return normalizeData(getDefaultData());
}

function showStatus(message, isError = false) {
  if (!elements.statusMessage) {
    return;
  }

  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("is-error", isError);
}

function getValue(id) {
  const input = document.querySelector(`#${id}`);
  return input ? input.value.trim() : "";
}

function setValue(id, value) {
  const input = document.querySelector(`#${id}`);

  if (input) {
    input.value = value || "";
  }
}

function setChecked(id, value) {
  const input = document.querySelector(`#${id}`);

  if (input) {
    input.checked = Boolean(value);
  }
}

function getChecked(id) {
  const input = document.querySelector(`#${id}`);
  return input ? input.checked : false;
}

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function splitImagePaths(value) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function getProjectImages(project) {
  if (!project || typeof project !== "object") {
    return [];
  }

  if (Array.isArray(project.images)) {
    const images = project.images.map((image) => normalizeAssetPath(String(image || ""))).filter(Boolean);

    if (images.length) {
      return images;
    }
  }

  if (typeof project.images === "string") {
    const images = splitImagePaths(project.images).map(normalizeAssetPath);

    if (images.length) {
      return images;
    }
  }

  return project.image ? [normalizeAssetPath(project.image)] : [];
}

function normalizeProject(project) {
  const safeProject = project && typeof project === "object" ? project : {};
  const images = getProjectImages(safeProject);

  return {
    ...safeProject,
    image: normalizeAssetPath(safeProject.image) || images[0] || "",
    images
  };
}

function setImageWarning(warningElement, isVisible) {
  if (warningElement) {
    warningElement.hidden = !isVisible;
  }
}

function setPreviewImage(image, src, alt, warningElement) {
  if (!image) {
    return;
  }

  if (!src) {
    image.hidden = false;
    image.onerror = null;
    image.onload = null;
    image.src = PLACEHOLDER_IMAGE;
    setImageWarning(warningElement, false);
    return;
  }

  image.hidden = false;
  image.alt = alt || "";
  image.onload = () => setImageWarning(warningElement, false);
  image.onerror = () => {
    image.onerror = null;
    image.onload = null;
    image.src = PLACEHOLDER_IMAGE;
    setImageWarning(warningElement, true);
  };
  image.src = src;
}

function setPreviewText(element, value, fallback = "") {
  if (element) {
    element.textContent = value || fallback;
  }
}

function joinAbout(about) {
  if (Array.isArray(about)) {
    return about.join("\n\n");
  }

  return about || "";
}

function readProfileForm() {
  adminState.profile = {
    ...adminState.profile,
    name: getValue("profileName"),
    title: getValue("profileTitle"),
    subtitle: getValue("profileSubtitle"),
    photo: {
      hero: getValue("profileHeroPhoto"),
      about: getValue("profileAboutPhoto")
    },
    cvLink: getValue("profileCvLink"),
    about: getValue("profileAbout").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)
  };
}

function populateProfileForm() {
  const profile = adminState.profile || {};
  const photo = profile.photo || {};

  setValue("profileName", profile.name);
  setValue("profileTitle", profile.title);
  setValue("profileSubtitle", profile.subtitle);
  setValue("profileHeroPhoto", photo.hero);
  setValue("profileAboutPhoto", photo.about);
  setValue("profileCvLink", profile.cvLink);
  setValue("profileAbout", joinAbout(profile.about));
  updateProfilePreview();
}

function saveToStorage(message = "Changes saved. Reload index.html to see the latest data.") {
  readProfileForm();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adminState));
  showStatus(message);
}

function createPreview(src, label, isIcon = false) {
  const preview = document.createElement("div");
  preview.className = isIcon ? "item-preview icon-preview" : "item-preview";

  if (src) {
    const image = document.createElement("img");
    image.src = src;
    image.alt = label || "";
    image.addEventListener("error", () => {
      preview.textContent = (label || "?").charAt(0).toUpperCase();
      image.remove();
    }, { once: true });
    preview.appendChild(image);
  } else {
    preview.textContent = (label || "?").charAt(0).toUpperCase();
  }

  return preview;
}

function createItemCard({ title, meta, description, image, isIcon, onEdit, onDelete }) {
  const card = document.createElement("article");
  const content = document.createElement("div");
  const heading = document.createElement("h3");
  const metaText = document.createElement("p");
  const desc = document.createElement("p");
  const actions = document.createElement("div");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");

  card.className = "item-card";
  content.className = "item-content";
  actions.className = "item-actions";
  editButton.className = "btn btn-secondary";
  deleteButton.className = "btn btn-danger";

  heading.textContent = title || "Untitled";
  metaText.innerHTML = `<span class="item-meta">${meta || "No category"}</span>`;
  desc.textContent = description || "";
  editButton.type = "button";
  editButton.textContent = "Edit";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";

  editButton.addEventListener("click", onEdit);
  deleteButton.addEventListener("click", onDelete);

  content.appendChild(heading);
  content.appendChild(metaText);

  if (description) {
    content.appendChild(desc);
  }

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  card.appendChild(createPreview(image, title, isIcon));
  card.appendChild(content);
  card.appendChild(actions);

  return card;
}

function renderEmpty(container, text) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  container.appendChild(empty);
}

function renderProjectList() {
  elements.projectList.innerHTML = "";

  if (!adminState.projects.length) {
    renderEmpty(elements.projectList, "No projects yet.");
    return;
  }

  adminState.projects.forEach((project, index) => {
    elements.projectList.appendChild(createItemCard({
      title: project.title,
      meta: `${project.category || "No category"}${project.featured ? " - Featured" : ""}`,
      description: project.description,
      image: getProjectImages(project)[0] || project.image,
      onEdit: () => editProject(index),
      onDelete: () => deleteProject(index)
    }));
  });
}

function renderToolList() {
  elements.toolList.innerHTML = "";

  if (!adminState.tools.length) {
    renderEmpty(elements.toolList, "No tools yet.");
    return;
  }

  adminState.tools.forEach((tool, index) => {
    elements.toolList.appendChild(createItemCard({
      title: tool.name,
      meta: tool.category,
      description: tool.icon,
      image: tool.icon,
      isIcon: true,
      onEdit: () => editTool(index),
      onDelete: () => deleteTool(index)
    }));
  });
}

function renderSocialList() {
  elements.socialList.innerHTML = "";

  if (!adminState.socials.length) {
    renderEmpty(elements.socialList, "No social links yet.");
    return;
  }

  adminState.socials.forEach((social, index) => {
    elements.socialList.appendChild(createItemCard({
      title: social.name,
      meta: social.url,
      description: social.icon,
      image: social.icon,
      isIcon: true,
      onEdit: () => editSocial(index),
      onDelete: () => deleteSocial(index)
    }));
  });
}

function renderAllLists() {
  renderProjectList();
  renderToolList();
  renderSocialList();
}

function updateProfilePreview() {
  const about = getValue("profileAbout").replace(/\s+/g, " ").trim();

  setPreviewImage(elements.profilePreviewPhoto, getValue("profileAboutPhoto") || getValue("profileHeroPhoto"), getValue("profileName"), elements.profileImageWarning);
  setPreviewText(elements.profilePreviewTitle, getValue("profileTitle"), "Hi I am");
  setPreviewText(elements.profilePreviewName, getValue("profileName"), "Profile Name");
  setPreviewText(elements.profilePreviewSubtitle, getValue("profileSubtitle"), "Role / Subtitle");
  setPreviewText(elements.profilePreviewAbout, about.length > 180 ? `${about.slice(0, 180)}...` : about, "Short about text will appear here.");
}

function updateProjectPreview() {
  const project = readProjectForm();
  const images = getProjectImages(project);
  const previewImages = images.length ? images : [PLACEHOLDER_IMAGE];

  if (projectPreviewIndex > previewImages.length - 1) {
    projectPreviewIndex = previewImages.length - 1;
  }

  if (projectPreviewIndex < 0) {
    projectPreviewIndex = 0;
  }

  setPreviewImage(elements.projectPreviewImage, previewImages[projectPreviewIndex], project.title, elements.projectImageWarning);
  setPreviewText(elements.projectPreviewTitle, project.title, "Project Title");
  setPreviewText(elements.projectPreviewCategory, project.category, "Category");
  setPreviewText(elements.projectPreviewDescription, project.description, "Project description will appear here.");

  const hasMultipleImages = previewImages.length > 1;
  elements.projectPreviewPrev.hidden = !hasMultipleImages;
  elements.projectPreviewNext.hidden = !hasMultipleImages;
  elements.projectPreviewIndicator.hidden = images.length === 0;
  elements.projectPreviewIndicator.textContent = `${projectPreviewIndex + 1} / ${previewImages.length}`;

  elements.projectPreviewTechStack.innerHTML = "";
  project.techStack.forEach((tech) => {
    const chip = document.createElement("span");
    chip.textContent = tech;
    elements.projectPreviewTechStack.appendChild(chip);
  });

  elements.projectPreviewLinks.innerHTML = "";

  [
    { label: "Demo", url: project.demoLink },
    { label: "Visit", url: project.visitLink },
    { label: "GitHub", url: project.githubLink }
  ].forEach((linkData) => {
    if (!linkData.url) {
      return;
    }

    const link = document.createElement("a");
    link.href = linkData.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = linkData.label;
    elements.projectPreviewLinks.appendChild(link);
  });
}

function updateToolPreview() {
  const tool = readToolForm();

  setPreviewImage(elements.toolPreviewIcon, tool.icon, tool.name, elements.toolImageWarning);
  setPreviewText(elements.toolPreviewName, tool.name, "Tool Name");
  setPreviewText(elements.toolPreviewCategory, tool.category, "Category");
}

function updateSocialPreview() {
  const social = readSocialForm();

  if (elements.socialPreviewLink) {
    elements.socialPreviewLink.href = social.url || "#";
    elements.socialPreviewLink.setAttribute("aria-label", social.name || "Social media");
  }

  setPreviewImage(elements.socialPreviewIcon, social.icon, social.name, elements.socialImageWarning);
  setPreviewText(elements.socialPreviewName, social.name, "Social Name");
  setPreviewText(elements.socialPreviewUrl, social.url, "Social URL");
}

function previewSpecificImage(path, image, warningElement, alt) {
  setPreviewImage(image, path, alt, warningElement);

  if (!path) {
    showStatus("Please enter an image path first.", true);
    return;
  }

  const tester = new Image();

  tester.onload = () => showStatus("Image loaded successfully.");
  tester.onerror = () => showStatus("Image not found", true);
  tester.src = path;
}

function updateAllPreviews() {
  updateProfilePreview();
  updateProjectPreview();
  updateToolPreview();
  updateSocialPreview();
}

function bindLivePreview(form, updatePreview) {
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
}

function resetProjectForm() {
  elements.projectForm.reset();
  setValue("projectIndex", "");
  projectPreviewIndex = 0;
  document.querySelector("#projectSubmit").textContent = "Add Project";
  updateProjectPreview();
}

function readProjectForm() {
  const images = splitImagePaths(getValue("projectImages"));

  return {
    title: getValue("projectTitle"),
    category: getValue("projectCategory"),
    image: images[0] || "",
    images,
    description: getValue("projectDescription"),
    techStack: splitList(getValue("projectTechStack")),
    demoLink: getValue("projectDemoLink"),
    visitLink: getValue("projectVisitLink"),
    githubLink: getValue("projectGithubLink"),
    featured: getChecked("projectFeatured")
  };
}

function editProject(index) {
  const project = normalizeProject(adminState.projects[index]);
  const images = getProjectImages(project);

  setValue("projectIndex", String(index));
  setValue("projectTitle", project.title);
  setValue("projectCategory", project.category);
  setValue("projectImages", images.join("\n"));
  setValue("projectDescription", project.description);
  setValue("projectTechStack", Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack);
  setValue("projectDemoLink", project.demoLink);
  setValue("projectVisitLink", project.visitLink);
  setValue("projectGithubLink", project.githubLink);
  setChecked("projectFeatured", project.featured);
  document.querySelector("#projectSubmit").textContent = "Update Project";
  projectPreviewIndex = 0;
  updateProjectPreview();
  elements.projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProject(index) {
  if (!confirm("Delete this project?")) {
    return;
  }

  adminState.projects.splice(index, 1);
  renderProjectList();
  resetProjectForm();
  showStatus("Project deleted. Click Save Changes to publish it.");
}

function resetToolForm() {
  elements.toolForm.reset();
  setValue("toolIndex", "");
  document.querySelector("#toolSubmit").textContent = "Add Tool";
  updateToolPreview();
}

function readToolForm() {
  return {
    name: getValue("toolName"),
    icon: getValue("toolIcon"),
    category: getValue("toolCategory")
  };
}

function editTool(index) {
  const tool = adminState.tools[index];

  setValue("toolIndex", String(index));
  setValue("toolName", tool.name);
  setValue("toolIcon", tool.icon);
  setValue("toolCategory", tool.category);
  document.querySelector("#toolSubmit").textContent = "Update Tool";
  updateToolPreview();
  elements.toolForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteTool(index) {
  if (!confirm("Delete this tool?")) {
    return;
  }

  adminState.tools.splice(index, 1);
  renderToolList();
  resetToolForm();
  showStatus("Tool deleted. Click Save Changes to publish it.");
}

function resetSocialForm() {
  elements.socialForm.reset();
  setValue("socialIndex", "");
  document.querySelector("#socialSubmit").textContent = "Add Social";
  updateSocialPreview();
}

function readSocialForm() {
  return {
    name: getValue("socialName"),
    icon: getValue("socialIcon"),
    url: getValue("socialUrl")
  };
}

function editSocial(index) {
  const social = adminState.socials[index];

  setValue("socialIndex", String(index));
  setValue("socialName", social.name);
  setValue("socialIcon", social.icon);
  setValue("socialUrl", social.url);
  document.querySelector("#socialSubmit").textContent = "Update Social";
  updateSocialPreview();
  elements.socialForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteSocial(index) {
  if (!confirm("Delete this social link?")) {
    return;
  }

  adminState.socials.splice(index, 1);
  renderSocialList();
  resetSocialForm();
  showStatus("Social link deleted. Click Save Changes to publish it.");
}

function exportJson() {
  readProfileForm();

  const json = JSON.stringify(adminState, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "portfolioData.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showStatus("JSON exported.");
}

function importJson(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const parsedData = JSON.parse(reader.result);
      adminState = normalizeData(parsedData);
      populateProfileForm();
      renderAllLists();
      saveToStorage("JSON imported and saved to localStorage.");
    } catch (error) {
      showStatus("Failed to import JSON. Please check the file format.", true);
    }
  });

  reader.readAsText(file);
}

const EXPORT_FILE_BASE = "Muhammad_Arif_Alawi_Portfolio";
const EXPORT_ACCENT = "#ff7a00";
const EXPORT_DARK = "#171717";
const EXPORT_PANEL = "#252525";
const EXPORT_TEXT = "#f2f2f2";
const EXPORT_MUTED = "#b8b8b8";
const EXPORT_PORTFOLIO_URL = "https://muhammad-arif-portfolio.pages.dev";

function getExportData() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      return normalizeData(JSON.parse(storedData));
    }
  } catch (error) {
    return normalizeData(getDefaultData());
  }

  return normalizeData(getDefaultData());
}

function getExportPortfolioUrl() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return `${window.location.origin}/index.html`;
  }

  return EXPORT_PORTFOLIO_URL;
}

function setExportStatus(message, isError = false) {
  if (!elements.exportStatus) {
    return;
  }

  elements.exportStatus.textContent = message;
  elements.exportStatus.classList.toggle("is-error", isError);
}

function setExportLoading(activeButton, isLoading, label) {
  [elements.exportPdf, elements.exportPpt].forEach((button) => {
    if (!button) {
      return;
    }

    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading && button === activeButton);
  });

  if (activeButton && label) {
    activeButton.dataset.defaultText = activeButton.dataset.defaultText || activeButton.textContent;
    activeButton.textContent = isLoading ? label : activeButton.dataset.defaultText;
  }
}

function getAboutText(profile) {
  const about = profile && profile.about;

  if (Array.isArray(about)) {
    return about.filter(Boolean).join("\n\n");
  }

  return about || "";
}

function getProjectRole(project) {
  return project.role || project.position || project.category || "Portfolio Project";
}

function getProjectLinks(project) {
  return [
    { label: "Demo", url: project.demoLink },
    { label: "Visit", url: project.visitLink },
    { label: "GitHub", url: project.githubLink }
  ].filter((link) => link.url);
}

function getFirstProjectImage(project) {
  const images = getProjectImages(project);
  return images[0] || project.image || "";
}

function findProject(projects, patterns) {
  return projects.find((project) => {
    const searchable = `${project.title || ""} ${project.category || ""} ${project.description || ""}`.toLowerCase();
    return patterns.some((pattern) => searchable.includes(pattern));
  });
}

function createExportPlaceholder(label = "Image not found") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 1200;
  canvas.height = 675;
  context.fillStyle = "#303030";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = EXPORT_ACCENT;
  context.lineWidth = 8;
  context.setLineDash([24, 18]);
  context.strokeRect(110, 92, 980, 490);
  context.setLineDash([]);
  context.fillStyle = EXPORT_ACCENT;
  context.font = "700 54px Arial";
  context.textAlign = "center";
  context.fillText(label, canvas.width / 2, 360);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    format: "PNG",
    width: canvas.width,
    height: canvas.height
  };
}

function loadExportImage(src, label = "Image not found") {
  return new Promise((resolve) => {
    if (!src) {
      resolve(createExportPlaceholder(label));
      return;
    }

    const image = new Image();
    const timeout = window.setTimeout(() => {
      resolve(createExportPlaceholder(label));
    }, 7000);

    image.crossOrigin = "anonymous";
    image.onload = () => {
      window.clearTimeout(timeout);

      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const maxWidth = 1400;
        const scale = Math.min(1, maxWidth / image.naturalWidth);

        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        context.fillStyle = EXPORT_PANEL;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.86),
          format: "JPEG",
          width: canvas.width,
          height: canvas.height
        });
      } catch (error) {
        resolve(createExportPlaceholder(label));
      }
    };

    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(createExportPlaceholder(label));
    };

    image.src = normalizeAssetPath(src);
  });
}

function addPdfText(pdf, text, x, y, maxWidth, options = {}) {
  const size = options.size || 10;
  const lineHeight = options.lineHeight || size * 0.43;
  const color = options.color || EXPORT_TEXT;
  const style = options.style || "normal";
  const lines = pdf.splitTextToSize(String(text || ""), maxWidth);

  pdf.setFont("helvetica", style);
  pdf.setFontSize(size);
  pdf.setTextColor(color);
  pdf.text(lines, x, y);

  return y + (lines.length * lineHeight);
}

function addPdfImageBox(pdf, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > boxRatio) {
    drawHeight = width / imageRatio;
  } else {
    drawWidth = height * imageRatio;
  }

  const drawX = x + ((width - drawWidth) / 2);
  const drawY = y + ((height - drawHeight) / 2);

  pdf.setFillColor(EXPORT_PANEL);
  pdf.roundedRect(x, y, width, height, 2, 2, "F");
  pdf.addImage(image.dataUrl, image.format, drawX, drawY, drawWidth, drawHeight);
}

function addPdfShell(pdf, title, pageNumber) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const portfolioUrl = getExportPortfolioUrl();

  pdf.setFillColor(EXPORT_DARK);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.setDrawColor(EXPORT_ACCENT);
  pdf.setLineWidth(0.7);
  pdf.line(14, 18, pageWidth - 14, 18);
  pdf.setTextColor(EXPORT_MUTED);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(title, 14, 12);
  pdf.text(`Muhammad Arif Alawi | ${portfolioUrl}`, 14, pageHeight - 9);
  pdf.text(String(pageNumber), pageWidth - 18, pageHeight - 9);
}

function addPdfSectionTitle(pdf, title, y) {
  pdf.setTextColor(EXPORT_ACCENT);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text(title, 14, y);
  return y + 8;
}

function addPdfTags(pdf, tags, x, y, maxWidth) {
  let cursorX = x;
  let cursorY = y;

  tags.slice(0, 10).forEach((tag) => {
    const label = String(tag || "").trim();

    if (!label) {
      return;
    }

    const width = Math.min(maxWidth, pdf.getTextWidth(label) + 8);

    if (cursorX + width > x + maxWidth) {
      cursorX = x;
      cursorY += 8;
    }

    pdf.setFillColor("#3b2d20");
    pdf.roundedRect(cursorX, cursorY - 4.6, width, 6.4, 2.6, 2.6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.2);
    pdf.setTextColor(EXPORT_ACCENT);
    pdf.text(label, cursorX + 4, cursorY);
    cursorX += width + 4;
  });

  return cursorY + 5;
}

async function exportPortfolioPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("jsPDF library is not loaded.");
  }

  const { jsPDF } = window.jspdf;
  const data = getExportData();
  const profile = data.profile || {};
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const featuredProjects = projects.filter((project) => project.featured);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let pageNumber = 1;
  let y = 26;

  const profilePhoto = profile.photo || {};
  const coverPhoto = await loadExportImage(
    typeof profilePhoto === "string" ? profilePhoto : (profilePhoto.about || profilePhoto.hero),
    "Profile photo"
  );

  addPdfShell(pdf, "Portfolio", pageNumber);
  pdf.setFillColor(EXPORT_ACCENT);
  pdf.rect(0, 0, 7, pageHeight, "F");
  addPdfImageBox(pdf, coverPhoto, 146, 28, 42, 42);
  pdf.setTextColor(EXPORT_ACCENT);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(profile.title || "Hi I am", 20, 52);
  pdf.setTextColor(EXPORT_TEXT);
  pdf.setFontSize(29);
  pdf.text(profile.name || "Muhammad Arif Alawi", 20, 66, { maxWidth: 116 });
  pdf.setTextColor(EXPORT_ACCENT);
  pdf.setFontSize(17);
  pdf.text(profile.subtitle || "Director / Project Manager", 20, 82, { maxWidth: 150 });
  y = addPdfText(pdf, getAboutText(profile), 20, 108, 168, { size: 10.5, color: "#d8d8d8", lineHeight: 5.2 });
  addPdfTags(pdf, (data.tools || []).map((tool) => tool.name), 20, y + 8, 168);

  pdf.addPage();
  pageNumber += 1;
  addPdfShell(pdf, "Portfolio Overview", pageNumber);
  y = addPdfSectionTitle(pdf, "About Me", 32);
  y = addPdfText(pdf, getAboutText(profile), margin, y, 182, { size: 9.5, color: "#d8d8d8", lineHeight: 4.8 }) + 8;

  y = addPdfSectionTitle(pdf, "Tools & Skills", y);
  y = addPdfTags(pdf, (data.tools || []).map((tool) => tool.name), margin, y, 182) + 8;

  if (featuredProjects.length) {
    y = addPdfSectionTitle(pdf, "Featured Projects", y);
    featuredProjects.slice(0, 3).forEach((project) => {
      y = addPdfText(pdf, `${project.title || "Featured Project"} - ${getProjectRole(project)}`, margin, y, 182, {
        size: 9.8,
        style: "bold",
        color: EXPORT_TEXT,
        lineHeight: 4.7
      }) + 2;
    });
  }

  pdf.addPage();
  pageNumber += 1;
  addPdfShell(pdf, "Portfolio Projects", pageNumber);
  y = addPdfSectionTitle(pdf, "All Portfolio Projects", 32);

  for (const project of projects) {
    if (y > pageHeight - 78) {
      pdf.addPage();
      pageNumber += 1;
      addPdfShell(pdf, "Portfolio Projects", pageNumber);
      y = 32;
    }

    const projectImage = await loadExportImage(getFirstProjectImage(project), project.title || "Project image");
    const cardY = y;

    pdf.setFillColor(EXPORT_PANEL);
    pdf.roundedRect(margin, cardY - 6, pageWidth - (margin * 2), 58, 3, 3, "F");
    addPdfImageBox(pdf, projectImage, margin + 4, cardY - 2, 46, 31);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(EXPORT_TEXT);
    pdf.text(project.title || "Untitled Project", margin + 55, cardY + 2, { maxWidth: 124 });

    pdf.setFontSize(8.2);
    pdf.setTextColor(EXPORT_ACCENT);
    pdf.text(`Role: ${getProjectRole(project)}`, margin + 55, cardY + 9, { maxWidth: 124 });

    const descriptionLines = pdf.splitTextToSize(project.description || "", 124).slice(0, 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.8);
    pdf.setTextColor(EXPORT_MUTED);
    pdf.text(descriptionLines, margin + 55, cardY + 16);

    const tagY = addPdfTags(pdf, Array.isArray(project.techStack) ? project.techStack : splitList(project.techStack || ""), margin + 55, cardY + 36, 124);
    const links = getProjectLinks(project);

    if (links.length) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.4);
      pdf.setTextColor(EXPORT_TEXT);
      pdf.text(links.map((link) => `${link.label}: ${link.url}`).join("  |  "), margin + 55, Math.min(tagY + 1, cardY + 49), { maxWidth: 124 });
    }

    y += 66;
  }

  if (y > pageHeight - 55) {
    pdf.addPage();
    pageNumber += 1;
    addPdfShell(pdf, "Contact", pageNumber);
    y = 32;
  }

  y = addPdfSectionTitle(pdf, "Contact & Social Media", y + 3);
  y = addPdfText(pdf, `Portfolio: ${getExportPortfolioUrl()}`, margin, y, 182, { size: 9, color: EXPORT_TEXT, lineHeight: 4.5 });
  (data.socials || []).forEach((social) => {
    y = addPdfText(pdf, `${social.name}: ${social.url}`, margin, y + 2, 182, { size: 8.6, color: EXPORT_MUTED, lineHeight: 4.5 });
  });

  pdf.save(`${EXPORT_FILE_BASE}.pdf`);
}

function addPptBackground(pptxDeck, slide, title) {
  slide.background = { color: "171717" };
  slide.addShape(pptxDeck.ShapeType.rect, { x: 0, y: 0, w: 0.1, h: 7.5, fill: { color: "FF7A00" }, line: { color: "FF7A00" } });
  slide.addText("MAA Portfolio", { x: 0.45, y: 0.22, w: 3, h: 0.2, fontSize: 7.5, bold: true, color: "B8B8B8" });

  if (title) {
    slide.addText(title, { x: 0.55, y: 0.55, w: 7.2, h: 0.38, fontSize: 20, bold: true, color: "FF7A00" });
  }
}

function addPptFooter(slide) {
  slide.addText(`Muhammad Arif Alawi | ${getExportPortfolioUrl()}`, {
    x: 0.55,
    y: 7.14,
    w: 8.2,
    h: 0.22,
    fontSize: 7,
    color: "B8B8B8"
  });
}

function pptTagText(items) {
  return items.filter(Boolean).slice(0, 18).join("   /   ");
}

function projectSummary(project) {
  return [
    `Role: ${getProjectRole(project)}`,
    project.description || "",
    `Tech: ${(Array.isArray(project.techStack) ? project.techStack : splitList(project.techStack || "")).join(", ")}`
  ].filter(Boolean).join("\n\n");
}

async function addProjectPptSlide(pptxDeck, title, project, fallbackTitle) {
  const slide = pptxDeck.addSlide();
  const safeProject = project || {};
  const image = await loadExportImage(getFirstProjectImage(safeProject), safeProject.title || fallbackTitle);

  addPptBackground(pptxDeck, slide, title);
  slide.addText(safeProject.title || fallbackTitle, { x: 0.55, y: 1.05, w: 6.2, h: 0.45, fontSize: 22, bold: true, color: "F2F2F2", fit: "shrink" });
  slide.addText(safeProject.category || "Portfolio Project", { x: 0.55, y: 1.55, w: 6.2, h: 0.3, fontSize: 11, bold: true, color: "FF7A00" });
  slide.addText(projectSummary(safeProject), { x: 0.55, y: 2.05, w: 6.15, h: 3.65, fontSize: 10, color: "D8D8D8", breakLine: false, fit: "shrink" });

  const links = getProjectLinks(safeProject).map((link) => `${link.label}: ${link.url}`).join("\n");
  if (links) {
    slide.addText(links, { x: 0.55, y: 5.95, w: 6.15, h: 0.62, fontSize: 8, bold: true, color: "F2F2F2", fit: "shrink" });
  }

  slide.addShape(pptxDeck.ShapeType.roundRect, { x: 7.05, y: 1.18, w: 5.65, h: 3.78, rectRadius: 0.12, fill: { color: "252525" }, line: { color: "333333" } });
  slide.addImage({ data: image.dataUrl, x: 7.18, y: 1.31, w: 5.39, h: 3.52 });
  addPptFooter(slide);
}

async function exportPortfolioPpt() {
  const PptxConstructor = window.PptxGenJS || window.pptxgen;

  if (!PptxConstructor) {
    throw new Error("PptxGenJS library is not loaded.");
  }

  const data = getExportData();
  const profile = data.profile || {};
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const sateProject = findProject(projects, ["sate", "vr", "unity"]) || projects.find((project) => project.featured) || projects[0];
  const researchProject = findProject(projects, ["ieee", "research", "machine learning"]);
  const webProject = findProject(projects, ["portfolio website", "web development"]);
  const creativeProjects = projects.filter((project) => {
    const text = `${project.title || ""} ${project.category || ""}`.toLowerCase();
    return ["film", "video", "wedding", "lidm", "polri", "metafora", "secret"].some((word) => text.includes(word));
  }).slice(0, 4);
  const profilePhoto = profile.photo || {};
  const coverPhoto = await loadExportImage(
    typeof profilePhoto === "string" ? profilePhoto : (profilePhoto.hero || profilePhoto.about),
    "Profile photo"
  );
  const pptxDeck = new PptxConstructor();

  pptxDeck.layout = "LAYOUT_WIDE";
  pptxDeck.author = profile.name || "Muhammad Arif Alawi";
  pptxDeck.subject = "Portfolio for internship applications";
  pptxDeck.title = `${profile.name || "Muhammad Arif Alawi"} Portfolio`;
  pptxDeck.company = "MAA Portfolio";
  pptxDeck.lang = "en-US";
  pptxDeck.theme = {
    headFontFace: "Arial",
    bodyFontFace: "Arial",
    lang: "en-US"
  };

  let slide = pptxDeck.addSlide();
  addPptBackground(pptxDeck, slide, "");
  slide.addText(profile.title || "Hi I am", { x: 0.65, y: 1.65, w: 5.5, h: 0.28, fontSize: 12, bold: true, color: "FF7A00" });
  slide.addText(profile.name || "Muhammad Arif Alawi", { x: 0.65, y: 2.0, w: 6.5, h: 0.75, fontSize: 30, bold: true, color: "F2F2F2", fit: "shrink" });
  slide.addText(profile.subtitle || "Director / Project Manager", { x: 0.65, y: 2.88, w: 6, h: 0.35, fontSize: 16, bold: true, color: "FF7A00" });
  slide.addText("Portfolio for internship applications", { x: 0.65, y: 3.45, w: 5.5, h: 0.32, fontSize: 11, color: "D8D8D8" });
  slide.addShape(pptxDeck.ShapeType.roundRect, { x: 8.25, y: 1.15, w: 3.35, h: 4.75, rectRadius: 0.15, fill: { color: "252525" }, line: { color: "333333" } });
  slide.addImage({ data: coverPhoto.dataUrl, x: 8.42, y: 1.35, w: 3.0, h: 4.35 });
  addPptFooter(slide);

  slide = pptxDeck.addSlide();
  addPptBackground(pptxDeck, slide, "About Me");
  slide.addText(getAboutText(profile), { x: 0.65, y: 1.25, w: 11.7, h: 4.95, fontSize: 13, color: "D8D8D8", fit: "shrink", breakLine: false });
  addPptFooter(slide);

  slide = pptxDeck.addSlide();
  addPptBackground(pptxDeck, slide, "Skills & Tools");
  slide.addText(pptTagText(tools.map((tool) => tool.name)), { x: 0.65, y: 1.25, w: 11.8, h: 2.1, fontSize: 16, bold: true, color: "F2F2F2", fit: "shrink" });
  slide.addText(tools.map((tool) => `${tool.name} - ${tool.category}`).join("\n"), { x: 0.75, y: 3.65, w: 11.4, h: 2.75, fontSize: 10, color: "D8D8D8", fit: "shrink" });
  addPptFooter(slide);

  await addProjectPptSlide(pptxDeck, "Featured Project - Sate In Bandung VR", sateProject, "Sate In Bandung VR");
  await addProjectPptSlide(pptxDeck, "Research Publication - IEEE / Machine Learning", researchProject, "IEEE Machine Learning Research");

  slide = pptxDeck.addSlide();
  addPptBackground(pptxDeck, slide, "Creative & Film Projects");
  for (const [index, project] of creativeProjects.entries()) {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = 0.65 + (col * 6.25);
    const y = 1.18 + (row * 2.55);
    const image = await loadExportImage(getFirstProjectImage(project), project.title);

    slide.addShape(pptxDeck.ShapeType.roundRect, { x, y, w: 5.75, h: 2.14, rectRadius: 0.12, fill: { color: "252525" }, line: { color: "333333" } });
    slide.addImage({ data: image.dataUrl, x: x + 0.12, y: y + 0.15, w: 1.9, h: 1.3 });
    slide.addText(project.title || "Creative Project", { x: x + 2.18, y: y + 0.18, w: 3.25, h: 0.38, fontSize: 11, bold: true, color: "F2F2F2", fit: "shrink" });
    slide.addText(project.category || "Creative Project", { x: x + 2.18, y: y + 0.62, w: 3.25, h: 0.22, fontSize: 7.5, bold: true, color: "FF7A00", fit: "shrink" });
    slide.addText(project.description || "", { x: x + 2.18, y: y + 0.92, w: 3.3, h: 0.95, fontSize: 7.3, color: "D8D8D8", fit: "shrink" });
  }
  addPptFooter(slide);

  await addProjectPptSlide(pptxDeck, "Web Development / Portfolio Website", webProject, "Portfolio Website");

  slide = pptxDeck.addSlide();
  addPptBackground(pptxDeck, slide, "Contact");
  slide.addText(profile.name || "Muhammad Arif Alawi", { x: 0.65, y: 1.35, w: 7.8, h: 0.52, fontSize: 24, bold: true, color: "F2F2F2" });
  slide.addText(profile.subtitle || "Director / Project Manager", { x: 0.65, y: 2.0, w: 7.8, h: 0.32, fontSize: 13, bold: true, color: "FF7A00" });
  slide.addText(
    [`Portfolio: ${getExportPortfolioUrl()}`, ...(data.socials || []).map((social) => `${social.name}: ${social.url}`)].join("\n\n"),
    { x: 0.65, y: 2.75, w: 10.6, h: 3.2, fontSize: 12, color: "D8D8D8", fit: "shrink" }
  );
  addPptFooter(slide);

  await pptxDeck.writeFile({ fileName: `${EXPORT_FILE_BASE}.pptx` });
}

async function handleExport(type) {
  const isPdf = type === "pdf";
  const button = isPdf ? elements.exportPdf : elements.exportPpt;
  const loadingLabel = isPdf ? "Creating PDF..." : "Creating PPT...";

  setExportLoading(button, true, loadingLabel);
  setExportStatus(loadingLabel);

  try {
    if (isPdf) {
      await exportPortfolioPdf();
      setExportStatus("PDF exported successfully.");
    } else {
      await exportPortfolioPpt();
      setExportStatus("PPT exported successfully.");
    }
  } catch (error) {
    setExportStatus(`Failed to export ${isPdf ? "PDF" : "PPT"}. Please try again.`, true);
  } finally {
    setExportLoading(button, false);
  }
}

elements.saveChanges.addEventListener("click", () => {
  saveToStorage();
});

elements.resetDefault.addEventListener("click", () => {
  if (!confirm("Reset all admin data to the default data from data.js?")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  adminState = normalizeData(getDefaultData());
  populateProfileForm();
  renderAllLists();
  resetProjectForm();
  resetToolForm();
  resetSocialForm();
  showStatus("Default data restored. index.html will use data.js until you save changes again.");
});

elements.exportJson.addEventListener("click", exportJson);

elements.exportPdf.addEventListener("click", () => {
  handleExport("pdf");
});

elements.exportPpt.addEventListener("click", () => {
  handleExport("ppt");
});

elements.importJson.addEventListener("click", () => {
  elements.importFile.click();
});

elements.importFile.addEventListener("change", () => {
  importJson(elements.importFile.files[0]);
  elements.importFile.value = "";
});

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (getValue("loginPassword") === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    elements.loginMessage.textContent = "";
    elements.loginForm.reset();
    showAdminDashboard();
    showStatus("Login successful. Admin panel ready.");
    return;
  }

  elements.loginMessage.textContent = "Wrong password.";
  elements.loginPassword.focus();
});

elements.logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showLoginPanel();
  showStatus("");
});

elements.previewHeroImage.addEventListener("click", () => {
  previewSpecificImage(getValue("profileHeroPhoto"), elements.profilePreviewPhoto, elements.profileImageWarning, getValue("profileName"));
});

elements.previewAboutImage.addEventListener("click", () => {
  previewSpecificImage(getValue("profileAboutPhoto"), elements.profilePreviewPhoto, elements.profileImageWarning, getValue("profileName"));
});

elements.previewProjectImage.addEventListener("click", () => {
  const images = splitImagePaths(getValue("projectImages"));
  const activeImage = images[projectPreviewIndex] || images[0] || "";

  updateProjectPreview();
  previewSpecificImage(activeImage, elements.projectPreviewImage, elements.projectImageWarning, getValue("projectTitle"));
});

elements.projectPreviewPrev.addEventListener("click", () => {
  const images = getProjectImages(readProjectForm());

  if (images.length <= 1) {
    return;
  }

  projectPreviewIndex = (projectPreviewIndex - 1 + images.length) % images.length;
  updateProjectPreview();
});

elements.projectPreviewNext.addEventListener("click", () => {
  const images = getProjectImages(readProjectForm());

  if (images.length <= 1) {
    return;
  }

  projectPreviewIndex = (projectPreviewIndex + 1) % images.length;
  updateProjectPreview();
});

elements.previewToolImage.addEventListener("click", () => {
  previewSpecificImage(getValue("toolIcon"), elements.toolPreviewIcon, elements.toolImageWarning, getValue("toolName"));
});

elements.previewSocialImage.addEventListener("click", () => {
  previewSpecificImage(getValue("socialIcon"), elements.socialPreviewIcon, elements.socialImageWarning, getValue("socialName"));
});

elements.projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const project = readProjectForm();
  const index = getValue("projectIndex");

  if (index) {
    adminState.projects[Number(index)] = project;
    showStatus("Project updated. Click Save Changes to publish it.");
  } else {
    adminState.projects.push(project);
    showStatus("Project added. Click Save Changes to publish it.");
  }

  renderProjectList();
  resetProjectForm();
});

elements.projectClear.addEventListener("click", resetProjectForm);

elements.toolForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const tool = readToolForm();
  const index = getValue("toolIndex");

  if (index) {
    adminState.tools[Number(index)] = tool;
    showStatus("Tool updated. Click Save Changes to publish it.");
  } else {
    adminState.tools.push(tool);
    showStatus("Tool added. Click Save Changes to publish it.");
  }

  renderToolList();
  resetToolForm();
});

elements.toolClear.addEventListener("click", resetToolForm);

elements.socialForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const social = readSocialForm();
  const index = getValue("socialIndex");

  if (index) {
    adminState.socials[Number(index)] = social;
    showStatus("Social link updated. Click Save Changes to publish it.");
  } else {
    adminState.socials.push(social);
    showStatus("Social link added. Click Save Changes to publish it.");
  }

  renderSocialList();
  resetSocialForm();
});

elements.socialClear.addEventListener("click", resetSocialForm);

populateProfileForm();
renderAllLists();
bindLivePreview(elements.profileForm, updateProfilePreview);
bindLivePreview(elements.projectForm, updateProjectPreview);
bindLivePreview(elements.toolForm, updateToolPreview);
bindLivePreview(elements.socialForm, updateSocialPreview);
updateAllPreviews();
applyAuthState();
showStatus(isLoggedIn() ? "Admin panel ready." : "");
