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

  // ---- Reader: lecture en ligne des fascicules (partage entre plusieurs) ----
  var readerBtns = document.querySelectorAll(".js-open-reader");
  if (readerBtns.length) {
    var reader = document.getElementById("reader");
    var readerImg = document.getElementById("readerImg");
    var readerTitle = document.getElementById("readerTitle");
    var readerIndicator = document.getElementById("readerPageIndicator");
    var readerClose = document.getElementById("readerClose");
    var readerPrev = document.getElementById("readerPrev");
    var readerNext = document.getElementById("readerNext");
    var readerPageCount = 1;
    var readerBase = "";
    var readerPage = 1;

    function readerPagePath(n) {
      return readerBase + String(n).padStart(2, "0") + ".jpg";
    }

    function preload(n) {
      if (n < 1 || n > readerPageCount) return;
      var img = new Image();
      img.src = readerPagePath(n);
    }

    function renderReaderPage() {
      readerImg.src = readerPagePath(readerPage);
      readerIndicator.textContent = readerPage + " / " + readerPageCount;
      readerPrev.disabled = readerPage <= 1;
      readerNext.disabled = readerPage >= readerPageCount;
      preload(readerPage + 1);
      preload(readerPage - 1);
    }

    function openReader(pages, base, title) {
      readerPageCount = pages;
      readerBase = ROOT_BASE + base;
      readerTitle.textContent = title;
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
      if (n < 1 || n > readerPageCount) return;
      readerPage = n;
      renderReaderPage();
    }

    readerBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openReader(
          parseInt(btn.getAttribute("data-pages"), 10),
          btn.getAttribute("data-base"),
          btn.getAttribute("data-title")
        );
      });
    });
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

  // ---- Letter lab: prononciation interactive des lettres, par fascicule ----
  var letterLabBtns = document.querySelectorAll(".js-open-letterlab");
  if (letterLabBtns.length) {
    // Construit mecaniquement harakat/moudoud/tanwin a partir d'une consonne
    // de base (utilise pour les fascicules 2 et 3 ; alif du fascicule 1 reste
    // ecrit a la main car porte par la hamza, cas particulier).
    // Les lettres se lient normalement a la prolongation qui suit (forme
    // cursive connectee), conformement aux regles d'ecriture arabe ; seule
    // la couleur/graisse de la marque (cf. .letterlab-mark) distingue la
    // consonne de base de la voyelle/prolongation.
    function buildForms(id, char) {
      return {
        harakat: [
          [char + "َ", id + "-fatha"],
          [char + "ُ", id + "-damma"],
          [char + "ِ", id + "-kasra"]
        ],
        moudoud: [
          [char + "َ" + "ا", id + "-madd-fatha"],
          [char + "ُ" + "و", id + "-madd-damma"],
          [char + "ِ" + "ي", id + "-madd-kasra"]
        ],
        tanwin: [
          [char + "ً" + "ا", id + "-tanwin-fatha"],
          [char + "ٌ", id + "-tanwin-damma"],
          [char + "ٍ", id + "-tanwin-kasra"]
        ]
      };
    }
    function buildLetter(id, char, name) {
      var forms = buildForms(id, char);
      return { id: id, char: char, name: name, harakat: forms.harakat, moudoud: forms.moudoud, tanwin: forms.tanwin };
    }

    var LETTERS_F1 = [
      {
        id: "alif", char: "أ", name: "أَلِف",
        harakat: [["أَ", "alif-fatha"], ["أُ", "alif-damma"], ["إِ", "alif-kasra"]],
        moudoud: [["آ", "alif-madd-fatha"], ["أُو", "alif-madd-damma"], ["إِي", "alif-madd-kasra"]],
        tanwin: [["أً", "alif-tanwin-fatha"], ["أٌ", "alif-tanwin-damma"], ["إٍ", "alif-tanwin-kasra"]]
      },
      buildLetter("baa", "ب", "بَاء"),
      buildLetter("taa", "ت", "تَاء"),
      buildLetter("thaa", "ث", "ثَاء"),
      buildLetter("jim", "ج", "جِيم"),
      buildLetter("haa", "ح", "حَاء"),
      buildLetter("khaa", "خ", "خَاء")
    ];

    var LETTERS_F2 = [
      buildLetter("dal",   "د", "دَال"),
      buildLetter("thal",  "ذ", "ذَال"),
      buildLetter("reh",   "ر", "رَاء"),
      buildLetter("zain",  "ز", "زَاي"),
      buildLetter("seen",  "س", "سِين"),
      buildLetter("sheen", "ش", "شِين"),
      buildLetter("sad",   "ص", "صَاد"),
      buildLetter("dad",   "ض", "ضَاد"),
      buildLetter("tah",   "ط", "طَاء"),
      buildLetter("zah",   "ظ", "ظَاء")
    ];

    var LETTERS_F3 = [
      buildLetter("ain",   "ع", "عَيْن"),
      buildLetter("ghain", "غ", "غَيْن"),
      buildLetter("feh",   "ف", "فَاء"),
      buildLetter("qaf",   "ق", "قَاف"),
      buildLetter("kaf",   "ك", "كَاف"),
      buildLetter("lam",   "ل", "لَام"),
      buildLetter("meem",  "م", "مِيم"),
      buildLetter("noon",  "ن", "نُون"),
      buildLetter("heh",   "ه", "هَاء"),
      buildLetter("waw",   "و", "وَاو"),
      buildLetter("yeh",   "ي", "يَاء")
    ];

    // Fascicule 4 : sukun et shadda. Chaque lettre est presentee dans le
    // contexte "بَ" + lettre (comme dans le cahier), en sukun puis en
    // shadda ; seule la lettre cible et sa marque restent la partie
    // "nouvelle" mise en rouge, "بَ" servant de simple support de lecture.
    function buildLetterF4(id, char, name) {
      return {
        id: id, char: char, name: name,
        sukun: [["بَ" + char + "ْ", id + "-sukun", 3]],
        shadda: [["بَ" + char + "ّ" + "َ", id + "-shadda", 3]]
      };
    }

    var LETTERS_F4 = [
      buildLetterF4("alif", "أ", "أَلِف"),
      buildLetterF4("baa", "ب", "بَاء"),
      buildLetterF4("taa", "ت", "تَاء"),
      buildLetterF4("thaa", "ث", "ثَاء"),
      buildLetterF4("jim", "ج", "جِيم"),
      buildLetterF4("haa", "ح", "حَاء"),
      buildLetterF4("khaa", "خ", "خَاء"),
      buildLetterF4("dal", "د", "دَال"),
      buildLetterF4("thal", "ذ", "ذَال"),
      buildLetterF4("reh", "ر", "رَاء"),
      buildLetterF4("zain", "ز", "زَاي"),
      buildLetterF4("seen", "س", "سِين"),
      buildLetterF4("sheen", "ش", "شِين"),
      buildLetterF4("sad", "ص", "صَاد"),
      buildLetterF4("dad", "ض", "ضَاد"),
      buildLetterF4("tah", "ط", "طَاء"),
      buildLetterF4("zah", "ظ", "ظَاء"),
      buildLetterF4("ain", "ع", "عَيْن"),
      buildLetterF4("ghain", "غ", "غَيْن"),
      buildLetterF4("feh", "ف", "فَاء"),
      buildLetterF4("qaf", "ق", "قَاف"),
      buildLetterF4("kaf", "ك", "كَاف"),
      buildLetterF4("lam", "ل", "لَام"),
      buildLetterF4("meem", "م", "مِيم"),
      buildLetterF4("noon", "ن", "نُون"),
      buildLetterF4("heh", "ه", "هَاء"),
      buildLetterF4("waw", "و", "وَاو"),
      buildLetterF4("yeh", "ي", "يَاء")
    ];

    var LETTERS_BY_FASCICULE = { "1": LETTERS_F1, "2": LETTERS_F2, "3": LETTERS_F3, "4": LETTERS_F4 };
    var GROUPS_BY_FASCICULE = {
      "1": ["harakat", "moudoud", "tanwin"],
      "2": ["harakat", "moudoud", "tanwin"],
      "3": ["harakat", "moudoud", "tanwin"],
      "4": ["sukun", "shadda"]
    };
    var currentGroupKeys = GROUPS_BY_FASCICULE["1"];

    var letterLab = document.getElementById("letterLab");
    var letterLabTabs = document.getElementById("letterLabTabs");
    var letterLabTitle = document.getElementById("letterLabTitle");
    var letterLabName = document.getElementById("letterLabName");
    var letterLabGroups = document.getElementById("letterLabGroups");
    var letterLabClose = document.getElementById("letterLabClose");
    var currentAudio = null;
    var currentPlayingCell = null;
    var currentAudioBase = "";
    // Casse le cache navigateur quand un fichier audio est remplace sur le
    // serveur (meme piege deja rencontre avec le CSS/JS) : a incrementer
    // a chaque nouveau remplacement d'enregistrements.
    var AUDIO_VERSION = "2";

    function playForm(id, cellEl) {
      if (currentAudio) { currentAudio.pause(); }
      if (currentPlayingCell) { currentPlayingCell.classList.remove("is-playing"); }
      currentAudio = new Audio(currentAudioBase + id + ".m4a?v=" + AUDIO_VERSION);
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
      var arabicMatch = /\s*(\([؀-ۿ\s]+\))\s*$/.exec(title);
      if (arabicMatch) {
        h4.appendChild(document.createTextNode(title.slice(0, arabicMatch.index) + " "));
        var arabicSpan = document.createElement("span");
        arabicSpan.className = "letterlab-group-arabic";
        arabicSpan.textContent = arabicMatch[1];
        h4.appendChild(arabicSpan);
      } else {
        h4.textContent = title;
      }
      group.appendChild(h4);
      var grid = document.createElement("div");
      grid.className = "letterlab-grid";
      // Sur alif porteur d'une hamza superieure (أ), la fatha/damma/tanwin
      // du dessus vient visuellement toucher la hamza avec certaines
      // polices/tailles : on remonte legerement la marque dans ce cas precis.
      var RAISE_AFTER_HAMZA_ABOVE = /^[‌]?[ًٌَُّْ]/;
      // Sur les autres lettres, cette meme famille de marques (au-dessus)
      // laisse un blanc trop genereux avec la police : on la rapproche.
      var TIGHTEN_ABOVE = /^[ًٌَُ]/;
      // La kasra/kasratain (en dessous) est a l'inverse trop rapprochee par
      // defaut : on l'ecarte davantage, plus encore sur jim/ha/kha dont la
      // queue descend sous la ligne de base.
      var WIDEN_BELOW = /^[ٍِ]/;
      var TAILED_LETTERS = { "ج": true, "ح": true, "خ": true };
      // Un diacritique combinant qui suit (ex. la fatha apres la shadda)
      // doit rester colle au meme span que le premier, sinon il perd la
      // lettre porteuse a laquelle s'accrocher visuellement.
      var COMBINING_MARKS = { "َ": 1, "ُ": 1, "ِ": 1, "ً": 1, "ٌ": 1, "ٍ": 1, "ْ": 1, "ّ": 1 };
      forms.forEach(function (pair) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "letterlab-cell";
        var text = pair[0];
        // pair[2] indique la longueur du support de lecture (1 lettre en
        // temps normal ; 3 pour le fascicule 4 ou la lettre cible est
        // precedee du support fixe "بَ").
        var baseLen = pair.length > 2 ? pair[2] : 1;
        var baseChar = text.length > baseLen ? text.slice(0, baseLen) : "";
        var markContent = text.length > baseLen ? text.slice(baseLen) : text;
        var baseLast = baseChar.charAt(baseChar.length - 1);
        // Le diacritique lui-meme (1 caractere) est seul repositionne pour
        // la lisibilite ; ce qui suit reste sur la ligne normale s'il
        // s'agit d'une vraie lettre de prolongation (ا/و/ي), pour garder
        // sa liaison cursive correcte avec la lettre de base. Un second
        // diacritique combinant (ex. shadda+fatha) reste au contraire
        // colle au premier, sans quoi il ne s'affiche plus correctement.
        var diacritic = markContent.charAt(0);
        var rest = markContent.slice(1);
        if (rest && COMBINING_MARKS[rest.charAt(0)]) {
          diacritic += rest;
          rest = "";
        }
        var trailing = rest;
        var mark = document.createElement("span");
        mark.className = "letterlab-mark";
        if (baseLast === "أ" && RAISE_AFTER_HAMZA_ABOVE.test(diacritic)) {
          mark.classList.add("letterlab-mark-raised");
        } else if (TIGHTEN_ABOVE.test(diacritic)) {
          mark.classList.add("letterlab-mark-tightened");
        }
        if (WIDEN_BELOW.test(diacritic)) {
          mark.classList.add(TAILED_LETTERS[baseLast] ? "letterlab-mark-widened-tailed" : "letterlab-mark-widened");
        }
        mark.textContent = diacritic;
        if (baseChar) btn.appendChild(document.createTextNode(baseChar));
        btn.appendChild(mark);
        if (trailing) {
          var trailingSpan = document.createElement("span");
          trailingSpan.className = "letterlab-mark";
          trailingSpan.textContent = trailing;
          btn.appendChild(trailingSpan);
        }
        btn.addEventListener("click", function () { playForm(pair[1], btn); });
        grid.appendChild(btn);
      });
      group.appendChild(grid);
      return group;
    }

    var isEnglish = document.documentElement.lang === "en";
    var GROUP_TITLES = isEnglish
      ? {
          harakat: "Vowels (الْحَرَكَات)", moudoud: "Prolongations (الْمُدُود)", tanwin: "Tanwīn (التَّنْوِين)",
          sukun: "Sukūn (السُّكُون)", shadda: "Shadda (الشَّدَّة)"
        }
      : {
          harakat: "Voyelles (الْحَرَكَات)", moudoud: "Prolongations (الْمُدُود)", tanwin: "Tanwīn (التَّنْوِين)",
          sukun: "Sukūn (السُّكُون)", shadda: "Shadda (الشَّدَّة)"
        };

    function renderLetter(letter) {
      letterLabName.textContent = letter.name;
      letterLabGroups.innerHTML = "";
      currentGroupKeys.forEach(function (key) {
        letterLabGroups.appendChild(buildGroup(GROUP_TITLES[key], key, letter[key]));
      });

      Array.prototype.forEach.call(letterLabTabs.children, function (tab) {
        tab.classList.toggle("is-active", tab.getAttribute("data-letter") === letter.id);
      });
    }

    function buildTabs(letters) {
      letterLabTabs.innerHTML = "";
      letters.forEach(function (letter) {
        var tab = document.createElement("button");
        tab.type = "button";
        tab.className = "letterlab-tab";
        tab.setAttribute("data-letter", letter.id);
        var tabChar = document.createElement("span");
        tabChar.className = "letterlab-tab-char";
        tabChar.textContent = letter.char;
        tab.appendChild(tabChar);
        tab.addEventListener("click", function () { renderLetter(letter); });
        letterLabTabs.appendChild(tab);
      });
    }

    function openLetterLab(fascicule, title) {
      var letters = LETTERS_BY_FASCICULE[fascicule];
      if (!letters) return;
      currentGroupKeys = GROUPS_BY_FASCICULE[fascicule] || GROUPS_BY_FASCICULE["1"];
      currentAudioBase = ROOT_BASE + "assets/audio/fascicule-" + fascicule + "/";
      letterLabTitle.textContent = title;
      buildTabs(letters);
      renderLetter(letters[0]);
      letterLab.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeLetterLab() {
      letterLab.classList.remove("is-open");
      document.body.style.overflow = "";
      if (currentAudio) { currentAudio.pause(); }
      if (currentPlayingCell) { currentPlayingCell.classList.remove("is-playing"); }
    }

    letterLabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLetterLab(btn.getAttribute("data-fascicule"), btn.getAttribute("data-title"));
      });
    });
    letterLabClose.addEventListener("click", closeLetterLab);
    document.addEventListener("keydown", function (e) {
      if (letterLab.classList.contains("is-open") && e.key === "Escape") closeLetterLab();
    });
  }
})();
