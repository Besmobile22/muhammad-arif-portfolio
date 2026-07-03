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
