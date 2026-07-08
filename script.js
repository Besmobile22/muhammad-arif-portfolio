const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link");
const contactForm = document.querySelector("#contactForm");
const formMessage = document.querySelector("#formMessage");
const sendButton = contactForm ? contactForm.querySelector(".btn-send") : null;

const EMAILJS_SERVICE_ID = "Email.Lamaran22";
const EMAILJS_TEMPLATE_ID = "template_xq4897i";
const EMAILJS_PUBLIC_KEY = "D7-cVupqyOWjNBSkZ";
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#303030"/>
  <rect x="90" y="80" width="460" height="260" rx="18" fill="#252525" stroke="#ff7a00" stroke-width="4" stroke-dasharray="12 12"/>
  <circle cx="230" cy="170" r="38" fill="#4a4a4a"/>
  <path d="M140 305l115-105 82 72 56-48 107 81H140z" fill="#4a4a4a"/>
  <text x="320" y="365" text-anchor="middle" fill="#ff7a00" font-family="Arial, sans-serif" font-size="28" font-weight="700">Image not found</text>
</svg>
`)}`;

function getDefaultPortfolioData() {
  if (typeof portfolioData !== "undefined") {
    return portfolioData;
  }

  return {
    profile: {},
    socials: [],
    tools: [],
    projects: []
  };
}

function getActivePortfolioData() {
  const defaultData = getDefaultPortfolioData();

  try {
    const storedData = localStorage.getItem("portfolioData");

    if (!storedData) {
      return {
        ...defaultData,
        projects: Array.isArray(defaultData.projects) ? defaultData.projects.map(normalizeProject) : []
      };
    }

    const parsedData = JSON.parse(storedData);

    if (!parsedData || typeof parsedData !== "object") {
      return {
        ...defaultData,
        projects: Array.isArray(defaultData.projects) ? defaultData.projects.map(normalizeProject) : []
      };
    }

    const activeData = {
      ...defaultData,
      ...parsedData,
      profile: {
        ...(defaultData.profile || {}),
        ...(parsedData.profile || {})
      },
      socials: Array.isArray(parsedData.socials) ? parsedData.socials : defaultData.socials,
      tools: Array.isArray(parsedData.tools) ? parsedData.tools : defaultData.tools,
      projects: (Array.isArray(parsedData.projects) ? parsedData.projects : defaultData.projects).map(normalizeProject)
    };
    const shouldMigrateProjects = Array.isArray(parsedData.projects)
      && parsedData.projects.some((project) => project && project.image && !project.images);

    if (shouldMigrateProjects) {
      localStorage.setItem("portfolioData", JSON.stringify({
        ...parsedData,
        projects: activeData.projects
      }));
    }

    return activeData;
  } catch (error) {
    return {
      ...defaultData,
      projects: Array.isArray(defaultData.projects) ? defaultData.projects.map(normalizeProject) : []
    };
  }
}

function splitImagePaths(value) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function normalizeAssetPath(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().replace(/\\/g, "/");
  const assetIndex = normalized.toLowerCase().indexOf("assets/");

  return assetIndex >= 0 ? normalized.slice(assetIndex) : normalized;
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

function setCarouselImage(image, src, alt) {
  image.onerror = () => {
    image.onerror = null;
    image.src = PLACEHOLDER_IMAGE;
  };
  image.src = src || PLACEHOLDER_IMAGE;
  image.alt = alt || "";
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value || "";
  });
}

function setImage(selector, src, alt) {
  document.querySelectorAll(selector).forEach((image) => {
    if (src) {
      image.src = src;
    }

    image.alt = alt || "";
  });
}

function renderSocialLinks(socials) {
  document.querySelectorAll("[data-socials]").forEach((container) => {
    container.innerHTML = "";

    socials.forEach((social) => {
      const link = document.createElement("a");
      const icon = document.createElement("img");

      link.href = social.url || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", social.name || "Social media");

      icon.src = normalizeAssetPath(social.icon) || "";
      icon.alt = "";

      link.appendChild(icon);
      container.appendChild(link);
    });
  });
}

function createToolCard(tool) {
  const card = document.createElement("div");
  const icon = document.createElement("img");
  const label = document.createElement("span");

  card.className = "tool-card";
  card.dataset.category = tool.category || "";

  icon.src = normalizeAssetPath(tool.icon) || "";
  icon.alt = tool.name || "";

  label.textContent = tool.name || "";

  card.appendChild(icon);
  card.appendChild(label);

  return card;
}

