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

    // Index de toutes les lettres (harakat/moudoud/tanwin) par id, quel que
    // soit leur fascicule d'origine : sert de base aux modules ci-dessous,
    // qui reorganisent les memes lettres/audios sans les dupliquer.
    var ALL_LETTERS_BY_ID = {};
    [["1", LETTERS_F1], ["2", LETTERS_F2], ["3", LETTERS_F3]].forEach(function (pair) {
      var fascicule = pair[0];
      pair[1].forEach(function (letter) {
        letter.fascicule = fascicule;
        ALL_LETTERS_BY_ID[letter.id] = letter;
      });
    });

    // Les 28 lettres reparties en 12 modules pedagogiques (regroupement
    // different des fascicules, a des fins de revision cible). L'ordre et
    // la composition de chaque module sont fixes.
    var MODULES = [
      { number: 1, letterIds: ["alif"] },
      { number: 2, letterIds: ["baa", "taa", "thaa"] },
      { number: 3, letterIds: ["jim", "haa", "khaa"] },
      { number: 4, letterIds: ["dal", "thal"] },
      { number: 5, letterIds: ["reh", "zain"] },
      { number: 6, letterIds: ["seen", "sheen"] },
      { number: 7, letterIds: ["sad", "dad"] },
      { number: 8, letterIds: ["tah", "zah"] },
      { number: 9, letterIds: ["ain", "ghain"] },
      { number: 10, letterIds: ["feh", "qaf", "kaf"] },
      { number: 11, letterIds: ["lam", "meem", "noon"] },
      { number: 12, letterIds: ["heh", "waw", "yeh"] }
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
    var AUDIO_VERSION = "6";

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

    // Sur alif porteur d'une hamza superieure (أ), la fatha/damma/tanwin
    // du dessus vient visuellement toucher la hamza avec certaines
    // polices/tailles : on remonte legerement la marque dans ce cas precis.
    var RAISE_AFTER_HAMZA_ABOVE = /^[‌]?[ًٌَُّْ]/;
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

    // Dessine une forme (lettre de base + voyelle/marque en rouge) dans un
    // conteneur donne. Partage entre le labo de lettres et le jeu, pour
    // garantir le meme rendu (espacements, positionnement) partout.
    function renderLetterForm(container, text, baseLen) {
      // Tout le texte (lettre de base + marque + prolongation eventuelle)
      // est regroupe dans UN SEUL element inline. Necessaire quand le
      // conteneur est en display:flex (cartes du jeu) : sans ce wrapper,
      // chaque morceau de texte devient un item flex separe et la liaison
      // cursive arabe entre la lettre et sa prolongation se casse.
      var wrap = document.createElement("span");
      wrap.className = "letterlab-form";
      var baseChar = text.length > baseLen ? text.slice(0, baseLen) : "";
      var markContent = text.length > baseLen ? text.slice(baseLen) : text;
      var baseLast = baseChar.charAt(baseChar.length - 1);
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
      if (baseChar) wrap.appendChild(document.createTextNode(baseChar));
      wrap.appendChild(mark);
      if (trailing) {
        var trailingSpan = document.createElement("span");
        trailingSpan.className = "letterlab-mark";
        trailingSpan.textContent = trailing;
        wrap.appendChild(trailingSpan);
      }
      container.appendChild(wrap);
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
      forms.forEach(function (pair) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "letterlab-cell";
        renderLetterForm(btn, pair[0], pair.length > 2 ? pair[2] : 1);
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
      // Un module peut regrouper des lettres de plusieurs fascicules
      // d'origine (audio) ; chaque lettre porte donc son propre fascicule
      // et la base audio est recalculee a chaque affichage.
      if (letter.fascicule) {
        currentAudioBase = ROOT_BASE + "assets/audio/fascicule-" + letter.fascicule + "/";
      }
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

    // Module de revision : reutilise les memes lettres (harakat/moudoud/
    // tanwin) et la meme modale que les fascicules, juste reparties selon
    // un decoupage pedagogique different. Aucune donnee ni audio propre.
    function openModuleLab(moduleNumber, title) {
      var module = MODULES.filter(function (m) { return String(m.number) === String(moduleNumber); })[0];
      if (!module) return;
      var letters = module.letterIds.map(function (id) { return ALL_LETTERS_BY_ID[id]; }).filter(Boolean);
      if (!letters.length) return;
      currentGroupKeys = GROUPS_BY_FASCICULE["1"];
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
    document.querySelectorAll(".js-open-module").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModuleLab(btn.getAttribute("data-module"), btn.getAttribute("data-title"));
      });
    });
    letterLabClose.addEventListener("click", closeLetterLab);
    document.addEventListener("keydown", function (e) {
      if (letterLab.classList.contains("is-open") && e.key === "Escape") closeLetterLab();
    });

    // ---- Jeux : "Quel son as-tu entendu ?", par module ----
    // Architecture prevue pour les 12 modules (buildSoundPool marche pour
    // n'importe lequel), mais seul le module 1 (Alif) a ses questions
    // activees pour l'instant ; les autres restent "Bientot disponible".
    var gameBtns = document.querySelectorAll(".js-open-game");
    if (gameBtns.length) {
      var QUESTIONS_PER_ROUND = 10; // facilement modifiable
      var ANSWER_COUNT = 9; // nombre de propositions par question (sons), ecran pas surcharge
      var WORD_ANSWER_COUNT = 4; // nombre de propositions pour "Reconnaitre un mot"
      var GAMES_READY = {
        "1": true, "2": true, "3": true, "4": true, "5": true, "6": true,
        "7": true, "8": true, "9": true, "10": true, "11": true, "12": true
      };

      // Progression cumulative : le module N revise ses propres lettres
      // ET toutes celles des modules precedents (jamais l'inverse). Chaque
      // module de MODULES ne liste que ses lettres propres ; on cumule ici
      // au moment de jouer, sans dupliquer aucune liste.
      function cumulativeLetterIds(moduleNumber) {
        var ids = [];
        MODULES.forEach(function (m) {
          if (m.number <= Number(moduleNumber)) {
            ids = ids.concat(m.letterIds);
          }
        });
        return ids;
      }

      function cumulativeLetterCount(moduleNumber) {
        return cumulativeLetterIds(moduleNumber).length;
      }

      // Module ou chaque lettre apparait pour la premiere fois, deduit de
      // MODULES (jamais saisi a la main).
      var LETTER_INTRODUCED_IN_MODULE = {};
      MODULES.forEach(function (m) {
        m.letterIds.forEach(function (id) {
          if (!(id in LETTER_INTRODUCED_IN_MODULE)) { LETTER_INTRODUCED_IN_MODULE[id] = m.number; }
        });
      });

      function buildSoundPool(moduleNumber) {
        var letterIds = cumulativeLetterIds(moduleNumber);
        var pool = [];
        letterIds.forEach(function (id) {
          var letter = ALL_LETTERS_BY_ID[id];
          if (!letter) return;
          ["harakat", "moudoud", "tanwin"].forEach(function (key) {
            (letter[key] || []).forEach(function (pair) {
              pool.push({
                kind: "sound",
                key: pair[1],
                text: pair[0],
                baseLen: pair.length > 2 ? pair[2] : 1,
                audioId: pair[1],
                audioBase: ROOT_BASE + "assets/audio/fascicule-" + letter.fascicule + "/"
              });
            });
          });
        });
        return pool;
      }

      // Mots pour le jeu "Reconnaitre un mot", disponible a partir du
      // Module 2. Contrairement aux lettres (vrais enregistrements), les
      // audios de mots sont generes une fois par synthese vocale (voix
      // ar-SA-HamedNeural, arabe standard) puis reutilises tels quels -
      // jamais regeneres a la volee. audioId reste null tant que le
      // fichier n'existe pas encore : le mot n'apparait alors dans aucun
      // pool (voir buildWordPool). Le module minimal d'un mot est deduit
      // automatiquement de ses lettres (jamais saisi a la main) : un mot
      // ne peut donc jamais apparaitre avant que toutes ses lettres
      // soient apprises.
      var WORDS = [
        { id: "bab", arabic: "بَاب", letters: ["baa", "alif"], audioId: "bab" },
        { id: "ab", arabic: "أَب", letters: ["alif", "baa"], audioId: "ab" },
        { id: "taba", arabic: "تَابَ", letters: ["taa", "alif", "baa"], audioId: "taba" },
        { id: "thabit", arabic: "ثَابِت", letters: ["thaa", "alif", "baa", "taa"], audioId: "thabit" },
        { id: "taj", arabic: "تَاج", letters: ["taa", "alif", "jim"], audioId: "taj" },
        { id: "haj", arabic: "حَاج", letters: ["haa", "alif", "jim"], audioId: "haj" },
        { id: "akh", arabic: "أَخ", letters: ["alif", "khaa"], audioId: "akh" },
        { id: "ukht", arabic: "أُخْت", letters: ["alif", "khaa", "taa"], audioId: "ukht" },
        { id: "hubb", arabic: "حُبّ", letters: ["haa", "baa"], audioId: "hubb" },
        { id: "tahta", arabic: "تَحْتَ", letters: ["taa", "haa"], audioId: "tahta" },
        { id: "jadd", arabic: "جَدّ", letters: ["jim", "dal"], audioId: "jadd" },
        { id: "khudh", arabic: "خُذْ", letters: ["khaa", "thal"], audioId: "khudh" },
        { id: "akhadha", arabic: "أَخَذَ", letters: ["alif", "khaa", "thal"], audioId: "akhadha" },
        { id: "hadd", arabic: "حَدّ", letters: ["haa", "dal"], audioId: "hadd" },
        { id: "hadith", arabic: "حَادِث", letters: ["haa", "alif", "dal", "thaa"], audioId: "hadith" },
        { id: "bard", arabic: "بَرْد", letters: ["baa", "reh", "dal"], audioId: "bard" },
        { id: "zad", arabic: "زَاد", letters: ["zain", "alif", "dal"], audioId: "zad" },
        { id: "hathar", arabic: "حَذَر", letters: ["haa", "thal", "reh"], audioId: "hathar" },
        { id: "tajir", arabic: "تَاجِر", letters: ["taa", "alif", "jim", "reh"], audioId: "tajir" },
        { id: "rah", arabic: "رَاح", letters: ["reh", "alif", "haa"], audioId: "rah" },
        { id: "zajar", arabic: "زَجَر", letters: ["zain", "jim", "reh"], audioId: "zajar" },
        { id: "khubz", arabic: "خُبْز", letters: ["khaa", "baa", "zain"], audioId: "khubz" },
        { id: "shajar", arabic: "شَجَر", letters: ["sheen", "jim", "reh"], audioId: "shajar" },
        { id: "haris", arabic: "حَارِس", letters: ["haa", "alif", "reh", "seen"], audioId: "haris" },
        { id: "dars", arabic: "دَرْس", letters: ["dal", "reh", "seen"], audioId: "dars" },
        { id: "shariba", arabic: "شَرِبَ", letters: ["sheen", "reh", "baa"], audioId: "shariba" },
        { id: "sabab", arabic: "سَبَب", letters: ["seen", "baa"], audioId: "sabab" },
        { id: "khashab", arabic: "خَشَب", letters: ["khaa", "sheen", "baa"], audioId: "khashab" },
        { id: "daraba", arabic: "ضَرَب", letters: ["dad", "reh", "baa"], audioId: "daraba" },
        { id: "sahh", arabic: "صَحّ", letters: ["sad", "haa"], audioId: "sahh" },
        { id: "sadr", arabic: "صَدْر", letters: ["sad", "dal", "reh"], audioId: "sadr" },
        { id: "basar", arabic: "بَصَر", letters: ["baa", "sad", "reh"], audioId: "basar" },
        { id: "dabab", arabic: "ضَبَاب", letters: ["dad", "baa", "alif"], audioId: "dabab" },
        { id: "khatt", arabic: "خَط", letters: ["khaa", "tah"], audioId: "khatt" },
        { id: "batt", arabic: "بَطّ", letters: ["baa", "tah"], audioId: "batt" },
        { id: "hazz", arabic: "حَظّ", letters: ["haa", "zah"], audioId: "hazz" },
        { id: "shart", arabic: "شَرْط", letters: ["sheen", "reh", "tah"], audioId: "shart" },
        { id: "dabt", arabic: "ضَبْط", letters: ["dad", "baa", "tah"], audioId: "dabt" },
        { id: "adda", arabic: "عَضّ", letters: ["ain", "dad"], audioId: "adda" },
        { id: "ghadab", arabic: "غَضَب", letters: ["ghain", "dad", "baa"], audioId: "ghadab" },
        { id: "arab", arabic: "عَرَب", letters: ["ain", "reh", "baa"], audioId: "arab" },
        { id: "ghar", arabic: "غَار", letters: ["ghain", "alif", "reh"], audioId: "ghar" },
        { id: "shuja", arabic: "شُجَاع", letters: ["sheen", "jim", "alif", "ain"], audioId: "shuja" },
        { id: "kataba", arabic: "كَتَبَ", letters: ["kaf", "taa", "baa"], audioId: "kataba" },
        { id: "fataha", arabic: "فَتَح", letters: ["feh", "taa", "haa"], audioId: "fataha" },
        { id: "kabura", arabic: "كَبُر", letters: ["kaf", "baa", "reh"], audioId: "kabura" },
        { id: "farah", arabic: "فَرَح", letters: ["feh", "reh", "haa"], audioId: "farah" },
        { id: "qafaza", arabic: "قَفَزَ", letters: ["qaf", "feh", "zain"], audioId: "qafaza" },
        { id: "baqar", arabic: "بَقَر", letters: ["baa", "qaf", "reh"], audioId: "baqar" },
        { id: "kadhab", arabic: "كَذَب", letters: ["kaf", "thal", "baa"], audioId: "kadhab" },
        { id: "qalam", arabic: "قَلَم", letters: ["qaf", "lam", "meem"], audioId: "qalam" },
        { id: "nama", arabic: "نَام", letters: ["noon", "alif", "meem"], audioId: "nama" },
        { id: "laiba", arabic: "لَعِب", letters: ["lam", "ain", "baa"], audioId: "laiba" },
        { id: "jamal", arabic: "جَمَل", letters: ["jim", "meem", "lam"], audioId: "jamal" },
        { id: "najaha", arabic: "نَجَح", letters: ["noon", "jim", "haa"], audioId: "najaha" },
        { id: "kalb", arabic: "كَلْب", letters: ["kaf", "lam", "baa"], audioId: "kalb" },
        { id: "qamar", arabic: "قَمَر", letters: ["qaf", "meem", "reh"], audioId: "qamar" },
        { id: "bint", arabic: "بِنْت", letters: ["baa", "noon", "taa"], audioId: "bint" },
        { id: "bayt", arabic: "بَيْت", letters: ["baa", "yeh", "taa"], audioId: "bayt" },
        { id: "walad", arabic: "وَلَد", letters: ["waw", "lam", "dal"], audioId: "walad" },
        { id: "haraba", arabic: "هَرَب", letters: ["heh", "reh", "baa"], audioId: "haraba" },
        { id: "yad", arabic: "يَد", letters: ["yeh", "dal"], audioId: "yad" },
        { id: "wajh", arabic: "وَجْه", letters: ["waw", "jim", "heh"], audioId: "wajh" },
        { id: "nahr", arabic: "نَهْر", letters: ["noon", "heh", "reh"], audioId: "nahr" },
        { id: "yawm", arabic: "يَوْم", letters: ["yeh", "waw", "meem"], audioId: "yawm" },
        { id: "ward", arabic: "وَرْد", letters: ["waw", "reh", "dal"], audioId: "ward" }
      ];

      // Pseudo-mots : combinaisons phonetiquement valides construites en
      // assemblant de vrais enregistrements de lettres (jamais de TTS).
      // But pedagogique different des vrais mots : entrainer l'oreille a
      // distinguer des sons, pas necessairement apprendre du vocabulaire.
      // Chaque audio est assemble une seule fois (silences retires,
      // niveaux egalises, fondu enchaine sinusoidal 30ms entre unites) et
      // reutilise tel quel - jamais regenere pendant que l'enfant joue.
      var PSEUDO_WORDS = [
        { id: "tatha", arabic: "تَثَ", letters: ["taa", "thaa"], audioId: "tatha" },
        { id: "batatha", arabic: "بَتَثَ", letters: ["baa", "taa", "thaa"], audioId: "batatha" },
        { id: "abatatha", arabic: "أَبَتَثَ", letters: ["alif", "baa", "taa", "thaa"], audioId: "abatatha" },
        { id: "bata", arabic: "بَتَ", letters: ["baa", "taa"], audioId: "bata" },
        { id: "thaba", arabic: "ثَبَ", letters: ["baa", "thaa"], audioId: "thaba" },
        { id: "tuthi", arabic: "تُثِ", letters: ["taa", "thaa"], audioId: "tuthi" },
        { id: "abu2", arabic: "أَبُ", letters: ["alif", "baa"], audioId: "abu2" },
        { id: "tabatha", arabic: "تَبَثَ", letters: ["baa", "taa", "thaa"], audioId: "tabatha" },
        { id: "baatatha", arabic: "بَاتَثَ", letters: ["baa", "taa", "thaa"], audioId: "baatatha" },
        { id: "ibiti", arabic: "إِبِتِ", letters: ["alif", "baa", "taa"], audioId: "ibiti" },
        { id: "m3_01", arabic: "جِيخُتِ", letters: ["jim", "khaa", "taa"], audioId: "m3_01" },
        { id: "m3_02", arabic: "خِحَ", letters: ["haa", "khaa"], audioId: "m3_02" },
        { id: "m3_03", arabic: "جُخَ", letters: ["jim", "khaa"], audioId: "m3_03" },
        { id: "m3_04", arabic: "حُوجَ", letters: ["haa", "jim"], audioId: "m3_04" },
        { id: "m3_05", arabic: "أَخِحُ", letters: ["alif", "haa", "khaa"], audioId: "m3_05" },
        { id: "m3_06", arabic: "إِثَخِ", letters: ["alif", "khaa", "thaa"], audioId: "m3_06" },
        { id: "m3_07", arabic: "آجَ", letters: ["alif", "jim"], audioId: "m3_07" },
        { id: "m3_08", arabic: "تُحَثُخُ", letters: ["haa", "khaa", "taa", "thaa"], audioId: "m3_08" },
        { id: "m3_09", arabic: "خَاحِ", letters: ["haa", "khaa"], audioId: "m3_09" },
        { id: "m3_10", arabic: "حَجَ", letters: ["haa", "jim"], audioId: "m3_10" },
        { id: "m3_11", arabic: "أُجَخَاحَ", letters: ["alif", "haa", "jim", "khaa"], audioId: "m3_11" },
        { id: "m3_12", arabic: "ثَاخِبُ", letters: ["baa", "khaa", "thaa"], audioId: "m3_12" },
        { id: "m3_13", arabic: "حَاثَجَ", letters: ["haa", "jim", "thaa"], audioId: "m3_13" },
        { id: "m3_14", arabic: "حُخِ", letters: ["haa", "khaa"], audioId: "m3_14" },
        { id: "m3_15", arabic: "أُبِجُخُو", letters: ["alif", "baa", "jim", "khaa"], audioId: "m3_15" },
        { id: "m3_16", arabic: "بُتِجِي", letters: ["baa", "jim", "taa"], audioId: "m3_16" },
        { id: "m3_17", arabic: "خُحِتَ", letters: ["haa", "khaa", "taa"], audioId: "m3_17" },
        { id: "m3_18", arabic: "خَجُو", letters: ["jim", "khaa"], audioId: "m3_18" },
        { id: "m3_19", arabic: "ثُبُوجِ", letters: ["baa", "jim", "thaa"], audioId: "m3_19" },
        { id: "m3_20", arabic: "حُخَجَ", letters: ["haa", "jim", "khaa"], audioId: "m3_20" },
        { id: "m4_01", arabic: "دَاتِحَ", letters: ["dal", "haa", "taa"], audioId: "m4_01" },
        { id: "m4_02", arabic: "دُذَ", letters: ["dal", "thal"], audioId: "m4_02" },
        { id: "m4_03", arabic: "أُدُبَذَ", letters: ["alif", "baa", "dal", "thal"], audioId: "m4_03" },
        { id: "m4_04", arabic: "ذُودِتُ", letters: ["dal", "taa", "thal"], audioId: "m4_04" },
        { id: "m4_05", arabic: "إِدَجُحَ", letters: ["alif", "dal", "haa", "jim"], audioId: "m4_05" },
        { id: "m4_06", arabic: "دَذُو", letters: ["dal", "thal"], audioId: "m4_06" },
        { id: "m4_07", arabic: "بِذُدِ", letters: ["baa", "dal", "thal"], audioId: "m4_07" },
        { id: "m4_08", arabic: "ذُدُ", letters: ["dal", "thal"], audioId: "m4_08" },
        { id: "m4_09", arabic: "ذُودَ", letters: ["dal", "thal"], audioId: "m4_09" },
        { id: "m4_10", arabic: "دِتُذِيثِ", letters: ["dal", "taa", "thaa", "thal"], audioId: "m4_10" },
        { id: "m4_11", arabic: "ذِدَا", letters: ["dal", "thal"], audioId: "m4_11" },
        { id: "m4_12", arabic: "ذُوجَبِ", letters: ["baa", "jim", "thal"], audioId: "m4_12" },
        { id: "m4_13", arabic: "أُتَدَ", letters: ["alif", "dal", "taa"], audioId: "m4_13" },
        { id: "m4_14", arabic: "ذِدِتُ", letters: ["dal", "taa", "thal"], audioId: "m4_14" },
        { id: "m5_01", arabic: "حِرَدَ", letters: ["dal", "haa", "reh"], audioId: "m5_01" },
        { id: "m5_02", arabic: "زِرَ", letters: ["reh", "zain"], audioId: "m5_02" },
        { id: "m5_03", arabic: "ثَرُ", letters: ["reh", "thaa"], audioId: "m5_03" },
        { id: "m5_04", arabic: "زَاذَ", letters: ["thal", "zain"], audioId: "m5_04" },
        { id: "m5_05", arabic: "رِزَدِ", letters: ["dal", "reh", "zain"], audioId: "m5_05" },
        { id: "m5_06", arabic: "زُوجِ", letters: ["jim", "zain"], audioId: "m5_06" },
        { id: "m5_07", arabic: "رِحَ", letters: ["haa", "reh"], audioId: "m5_07" },
        { id: "m5_08", arabic: "رَدُوزُ", letters: ["dal", "reh", "zain"], audioId: "m5_08" },
        { id: "m5_09", arabic: "أُرِيبَ", letters: ["alif", "baa", "reh"], audioId: "m5_09" },
        { id: "m5_10", arabic: "زِرُ", letters: ["reh", "zain"], audioId: "m5_10" },
        { id: "m5_11", arabic: "إِرَثُ", letters: ["alif", "reh", "thaa"], audioId: "m5_11" },
        { id: "m5_12", arabic: "زِرِتُو", letters: ["reh", "taa", "zain"], audioId: "m5_12" },
        { id: "m5_13", arabic: "رُخُ", letters: ["khaa", "reh"], audioId: "m5_13" },
        { id: "m5_14", arabic: "رَزِي", letters: ["reh", "zain"], audioId: "m5_14" },
        { id: "m6_01", arabic: "شَسُ", letters: ["seen", "sheen"], audioId: "m6_01" },
        { id: "m6_02", arabic: "شُسُو", letters: ["seen", "sheen"], audioId: "m6_02" },
        { id: "m6_03", arabic: "ثَخَسَابِ", letters: ["baa", "khaa", "seen", "thaa"], audioId: "m6_03" },
        { id: "m6_04", arabic: "جَذُشَ", letters: ["jim", "sheen", "thal"], audioId: "m6_04" },
        { id: "m6_05", arabic: "سِتَ", letters: ["seen", "taa"], audioId: "m6_05" },
        { id: "m6_06", arabic: "سِشَ", letters: ["seen", "sheen"], audioId: "m6_06" },
        { id: "m6_07", arabic: "سِيشَ", letters: ["seen", "sheen"], audioId: "m6_07" },
        { id: "m6_08", arabic: "شِزَرَا", letters: ["reh", "sheen", "zain"], audioId: "m6_08" },
        { id: "m6_09", arabic: "سُرِ", letters: ["reh", "seen"], audioId: "m6_09" },
        { id: "m6_10", arabic: "شَخُ", letters: ["khaa", "sheen"], audioId: "m6_10" },
        { id: "m6_11", arabic: "خَسَشِ", letters: ["khaa", "seen", "sheen"], audioId: "m6_11" },
        { id: "m6_12", arabic: "رِتِحُشِ", letters: ["haa", "reh", "sheen", "taa"], audioId: "m6_12" },
        { id: "m6_13", arabic: "سِشُ", letters: ["seen", "sheen"], audioId: "m6_13" },
        { id: "m6_14", arabic: "ذِجُشَسُ", letters: ["jim", "seen", "sheen", "thal"], audioId: "m6_14" },
        { id: "m7_01", arabic: "بَذَثِيصَ", letters: ["baa", "sad", "thaa", "thal"], audioId: "m7_01" },
        { id: "m7_02", arabic: "حُرَضُثَا", letters: ["dad", "haa", "reh", "thaa"], audioId: "m7_02" },
        { id: "m7_03", arabic: "خُصُ", letters: ["khaa", "sad"], audioId: "m7_03" },
        { id: "m7_04", arabic: "أُثَدَضِ", letters: ["alif", "dad", "dal", "thaa"], audioId: "m7_04" },
        { id: "m7_05", arabic: "ضَذِصُ", letters: ["dad", "sad", "thal"], audioId: "m7_05" },
        { id: "m7_06", arabic: "جَصُضُ", letters: ["dad", "jim", "sad"], audioId: "m7_06" },
        { id: "m7_07", arabic: "صَضِي", letters: ["dad", "sad"], audioId: "m7_07" },
        { id: "m7_08", arabic: "ضَجُ", letters: ["dad", "jim"], audioId: "m7_08" },
        { id: "m7_09", arabic: "ثِيصِ", letters: ["sad", "thaa"], audioId: "m7_09" },
        { id: "m7_10", arabic: "ضِزِسَصُ", letters: ["dad", "sad", "seen", "zain"], audioId: "m7_10" },
        { id: "m7_11", arabic: "صَضِ", letters: ["dad", "sad"], audioId: "m7_11" },
        { id: "m7_12", arabic: "ضُسِيصَ", letters: ["dad", "sad", "seen"], audioId: "m7_12" },
        { id: "m7_13", arabic: "صِثِ", letters: ["sad", "thaa"], audioId: "m7_13" },
        { id: "m7_14", arabic: "ضُصُدِ", letters: ["dad", "dal", "sad"], audioId: "m7_14" },
        { id: "m8_01", arabic: "أَطَارَ", letters: ["alif", "reh", "tah"], audioId: "m8_01" },
        { id: "m8_02", arabic: "ظِطُ", letters: ["tah", "zah"], audioId: "m8_02" },
        { id: "m8_03", arabic: "طُحَزَ", letters: ["haa", "tah", "zain"], audioId: "m8_03" },
        { id: "m8_04", arabic: "ظَسُودَتُ", letters: ["dal", "seen", "taa", "zah"], audioId: "m8_04" },
        { id: "m8_05", arabic: "طَظَ", letters: ["tah", "zah"], audioId: "m8_05" },
        { id: "m8_06", arabic: "دِرِيطَظِ", letters: ["dal", "reh", "tah", "zah"], audioId: "m8_06" },
        { id: "m8_07", arabic: "طُظِ", letters: ["tah", "zah"], audioId: "m8_07" },
        { id: "m8_08", arabic: "أَحُطَظَا", letters: ["alif", "haa", "tah", "zah"], audioId: "m8_08" },
        { id: "m8_09", arabic: "جَاطَ", letters: ["jim", "tah"], audioId: "m8_09" },
        { id: "m8_10", arabic: "طِظَ", letters: ["tah", "zah"], audioId: "m8_10" },
        { id: "m8_11", arabic: "طُودِ", letters: ["dal", "tah"], audioId: "m8_11" },
        { id: "m8_12", arabic: "تُوظَ", letters: ["taa", "zah"], audioId: "m8_12" },
        { id: "m8_13", arabic: "طَسَظُتِ", letters: ["seen", "taa", "tah", "zah"], audioId: "m8_13" },
        { id: "m8_14", arabic: "ظَجِي", letters: ["jim", "zah"], audioId: "m8_14" },
        { id: "m9_01", arabic: "بَعُ", letters: ["ain", "baa"], audioId: "m9_01" },
        { id: "m9_02", arabic: "غُزِي", letters: ["ghain", "zain"], audioId: "m9_02" },
        { id: "m9_03", arabic: "غُعُ", letters: ["ain", "ghain"], audioId: "m9_03" },
        { id: "m9_04", arabic: "رَغُذَشُ", letters: ["ghain", "reh", "sheen", "thal"], audioId: "m9_04" },
        { id: "m9_05", arabic: "إِظِيعِرَ", letters: ["ain", "alif", "reh", "zah"], audioId: "m9_05" },
        { id: "m9_06", arabic: "أُوبَغِطِ", letters: ["alif", "baa", "ghain", "tah"], audioId: "m9_06" },
        { id: "m9_07", arabic: "عُوغِحُ", letters: ["ain", "ghain", "haa"], audioId: "m9_07" },
        { id: "m9_08", arabic: "غَعَا", letters: ["ain", "ghain"], audioId: "m9_08" },
        { id: "m9_09", arabic: "عُغُو", letters: ["ain", "ghain"], audioId: "m9_09" },
        { id: "m9_10", arabic: "صَاطُغِ", letters: ["ghain", "sad", "tah"], audioId: "m9_10" },
        { id: "m9_11", arabic: "شُزُثَاعُ", letters: ["ain", "sheen", "thaa", "zain"], audioId: "m9_11" },
        { id: "m9_12", arabic: "شُدَغِي", letters: ["dal", "ghain", "sheen"], audioId: "m9_12" },
        { id: "m9_13", arabic: "ذُغِعِ", letters: ["ain", "ghain", "thal"], audioId: "m9_13" },
        { id: "m9_14", arabic: "صِغَ", letters: ["ghain", "sad"], audioId: "m9_14" },
        { id: "m10_01", arabic: "حِيفِطِ", letters: ["feh", "haa", "tah"], audioId: "m10_01" },
        { id: "m10_02", arabic: "تَقِ", letters: ["qaf", "taa"], audioId: "m10_02" },
        { id: "m10_03", arabic: "جُكَ", letters: ["jim", "kaf"], audioId: "m10_03" },
        { id: "m10_04", arabic: "فُصَزُكَا", letters: ["feh", "kaf", "sad", "zain"], audioId: "m10_04" },
        { id: "m10_05", arabic: "قَغُجُ", letters: ["ghain", "jim", "qaf"], audioId: "m10_05" },
        { id: "m10_06", arabic: "كُغِقِ", letters: ["ghain", "kaf", "qaf"], audioId: "m10_06" },
        { id: "m10_07", arabic: "صِحِفَتُ", letters: ["feh", "haa", "sad", "taa"], audioId: "m10_07" },
        { id: "m10_08", arabic: "قَضِ", letters: ["dad", "qaf"], audioId: "m10_08" },
        { id: "m10_09", arabic: "كُفِ", letters: ["feh", "kaf"], audioId: "m10_09" },
        { id: "m10_10", arabic: "كِفَ", letters: ["feh", "kaf"], audioId: "m10_10" },
        { id: "m10_11", arabic: "فُقُو", letters: ["feh", "qaf"], audioId: "m10_11" },
        { id: "m10_12", arabic: "ظَكُو", letters: ["kaf", "zah"], audioId: "m10_12" },
        { id: "m10_13", arabic: "فَحَ", letters: ["feh", "haa"], audioId: "m10_13" },
        { id: "m10_14", arabic: "بَقُسِخِي", letters: ["baa", "khaa", "qaf", "seen"], audioId: "m10_14" },
        { id: "m10_15", arabic: "كَصَ", letters: ["kaf", "sad"], audioId: "m10_15" },
        { id: "m10_16", arabic: "دَافُضِ", letters: ["dad", "dal", "feh"], audioId: "m10_16" },
        { id: "m10_17", arabic: "كُقُذَسُ", letters: ["kaf", "qaf", "seen", "thal"], audioId: "m10_17" },
        { id: "m10_18", arabic: "إِيكُ", letters: ["alif", "kaf"], audioId: "m10_18" },
        { id: "m10_19", arabic: "زَثَقَافَ", letters: ["feh", "qaf", "thaa", "zain"], audioId: "m10_19" },
        { id: "m10_20", arabic: "فُضِقُ", letters: ["dad", "feh", "qaf"], audioId: "m10_20" },
        { id: "m10_21", arabic: "جُكُ", letters: ["jim", "kaf"], audioId: "m10_21" },
        { id: "m11_01", arabic: "لَمِ", letters: ["lam", "meem"], audioId: "m11_01" },
        { id: "m11_02", arabic: "قَامَ", letters: ["meem", "qaf"], audioId: "m11_02" },
        { id: "m11_03", arabic: "نَلَ", letters: ["lam", "noon"], audioId: "m11_03" },
        { id: "m11_04", arabic: "لَغُومَ", letters: ["ghain", "lam", "meem"], audioId: "m11_04" },
        { id: "m11_05", arabic: "نُذُعِيمُ", letters: ["ain", "meem", "noon", "thal"], audioId: "m11_05" },
        { id: "m11_06", arabic: "نَتُ", letters: ["noon", "taa"], audioId: "m11_06" },
        { id: "m11_07", arabic: "لِقُو", letters: ["lam", "qaf"], audioId: "m11_07" },
        { id: "m11_08", arabic: "سَمُ", letters: ["meem", "seen"], audioId: "m11_08" },
        { id: "m11_09", arabic: "نِلَ", letters: ["lam", "noon"], audioId: "m11_09" },
        { id: "m11_10", arabic: "حِصُلَ", letters: ["haa", "lam", "sad"], audioId: "m11_10" },
        { id: "m11_11", arabic: "أَمِي", letters: ["alif", "meem"], audioId: "m11_11" },
        { id: "m11_12", arabic: "أُلَانَ", letters: ["alif", "lam", "noon"], audioId: "m11_12" },
        { id: "m11_13", arabic: "دَمَلِ", letters: ["dal", "lam", "meem"], audioId: "m11_13" },
        { id: "m11_14", arabic: "دُولُمُ", letters: ["dal", "lam", "meem"], audioId: "m11_14" },
        { id: "m11_15", arabic: "بَانُ", letters: ["baa", "noon"], audioId: "m11_15" },
        { id: "m11_16", arabic: "ضِلِ", letters: ["dad", "lam"], audioId: "m11_16" },
        { id: "m11_17", arabic: "أُمُرَثُ", letters: ["alif", "meem", "reh", "thaa"], audioId: "m11_17" },
        { id: "m11_18", arabic: "نَزَ", letters: ["noon", "zain"], audioId: "m11_18" },
        { id: "m11_19", arabic: "مِلُ", letters: ["lam", "meem"], audioId: "m11_19" },
        { id: "m11_20", arabic: "قِمِ", letters: ["meem", "qaf"], audioId: "m11_20" },
        { id: "m11_21", arabic: "مِنِ", letters: ["meem", "noon"], audioId: "m11_21" },
        { id: "m12_01", arabic: "وِهَ", letters: ["heh", "waw"], audioId: "m12_01" },
        { id: "m12_02", arabic: "قَوَخَا", letters: ["khaa", "qaf", "waw"], audioId: "m12_02" },
        { id: "m12_03", arabic: "أُيِمِهُ", letters: ["alif", "heh", "meem", "yeh"], audioId: "m12_03" },
        { id: "m12_04", arabic: "هَرِ", letters: ["heh", "reh"], audioId: "m12_04" },
        { id: "m12_05", arabic: "تَظِوَ", letters: ["taa", "waw", "zah"], audioId: "m12_05" },
        { id: "m12_06", arabic: "يُصُ", letters: ["sad", "yeh"], audioId: "m12_06" },
        { id: "m12_07", arabic: "طُهُو", letters: ["heh", "tah"], audioId: "m12_07" },
        { id: "m12_08", arabic: "يَوِكُو", letters: ["kaf", "waw", "yeh"], audioId: "m12_08" },
        { id: "m12_09", arabic: "ثِيَاهَوِ", letters: ["heh", "thaa", "waw", "yeh"], audioId: "m12_09" },
        { id: "m12_10", arabic: "هِوُ", letters: ["heh", "waw"], audioId: "m12_10" },
        { id: "m12_11", arabic: "وِيرَغُ", letters: ["ghain", "reh", "waw"], audioId: "m12_11" },
        { id: "m12_12", arabic: "ظُويِ", letters: ["yeh", "zah"], audioId: "m12_12" },
        { id: "m12_13", arabic: "هُذُ", letters: ["heh", "thal"], audioId: "m12_13" },
        { id: "m12_14", arabic: "قَوَمِ", letters: ["meem", "qaf", "waw"], audioId: "m12_14" },
        { id: "m12_15", arabic: "يُوُ", letters: ["waw", "yeh"], audioId: "m12_15" },
        { id: "m12_16", arabic: "يَاذَهِسِ", letters: ["heh", "seen", "thal", "yeh"], audioId: "m12_16" },
        { id: "m12_17", arabic: "نُزِيوِ", letters: ["noon", "waw", "zain"], audioId: "m12_17" },
        { id: "m12_18", arabic: "يَاعِزُ", letters: ["ain", "yeh", "zain"], audioId: "m12_18" },
        { id: "m12_19", arabic: "زِدُطَهُو", letters: ["dal", "heh", "tah", "zain"], audioId: "m12_19" },
        { id: "m12_20", arabic: "وُيُ", letters: ["waw", "yeh"], audioId: "m12_20" },
        { id: "m12_21", arabic: "يِقُو", letters: ["qaf", "yeh"], audioId: "m12_21" }
      ];

      function wordMinModule(word) {
        return word.letters.reduce(function (max, id) {
          var m = LETTER_INTRODUCED_IN_MODULE[id] || 1;
          return m > max ? m : max;
        }, 1);
      }

      function buildWordPool(moduleNumber) {
        function eligible(list, audioFolder) {
          return list.filter(function (w) {
            return w.audioId && wordMinModule(w) <= Number(moduleNumber);
          }).map(function (w) {
            return {
              kind: "word", key: w.id, arabic: w.arabic, audioId: w.audioId,
              audioBase: ROOT_BASE + "assets/audio/" + audioFolder + "/",
              minModule: wordMinModule(w)
            };
          });
        }
        return eligible(WORDS, "words").concat(eligible(PSEUDO_WORDS, "pseudowords"));
      }

      function shuffle(list) {
        var arr = list.slice();
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
      }

      // Priorite pedagogique d'une question : les mots qui exploitent une
      // lettre TOUT JUSTE apprise (minModule egal au module en cours)
      // doivent sortir bien plus souvent que les revisions anciennes, sans
      // jamais exclure ces dernieres. L'ecart (module actuel - minModule du
      // mot) determine le poids ; plus le mot est "ancien", plus son poids
      // diminue, mais reste toujours >= 1 (aucun mot n'est totalement
      // exclu du tirage).
      function moduleWeight(diff) {
        if (diff <= 0) return 6;
        if (diff === 1) return 3;
        if (diff === 2) return 2;
        return 1;
      }

      function pickWeighted(list, moduleNumber) {
        var weights = list.map(function (item) {
          return item.minModule != null ? moduleWeight(Number(moduleNumber) - item.minModule) : 1;
        });
        var total = weights.reduce(function (a, b) { return a + b; }, 0);
        var r = Math.random() * total;
        for (var i = 0; i < list.length; i++) {
          r -= weights[i];
          if (r <= 0) return list[i];
        }
        return list[list.length - 1];
      }

      var gameModal = document.getElementById("gameModal");
      var gameModalTitle = document.getElementById("gameModalTitle");
      var gameModalClose = document.getElementById("gameModalClose");
      var gameBody = document.getElementById("gameBody");
      var gameEnd = document.getElementById("gameEnd");
      var gameScoreEl = document.getElementById("gameScore");
      var gameLevelInfo = document.getElementById("gameLevelInfo");
      var gameCategoryTabs = document.getElementById("gameCategoryTabs");
      var gameSoundTab = document.getElementById("gameSoundTab");
      var gameWordTab = document.getElementById("gameWordTab");
      var gameInstruction = document.getElementById("gameInstruction");
      var gamePlayBtn = document.getElementById("gamePlayBtn");
      var gameAnswers = document.getElementById("gameAnswers");
      var gameFeedback = document.getElementById("gameFeedback");
      var gameNextBtn = document.getElementById("gameNextBtn");
      var gameEndScore = document.getElementById("gameEndScore");
      var gameReplayBtn = document.getElementById("gameReplayBtn");

      var INSTRUCTION_TEXT = {
        sound: isEnglish ? "Listen, then choose the sound you heard." : "Écoute puis choisis le son que tu as entendu.",
        word: isEnglish ? "Listen, then choose the word you heard." : "Écoute puis choisis le mot que tu as entendu."
      };

      var gameAudio = null;
      var gameState = null;

      function playSound(item) {
        if (gameAudio) { gameAudio.pause(); }
        gameAudio = new Audio(item.audioBase + item.audioId + ".m4a?v=" + AUDIO_VERSION);
        gameAudio.play();
      }

      function renderScore() {
        gameScoreEl.textContent = gameState.score + " / " + gameState.questionIndex +
          (isEnglish ? " correct" : " bonnes réponses");
      }

      function showEnd() {
        gameBody.hidden = true;
        gameEnd.hidden = false;
        gameEndScore.textContent = gameState.score + " / " + QUESTIONS_PER_ROUND;
      }

      function nextQuestion() {
        if (gameState.questionIndex >= QUESTIONS_PER_ROUND) {
          showEnd();
          return;
        }
        var pool = gameState.pool;
        var answerCount = gameState.category === "word" ? WORD_ANSWER_COUNT : ANSWER_COUNT;

        // Evite de faire entendre deux fois exactement le meme mot/son dans
        // une meme serie : on tire uniquement parmi ceux pas encore utilises,
        // et on ne recycle les deja-utilises que si le bassin est epuise
        // (ex. Module 1, 9 sons pour 10 questions).
        var notUsed = pool.filter(function (item) { return !gameState.usedKeys[item.key]; });
        var candidates = notUsed.length ? notUsed : pool;
        if (!notUsed.length) { gameState.usedKeys = {}; }
        var correct = gameState.category === "word"
          ? pickWeighted(candidates, gameState.moduleNumber)
          : candidates[Math.floor(Math.random() * candidates.length)];
        gameState.usedKeys[correct.key] = true;

        // Limite le nombre de propositions affichees (ecran pas surcharge),
        // meme quand un module regroupe plusieurs lettres et donc plus de
        // sons possibles que ANSWER_COUNT : on tire des distracteurs au
        // hasard dans le reste du bassin (peu importe s'ils ont deja servi
        // de bonne reponse), en gardant toujours la bonne reponse parmi eux.
        var others = pool.filter(function (item) { return item.key !== correct.key; });
        var distractors = shuffle(others).slice(0, answerCount - 1);
        var choices = shuffle(distractors.concat([correct]));
        gameState.questionIndex += 1;
        gameState.current = { correct: correct, choices: choices, answered: false };

        gameFeedback.hidden = true;
        gameFeedback.className = "game-feedback";
        gameFeedback.textContent = "";
        gameNextBtn.hidden = true;
        renderScore();

        gameAnswers.innerHTML = "";
        gameAnswers.classList.toggle("game-answers-word", gameState.category === "word");
        choices.forEach(function (choice) {
          var btn = document.createElement("button");
          btn.type = "button";
          if (choice.kind === "word") {
            btn.className = "letterlab-cell game-answer game-answer-word";
            btn.textContent = choice.arabic;
          } else {
            btn.className = "letterlab-cell game-answer";
            renderLetterForm(btn, choice.text, choice.baseLen);
          }
          btn.addEventListener("click", function () { onAnswer(choice, btn); });
          gameAnswers.appendChild(btn);
        });

        playSound(correct);
      }

      function onAnswer(choice, btnEl) {
        if (gameState.current.answered) return;
        gameState.current.answered = true;
        var isCorrect = choice.key === gameState.current.correct.key;
        if (isCorrect) { gameState.score += 1; }

        Array.prototype.forEach.call(gameAnswers.children, function (btn) {
          btn.disabled = true;
        });
        btnEl.classList.add(isCorrect ? "is-correct" : "is-wrong");
        if (!isCorrect) {
          Array.prototype.forEach.call(gameAnswers.children, function (btn, idx) {
            if (gameState.current.choices[idx].key === gameState.current.correct.key) {
              btn.classList.add("is-correct");
            }
          });
        }

        gameFeedback.hidden = false;
        gameFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        gameFeedback.textContent = isCorrect
          ? (isEnglish ? "Correct!" : "Bravo, c'est la bonne réponse !")
          : (isEnglish ? "Not quite — here is the right answer." : "Ce n'était pas ça — voici la bonne réponse.");

        gameNextBtn.hidden = false;
        renderScore();
      }

      function setActiveTab(category) {
        gameSoundTab.classList.toggle("is-active", category === "sound");
        gameWordTab.classList.toggle("is-active", category === "word");
        gameInstruction.textContent = INSTRUCTION_TEXT[category];
      }

      function updateCategoryTabs(moduleNumber) {
        var showTabs = Number(moduleNumber) > 1;
        gameCategoryTabs.hidden = !showTabs;
        if (!showTabs) return;
        var wordPool = buildWordPool(moduleNumber);
        var wordReady = wordPool.length >= 2;
        gameWordTab.disabled = !wordReady;
        gameWordTab.classList.toggle("is-disabled", !wordReady);
      }

      function startRound(moduleNumber, title, category) {
        var pool = category === "word" ? buildWordPool(moduleNumber) : buildSoundPool(moduleNumber);
        if (!pool.length) return false;
        gameState = { moduleNumber: moduleNumber, title: title, category: category, pool: pool, questionIndex: 0, score: 0, current: null, usedKeys: {} };
        gameModalTitle.textContent = title;
        var letterCount = cumulativeLetterCount(moduleNumber);
        gameLevelInfo.textContent = isEnglish
          ? "Letters learned so far: " + letterCount
          : "Lettres apprises : " + letterCount;
        gameBody.hidden = false;
        gameEnd.hidden = true;
        setActiveTab(category);
        nextQuestion();
        return true;
      }

      function startGame(moduleNumber, title) {
        if (!startRound(moduleNumber, title, "sound")) return;
        updateCategoryTabs(moduleNumber);
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      function closeGame() {
        gameModal.classList.remove("is-open");
        document.body.style.overflow = "";
        if (gameAudio) { gameAudio.pause(); }
      }

      gameBtns.forEach(function (btn) {
        var moduleNumber = btn.getAttribute("data-module");
        if (!GAMES_READY[moduleNumber]) return;
        btn.addEventListener("click", function () {
          startGame(moduleNumber, btn.getAttribute("data-title"));
        });
      });
      gameSoundTab.addEventListener("click", function () {
        if (!gameState || gameState.category === "sound") return;
        startRound(gameState.moduleNumber, gameState.title, "sound");
      });
      gameWordTab.addEventListener("click", function () {
        if (!gameState || gameWordTab.disabled || gameState.category === "word") return;
        startRound(gameState.moduleNumber, gameState.title, "word");
      });
      gamePlayBtn.addEventListener("click", function () {
        if (gameState && gameState.current) playSound(gameState.current.correct);
      });
      gameNextBtn.addEventListener("click", nextQuestion);
      gameReplayBtn.addEventListener("click", function () {
        startRound(gameState.moduleNumber, gameState.title, gameState.category);
      });
      gameModalClose.addEventListener("click", closeGame);
      document.addEventListener("keydown", function (e) {
        if (gameModal.classList.contains("is-open") && e.key === "Escape") closeGame();
      });
    }
  }
})();
