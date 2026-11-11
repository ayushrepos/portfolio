(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll("button[data-theme]"));
  var header = document.getElementById("site-header");
  var backToTop = document.getElementById("back-to-top");
  var progressCircle = document.getElementById("progress-circle");
  var menu = document.getElementById("mobile-menu");
  var menuToggle = document.getElementById("menu-toggle");
  var desktopNavLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var mobileNavLinks = Array.prototype.slice.call(document.querySelectorAll("[data-mobile-nav]"));
  var navSectionIds = ["work", "about", "services", "stack", "faq", "contact"];
  var toast = document.getElementById("toast");
  var toastMessage = document.getElementById("toast-message");
  var toastDismiss = document.getElementById("toast-dismiss");
  var toastTimer = null;
  var progressLength = 2 * Math.PI * 26;
  var currentProjectTrigger = null;
  var scrollQueued = false;
  var footerVisible = false;
  var siteFooter = document.querySelector(".site-footer");

  /* Theme */
  var themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(theme) {
    var nextTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = nextTheme;

    themeButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.theme === nextTheme));
    });

    var themeMeta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", nextTheme === "dark" ? "#1e1512" : "#f4efe6");
  }

  applyTheme(root.dataset.theme || (themeMedia.matches ? "dark" : "light"));

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyTheme(button.dataset.theme);
    });
  });

  function applySystemTheme(event) {
    applyTheme(event.matches ? "dark" : "light");
  }

  if (typeof themeMedia.addEventListener === "function") {
    themeMedia.addEventListener("change", applySystemTheme);
  } else if (typeof themeMedia.addListener === "function") {
    themeMedia.addListener(applySystemTheme);
  }

  /* Header scroll state, active navigation, progress ring */
  function updateActiveNav() {
    var marker = window.scrollY + window.innerHeight * 0.35;
    var active = navSectionIds[0];
    var maxScroll = root.scrollHeight - window.innerHeight;

    navSectionIds.forEach(function (id) {
      var section = document.getElementById(id);
      if (!section) return;
      var sectionTop = section.getBoundingClientRect().top + window.scrollY;
      if (sectionTop <= marker) active = id;
    });

    if (maxScroll > 0 && window.scrollY >= maxScroll - 4) {
      active = navSectionIds[navSectionIds.length - 1];
    }

    desktopNavLinks.forEach(function (link) {
      if (link.dataset.nav === active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    mobileNavLinks.forEach(function (link) {
      if (link.dataset.mobileNav === active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function updateScrollUI() {
    var scrollY = window.scrollY || window.pageYOffset;
    var maxScroll = root.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

    if (header) header.classList.toggle("is-scrolled", scrollY > 8);

    if (backToTop) {
      backToTop.classList.toggle("is-visible", scrollY > 480 && !footerVisible);
    }

    if (progressCircle) {
      progressCircle.style.strokeDashoffset = String(progressLength * (1 - progress));
    }

    updateActiveNav();
  }

  function queueScrollUpdate() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () {
      scrollQueued = false;
      updateScrollUI();
    });
  }

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate);
  updateScrollUI();

  if (siteFooter && "IntersectionObserver" in window) {
    var footerObserver = new IntersectionObserver(
      function (entries) {
        footerVisible = entries[0].isIntersecting;
        updateScrollUI();
      },
      { threshold: 0 }
    );
    footerObserver.observe(siteFooter);
  }

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  /* Reveal on scroll */
  var revealElements = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -64px 0px", threshold: 0.01 }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  /* Mobile menu */
  function openMenu() {
    if (!menu || !menuToggle) return;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
    var firstLink = menu.querySelector(".mobile-nav a");
    if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 60);
  }

  function closeMenu(restoreFocus) {
    if (!menu || !menuToggle) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
    if (restoreFocus !== false) menuToggle.focus();
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (menu && menu.classList.contains("is-open")) closeMenu();
      else openMenu();
    });
  }

  if (menu) {
    var scrim = menu.querySelector(".mobile-scrim");
    if (scrim) scrim.addEventListener("click", function () { closeMenu(); });

    mobileNavLinks.forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(false); });
    });

    var sheetCta = menu.querySelector(".sheet-cta a");
    if (sheetCta) sheetCta.addEventListener("click", function () { closeMenu(false); });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu && menu.classList.contains("is-open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1080 && menu && menu.classList.contains("is-open")) {
      closeMenu(false);
    }
  });

  /* FAQ accordion */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));

  function setFaqState(item, open) {
    var trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;
    item.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
  }

  faqItems.forEach(function (item) {
    var trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      faqItems.forEach(function (other) { setFaqState(other, false); });
      if (!isOpen) setFaqState(item, true);
    });
  });

  /* Stack search */
  var stackSearch = document.getElementById("stack-search");
  var searchClear = document.getElementById("search-clear");
  var stackGrid = document.getElementById("stack-grid");
  var stackEmpty = document.getElementById("stack-empty");

  function filterStack() {
    if (!stackSearch || !stackGrid) return;
    var query = stackSearch.value.trim().toLowerCase();
    var groups = Array.prototype.slice.call(stackGrid.querySelectorAll(".stack-card"));
    var emptyCount = 0;

    groups.forEach(function (group) {
      var tags = Array.prototype.slice.call(group.querySelectorAll(".tag"));
      var visibleTags = 0;

      tags.forEach(function (tag) {
        var matches = !query || tag.textContent.toLowerCase().indexOf(query) !== -1;
        tag.hidden = !matches;
        if (matches) visibleTags += 1;
      });

      group.hidden = visibleTags === 0;
      if (visibleTags === 0) emptyCount += 1;
    });

    if (searchClear) searchClear.hidden = query === "";
    if (stackEmpty) {
      stackEmpty.hidden = !(query && emptyCount === groups.length);
      var emptyLabel = stackEmpty.querySelector("span");
      if (emptyLabel) emptyLabel.textContent = stackSearch.value.trim();
    }
  }

  if (stackSearch) {
    stackSearch.addEventListener("input", filterStack);
    stackSearch.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && stackSearch.value) {
        stackSearch.value = "";
        filterStack();
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", function () {
      if (!stackSearch) return;
      stackSearch.value = "";
      filterStack();
      stackSearch.focus();
    });
  }

  filterStack();

  /* Project dialog */
  var projects = {
    campusconnect: {
      title: "CampusConnect",
      description:
        "A college event and attendance portal built with a Spring Boot backend, a React JS frontend and a SQL database — event listings, registrations and attendance in one place.",
      tags: ["Spring Boot", "React JS", "SQL"],
      href: "https://github.com/ayushrepos"
    },
    invoicehive: {
      title: "InvoiceHive",
      description:
        "An invoicing dashboard for small businesses with REST APIs, role-based access and SQL storage. Built for quick billing and clean, predictable reports.",
      tags: ["Java", "REST APIs", "SQL"],
      href: "https://github.com/ayushrepos"
    },
    taskroost: {
      title: "TaskRoost",
      description:
        "A team task manager with a React JS front end and a Node.js API — shared boards, simple permissions and a lightweight SQL data layer.",
      tags: ["React JS", "Node.js", "SQL"],
      href: "https://github.com/ayushrepos"
    }
  };

  var projectDialog = document.getElementById("project-dialog");
  var projectTitle = document.getElementById("project-dialog-title");
  var projectDescription = document.getElementById("project-dialog-description");
  var projectTags = document.getElementById("project-dialog-tags");
  var projectLink = document.getElementById("project-dialog-link");
  var projectTriggers = Array.prototype.slice.call(document.querySelectorAll("[data-project]"));

  function openProject(project, trigger) {
    if (!projectDialog || !projectTitle || !projectDescription || !projectTags || !projectLink) return;

    currentProjectTrigger = trigger;
    projectTitle.textContent = project.title;
    projectDescription.textContent = project.description;
    projectTags.innerHTML = "";
    project.tags.forEach(function (tagName) {
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = tagName;
      projectTags.appendChild(tag);
    });
    projectLink.href = project.href;

    if (typeof projectDialog.showModal === "function") {
      projectDialog.showModal();
    } else {
      projectDialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-open");
  }

  function closeProjectDialog() {
    if (!projectDialog) return;
    if (typeof projectDialog.close === "function") projectDialog.close();
    else projectDialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
  }

  projectTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var project = projects[trigger.dataset.project];
      if (project) openProject(project, trigger);
    });
  });

  if (projectDialog) {
    projectDialog.addEventListener("click", function (event) {
      if (event.target === projectDialog) closeProjectDialog();
    });
    projectDialog.addEventListener("close", function () {
      document.body.classList.remove("dialog-open");
      if (currentProjectTrigger) currentProjectTrigger.focus();
    });
    var closeButton = projectDialog.querySelector("[data-close-dialog]");
    if (closeButton) closeButton.addEventListener("click", closeProjectDialog);
  }

  /* Toast */
  function hideToast() {
    if (!toast) return;
    toast.classList.remove("is-visible");
    window.clearTimeout(toastTimer);
  }

  function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 6000);
  }

  if (toastDismiss) toastDismiss.addEventListener("click", hideToast);

  /* Copy short handles (Discord) */
  Array.prototype.slice.call(document.querySelectorAll("[data-copy]")).forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";
      var copiedMessage = "Discord username " + value + " copied.";
      var fallback = function () {
        var helper = document.createElement("textarea");
        helper.value = value;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        try {
          document.execCommand("copy");
        } catch (error) {
          /* Fall back to showing the handle below. */
        }
        document.body.removeChild(helper);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          showToast(copiedMessage);
        }, function () {
          fallback();
          showToast("Discord username: " + value);
        });
      } else {
        fallback();
        showToast("Discord username: " + value);
      }
    });
  });

  /* Contact form (mailto hand-off) */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      var data = new FormData(contactForm);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();
      var subject = encodeURIComponent("Project enquiry from " + name);
      var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");

      showToast("Opening your email app — I reply within 24 hours.");
      window.location.href =
        "mailto:ayushrepos@outlook.com?subject=" + subject + "&body=" + body;
    });
  }

  /* Current year */
  Array.prototype.slice.call(document.querySelectorAll(".year")).forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });

  /* Recalculate after webfonts settle layout */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueScrollUpdate);
  }
})();