function renderTools(tools) {
  document.querySelectorAll("[data-tools]").forEach((container) => {
    const track = document.createElement("div");
    const primaryGroup = document.createElement("div");
    const duplicateGroup = document.createElement("div");

    container.innerHTML = "";
    container.classList.add("tools-marquee");
    track.className = "tools-track";
    primaryGroup.className = "tools-group";
    duplicateGroup.className = "tools-group";
    duplicateGroup.setAttribute("aria-hidden", "true");

    tools.forEach((tool) => {
      primaryGroup.appendChild(createToolCard(tool));
      duplicateGroup.appendChild(createToolCard(tool));
    });

    track.appendChild(primaryGroup);
    track.appendChild(duplicateGroup);
    container.appendChild(track);
  });
}

function renderProjects(projects) {
  document.querySelectorAll("[data-projects]").forEach((container) => {
    container.innerHTML = "";

    projects.forEach((project, index) => {
      const card = document.createElement("article");
      const carousel = document.createElement("div");
      const image = document.createElement("img");
      const prevButton = document.createElement("button");
      const nextButton = document.createElement("button");
      const indicator = document.createElement("span");
      const body = document.createElement("div");
      const meta = document.createElement("div");
      const title = document.createElement("h3");
      const category = document.createElement("span");
      const description = document.createElement("p");
      const techStack = document.createElement("div");
      const links = document.createElement("nav");
      const projectTechStack = Array.isArray(project.techStack)
        ? project.techStack
        : String(project.techStack || "").split(",").map((tech) => tech.trim()).filter(Boolean);
      const projectImages = getProjectImages(project);
      const carouselImages = projectImages.length ? projectImages : [PLACEHOLDER_IMAGE];
      let activeImageIndex = 0;

      card.className = "portfolio-card";
      card.dataset.featured = String(Boolean(project.featured));
      carousel.className = "portfolio-carousel";
      prevButton.className = "carousel-arrow carousel-prev";
      nextButton.className = "carousel-arrow carousel-next";
      indicator.className = "carousel-indicator";
      body.className = "portfolio-card-body";
      meta.className = "portfolio-card-meta";
      description.className = "portfolio-description";
      techStack.className = "portfolio-tech-stack";
      links.className = "portfolio-links";
      links.setAttribute("aria-label", `${project.title || `Project ${index + 1}`} links`);

      prevButton.type = "button";
      nextButton.type = "button";
      prevButton.textContent = "<";
      nextButton.textContent = ">";
      prevButton.setAttribute("aria-label", "Previous project image");
      nextButton.setAttribute("aria-label", "Next project image");
      image.title = project.description || "";

      function updateCarousel() {
        setCarouselImage(image, carouselImages[activeImageIndex], project.title || `Portfolio project ${index + 1}`);
        indicator.textContent = `${activeImageIndex + 1} / ${carouselImages.length}`;
      }

      prevButton.addEventListener("click", () => {
        activeImageIndex = (activeImageIndex - 1 + carouselImages.length) % carouselImages.length;
        updateCarousel();
      });

      nextButton.addEventListener("click", () => {
        activeImageIndex = (activeImageIndex + 1) % carouselImages.length;
        updateCarousel();
      });

      if (carouselImages.length <= 1) {
        prevButton.hidden = true;
        nextButton.hidden = true;
      }

      updateCarousel();
      title.textContent = project.title || "Name Project";
      category.textContent = project.category || "Categories";
      description.textContent = project.description || "";

      meta.appendChild(title);
      meta.appendChild(category);
      carousel.appendChild(image);
      carousel.appendChild(prevButton);
      carousel.appendChild(nextButton);
      carousel.appendChild(indicator);
      card.appendChild(carousel);
      body.appendChild(meta);

      if (project.description) {
        body.appendChild(description);
      }

      projectTechStack.forEach((tech) => {
        const pill = document.createElement("span");
        pill.textContent = tech;
        techStack.appendChild(pill);
      });

      if (techStack.children.length) {
        body.appendChild(techStack);
      }

      [
        { label: "Visit", url: project.demoLink || project.visitLink },
        { label: "Code", url: project.githubLink }
      ].forEach((linkData) => {
        if (!linkData.url) {
          return;
        }

        const link = document.createElement("a");
        link.href = linkData.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = linkData.label;
        links.appendChild(link);
      });

      if (links.children.length) {
        body.appendChild(links);
      }

      card.appendChild(body);
      container.appendChild(card);
    });
  });
}

function renderAbout(profile) {
  document.querySelectorAll("[data-about-text]").forEach((container) => {
    const aboutItems = Array.isArray(profile.about) ? profile.about : [profile.about || ""];
    container.innerHTML = "";

    aboutItems.filter(Boolean).forEach((paragraphText) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = paragraphText;
      container.appendChild(paragraph);
    });
  });
}

