(function () {
  "use strict";

  // Site root relative to this script's own location, so pages nested in
  // subfolders (e.g. /en/) still resolve assets correctly.
  var SCRIPT_SRC = document.currentScript ? document.currentScript.src : "";
  var ROOT_BASE = SCRIPT_SRC.replace(/js\/main\.js.*$/, "");

  // ---- Header shadow on scroll ----
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Mobile nav toggle ----
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("main-nav");

  function closeNav() {
    header.classList.remove("nav-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  navToggle.addEventListener("click", function () {
    var isOpen = header.classList.toggle("nav-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  navMenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeNav();
  });

  // ---- Smooth scroll for in-page anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  // ---- Lightbox for gallery ----
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".gallery-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var src = btn.getAttribute("data-full");
      var alt = btn.querySelector("img").getAttribute("alt");
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    lightboxImg.src = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  // ---- Reader: lecture en ligne du fascicule 1 ----
  var openReaderBtn = document.getElementById("openReaderBtn");
  if (openReaderBtn) {
    var reader = document.getElementById("reader");
    var readerImg = document.getElementById("readerImg");
    var readerIndicator = document.getElementById("readerPageIndicator");
    var readerClose = document.getElementById("readerClose");
    var readerPrev = document.getElementById("readerPrev");
    var readerNext = document.getElementById("readerNext");
    var READER_PAGE_COUNT = 22;
    var READER_BASE = ROOT_BASE + "assets/img/fascicule-1/page-";
    var readerPage = 1;

    function readerPagePath(n) {
      return READER_BASE + String(n).padStart(2, "0") + ".jpg";
    }

    function preload(n) {
      if (n < 1 || n > READER_PAGE_COUNT) return;
      var img = new Image();
      img.src = readerPagePath(n);
    }

    function renderReaderPage() {
      readerImg.src = readerPagePath(readerPage);
      readerIndicator.textContent = readerPage + " / " + READER_PAGE_COUNT;
      readerPrev.disabled = readerPage <= 1;
      readerNext.disabled = readerPage >= READER_PAGE_COUNT;
      preload(readerPage + 1);
      preload(readerPage - 1);
    }

    function openReader() {
      readerPage = 1;
      renderReaderPage();
      reader.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeReader() {
      reader.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    function goToPage(n) {
      if (n < 1 || n > READER_PAGE_COUNT) return;
      readerPage = n;
      renderReaderPage();
    }

    openReaderBtn.addEventListener("click", openReader);
    readerClose.addEventListener("click", closeReader);
    readerPrev.addEventListener("click", function () { goToPage(readerPage - 1); });
    readerNext.addEventListener("click", function () { goToPage(readerPage + 1); });

    document.addEventListener("keydown", function (e) {
      if (!reader.classList.contains("is-open")) return;
      if (e.key === "Escape") closeReader();
      if (e.key === "ArrowLeft") goToPage(readerPage - 1);
      if (e.key === "ArrowRight") goToPage(readerPage + 1);
    });
  }

  // ---- Letter lab: prononciation interactive des 7 premières lettres ----
  var openLetterLabBtn = document.getElementById("openLetterLabBtn");
  if (openLetterLabBtn) {
    var AUDIO_BASE = ROOT_BASE + "assets/audio/fascicule-1/";
    var LETTERS = [
      {
        id: "alif", char: "أ", name: "أَلِف",
        harakat: [["أَ", "alif-fatha"], ["أُ", "alif-damma"], ["إِ", "alif-kasra"]],
        moudoud: [["آ", "alif-madd-fatha"], ["أُو", "alif-madd-damma"], ["إِي", "alif-madd-kasra"]],
        tanwin: [["أً", "alif-tanwin-fatha"], ["أٌ", "alif-tanwin-damma"], ["إٍ", "alif-tanwin-kasra"]]
      },
      {
        id: "baa", char: "ب", name: "بَاء",
        harakat: [["بَ", "baa-fatha"], ["بُ", "baa-damma"], ["بِ", "baa-kasra"]],
        moudoud: [["بَا", "baa-madd-fatha"], ["بُو", "baa-madd-damma"], ["بِي", "baa-madd-kasra"]],
        tanwin: [["بًا", "baa-tanwin-fatha"], ["بٌ", "baa-tanwin-damma"], ["بٍ", "baa-tanwin-kasra"]]
      },
      {
        id: "taa", char: "ت", name: "تَاء",
        harakat: [["تَ", "taa-fatha"], ["تُ", "taa-damma"], ["تِ", "taa-kasra"]],
        moudoud: [["تَا", "taa-madd-fatha"], ["تُو", "taa-madd-damma"], ["تِي", "taa-madd-kasra"]],
        tanwin: [["تًا", "taa-tanwin-fatha"], ["تٌ", "taa-tanwin-damma"], ["تٍ", "taa-tanwin-kasra"]]
      },
      {
        id: "thaa", char: "ث", name: "ثَاء",
        harakat: [["ثَ", "thaa-fatha"], ["ثُ", "thaa-damma"], ["ثِ", "thaa-kasra"]],
        moudoud: [["ثَا", "thaa-madd-fatha"], ["ثُو", "thaa-madd-damma"], ["ثِي", "thaa-madd-kasra"]],
        tanwin: [["ثًا", "thaa-tanwin-fatha"], ["ثٌ", "thaa-tanwin-damma"], ["ثٍ", "thaa-tanwin-kasra"]]
      },
      {
        id: "jim", char: "ج", name: "جِيم",
        harakat: [["جَ", "jim-fatha"], ["جُ", "jim-damma"], ["جِ", "jim-kasra"]],
        moudoud: [["جَا", "jim-madd-fatha"], ["جُو", "jim-madd-damma"], ["جِي", "jim-madd-kasra"]],
        tanwin: [["جًا", "jim-tanwin-fatha"], ["جٌ", "jim-tanwin-damma"], ["جٍ", "jim-tanwin-kasra"]]
      },
      {
        id: "haa", char: "ح", name: "حَاء",
        harakat: [["حَ", "haa-fatha"], ["حُ", "haa-damma"], ["حِ", "haa-kasra"]],
        moudoud: [["حَا", "haa-madd-fatha"], ["حُو", "haa-madd-damma"], ["حِي", "haa-madd-kasra"]],
        tanwin: [["حًا", "haa-tanwin-fatha"], ["حٌ", "haa-tanwin-damma"], ["حٍ", "haa-tanwin-kasra"]]
      },
      {
        id: "khaa", char: "خ", name: "خَاء",
        harakat: [["خَ", "khaa-fatha"], ["خُ", "khaa-damma"], ["خِ", "khaa-kasra"]],
        moudoud: [["خَا", "khaa-madd-fatha"], ["خُو", "khaa-madd-damma"], ["خِي", "khaa-madd-kasra"]],
        tanwin: [["خًا", "khaa-tanwin-fatha"], ["خٌ", "khaa-tanwin-damma"], ["خٍ", "khaa-tanwin-kasra"]]
      }
    ];

    var letterLab = document.getElementById("letterLab");
    var letterLabTabs = document.getElementById("letterLabTabs");
    var letterLabName = document.getElementById("letterLabName");
    var letterLabGroups = document.getElementById("letterLabGroups");
    var letterLabClose = document.getElementById("letterLabClose");
    var currentAudio = null;
    var currentPlayingCell = null;

    function playForm(id, cellEl) {
      if (currentAudio) { currentAudio.pause(); }
      if (currentPlayingCell) { currentPlayingCell.classList.remove("is-playing"); }
      currentAudio = new Audio(AUDIO_BASE + id + ".m4a");
      currentPlayingCell = cellEl;
      cellEl.classList.add("is-playing");
      currentAudio.addEventListener("ended", function () {
        cellEl.classList.remove("is-playing");
      });
      currentAudio.play();
    }

    function buildGroup(title, groupKey, forms) {
      var group = document.createElement("div");
      group.className = "letterlab-group";
      group.setAttribute("data-group", groupKey);
      var h4 = document.createElement("h4");
      h4.textContent = title;
      group.appendChild(h4);
      var grid = document.createElement("div");
      grid.className = "letterlab-grid";
      forms.forEach(function (pair) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "letterlab-cell";
        btn.textContent = pair[0];
        btn.addEventListener("click", function () { playForm(pair[1], btn); });
        grid.appendChild(btn);
      });
      group.appendChild(grid);
      return group;
    }

    var isEnglish = document.documentElement.lang === "en";
    var GROUP_TITLES = isEnglish
      ? { harakat: "Vowels (الحركات)", moudoud: "Prolongations (المدود)", tanwin: "Tanwīn (التنوين)" }
      : { harakat: "Voyelles (الحركات)", moudoud: "Prolongations (المدود)", tanwin: "Tanwīn (التنوين)" };

    function renderLetter(letter) {
      letterLabName.textContent = letter.name;
      letterLabGroups.innerHTML = "";
      letterLabGroups.appendChild(buildGroup(GROUP_TITLES.harakat, "harakat", letter.harakat));
      letterLabGroups.appendChild(buildGroup(GROUP_TITLES.moudoud, "moudoud", letter.moudoud));
      letterLabGroups.appendChild(buildGroup(GROUP_TITLES.tanwin, "tanwin", letter.tanwin));

      Array.prototype.forEach.call(letterLabTabs.children, function (tab) {
        tab.classList.toggle("is-active", tab.getAttribute("data-letter") === letter.id);
      });
    }

    LETTERS.forEach(function (letter, index) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "letterlab-tab";
      tab.setAttribute("data-letter", letter.id);
      tab.textContent = letter.char;
      tab.addEventListener("click", function () { renderLetter(letter); });
      letterLabTabs.appendChild(tab);
    });

    function openLetterLab() {
      renderLetter(LETTERS[0]);
      letterLab.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeLetterLab() {
      letterLab.classList.remove("is-open");
      document.body.style.overflow = "";
      if (currentAudio) { currentAudio.pause(); }
      if (currentPlayingCell) { currentPlayingCell.classList.remove("is-playing"); }
    }

    openLetterLabBtn.addEventListener("click", openLetterLab);
    letterLabClose.addEventListener("click", closeLetterLab);
    document.addEventListener("keydown", function (e) {
      if (letterLab.classList.contains("is-open") && e.key === "Escape") closeLetterLab();
    });
  }
})();