function renderProfile(data) {
  const profile = data.profile || {};
  const photo = profile.photo || {};
  const heroPhoto = normalizeAssetPath(typeof photo === "string" ? photo : photo.hero);
  const aboutPhoto = normalizeAssetPath(typeof photo === "string" ? photo : photo.about);

  setText("[data-profile-title]", profile.title);
  setText("[data-profile-name]", profile.name);
  setText("[data-profile-subtitle]", profile.subtitle);
  setImage("[data-hero-photo]", heroPhoto, `${profile.name || "Profile"} hero photo`);
  setImage("[data-about-photo]", aboutPhoto, `${profile.name || "Profile"} formal portrait`);

  document.querySelectorAll("[data-cv-link]").forEach((link) => {
    link.href = normalizeAssetPath(profile.cvLink) || "#";
    link.setAttribute("download", "");
  });

  renderAbout(profile);
}

function renderPortfolioData(data) {
  renderProfile(data);
  renderSocialLinks(Array.isArray(data.socials) ? data.socials : []);
  renderTools(Array.isArray(data.tools) ? data.tools : []);
  renderProjects(Array.isArray(data.projects) ? data.projects : []);
}

function attachPortfolioImageFallbacks() {
  document.querySelectorAll(".portfolio-card img").forEach((image) => {
    image.addEventListener("error", () => {
      const fallback = image.dataset.fallback;

      if (fallback && image.src.indexOf(fallback) === -1) {
        image.src = fallback;
      }
    }, { once: true });
  });
}

function attachToolImageFallbacks() {
  document.querySelectorAll(".tool-card img").forEach((image) => {
    image.addEventListener("error", () => {
      const card = image.closest(".tool-card");
      const initial = image.alt ? image.alt.charAt(0).toUpperCase() : "?";

      if (card) {
        card.dataset.initial = initial;
        card.classList.add("icon-missing");
      }

      image.hidden = true;
    }, { once: true });
  });
}

function initCursorGlow() {
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!hasFinePointer || prefersReducedMotion) {
    return;
  }

  let isTicking = false;
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;

  window.addEventListener("pointermove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;

    if (isTicking) {
      return;
    }

    isTicking = true;
    window.requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--cursor-x", `${cursorX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${cursorY}px`);
      document.body.classList.add("cursor-ready");
      isTicking = false;
    });
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("cursor-ready");
  });
}

function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = document.querySelectorAll(".hero, .services, .about, .tools, .portfolio, .contact");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -10% 0px"
  });

  revealTargets.forEach((target) => {
    target.classList.add("reveal");
    observer.observe(target);
  });
}

renderPortfolioData(getActivePortfolioData());
attachPortfolioImageFallbacks();
attachToolImageFallbacks();
initCursorGlow();
initScrollReveal();

window.addEventListener("storage", (event) => {
  if (event.key === "portfolioData") {
    renderPortfolioData(getActivePortfolioData());
    attachPortfolioImageFallbacks();
    attachToolImageFallbacks();
  }
});

if (window.emailjs) {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
  });
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}

const requiredFields = ["name", "email", "phone", "service", "timeline", "details"];

function getFieldValue(form, fieldName) {
  return form.elements[fieldName].value.trim();
}

function showMessage(message) {
  if (formMessage) {
    formMessage.textContent = message;
  }
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const missingField = requiredFields.find((fieldName) => {
      return !getFieldValue(contactForm, fieldName);
    });

    if (missingField) {
      showMessage("Please complete all required fields before sending.");
      contactForm.elements[missingField].focus();
      return;
    }

    const email = getFieldValue(contactForm, "email");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showMessage("Please enter a valid email address.");
      contactForm.elements.email.focus();
      return;
    }

    const formData = {
      name: getFieldValue(contactForm, "name"),
      email,
      phone: getFieldValue(contactForm, "phone"),
      service: getFieldValue(contactForm, "service"),
      timeline: getFieldValue(contactForm, "timeline"),
      details: getFieldValue(contactForm, "details")
    };

    const templateParams = {
      to_email: "alwiarif23@gmail.com",
      from_name: formData.name,
      from_email: formData.email,
      phone_number: formData.phone,
      service_of_interest: formData.service,
      timeline: formData.timeline,
      project_details: formData.details,
      subject: `Portfolio inquiry from ${formData.name} - ${formData.service}`,
      message: [
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        `Phone Number: ${formData.phone}`,
        `Service of Interest: ${formData.service}`,
        `Timeline: ${formData.timeline}`,
        "",
        "Project Details:",
        formData.details
      ].join("\n")
    };

    if (!window.emailjs) {
      alert("Failed to send message. Please try again.");
      showMessage("EmailJS is not loaded. Please check your internet connection or CDN script.");
      return;
    }

    try {
      if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = "Sending...";
      }

      showMessage("Sending message...");
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      alert("Message sent successfully!");
      contactForm.reset();
      showMessage("");
    } catch (error) {
      alert("Failed to send message. Please try again.");
      showMessage("Failed to send message. Please try again.");
    } finally {
      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = "Send";
      }
    }
  });
}
