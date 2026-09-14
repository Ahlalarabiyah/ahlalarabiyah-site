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
    var AUDIO_VERSION = "7";

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
      // Module 2. AUCUNE synthese vocale : ce sont tous des vrais verbes
      // arabes (passe, forme dictionnaire) dont l'orthographe est
      // entierement voyellee (chaque lettre porte fatha/damma/kasra ou une
      // prolongation), donc assemblables proprement a partir des vrais
      // enregistrements de lettres - exactement comme les pseudo-mots
      // (voir PSEUDO_WORDS). Les noms/mots se terminant par une consonne
      // muette (sukun) sont volontairement exclus : cette coupe n'existe
      // pas proprement dans les enregistrements fournis (pas de silence
      // entre le contexte et la lettre cible dans les fichiers sukun du
      // fascicule 4). Le module minimal d'un mot est deduit automatiquement
      // de ses lettres (jamais saisi a la main).
      var WORDS = [
        { id: "taba", arabic: "تَابَ", letters: ["baa", "taa"], audioId: "taba", units: ["taa-madd-fatha", "baa-fatha"] },
        { id: "thabata", arabic: "ثَبَتَ", letters: ["baa", "taa", "thaa"], audioId: "thabata", units: ["thaa-fatha", "baa-fatha", "taa-fatha"] },
        { id: "baata", arabic: "بَاتَ", letters: ["baa", "taa"], audioId: "baata", units: ["baa-madd-fatha", "taa-fatha"] },
        { id: "thaaba", arabic: "ثَابَ", letters: ["baa", "thaa"], audioId: "thaaba", units: ["thaa-madd-fatha", "baa-fatha"] },
        { id: "bahatha", arabic: "بَحَثَ", letters: ["baa", "haa", "thaa"], audioId: "bahatha", units: ["baa-fatha", "haa-fatha", "thaa-fatha"] },
        { id: "khaba", arabic: "خَابَ", letters: ["baa", "khaa"], audioId: "khaba", units: ["khaa-madd-fatha", "baa-fatha"] },
        { id: "jaba", arabic: "جَابَ", letters: ["baa", "jim"], audioId: "jaba", units: ["jim-madd-fatha", "baa-fatha"] },
        { id: "hajaba", arabic: "حَجَبَ", letters: ["baa", "haa", "jim"], audioId: "hajaba", units: ["haa-fatha", "jim-fatha", "baa-fatha"] },
        { id: "akhadha", arabic: "أَخَذَ", letters: ["alif", "khaa", "thal"], audioId: "akhadha", units: ["alif-fatha", "khaa-fatha", "thal-fatha"] },
        { id: "dhaba", arabic: "ذَابَ", letters: ["baa", "thal"], audioId: "dhaba", units: ["thal-madd-fatha", "baa-fatha"] },
        { id: "bada", arabic: "بَدَا", letters: ["baa", "dal"], audioId: "bada", units: ["baa-fatha", "dal-madd-fatha"] },
        { id: "jadhaba", arabic: "جَذَبَ", letters: ["baa", "jim", "thal"], audioId: "jadhaba", units: ["jim-fatha", "thal-fatha", "baa-fatha"] },
        { id: "hadatha", arabic: "حَدَثَ", letters: ["dal", "haa", "thaa"], audioId: "hadatha", units: ["haa-fatha", "dal-fatha", "thaa-fatha"] },
        { id: "zajara", arabic: "زَجَرَ", letters: ["jim", "reh", "zain"], audioId: "zajara", units: ["zain-fatha", "jim-fatha", "reh-fatha"] },
        { id: "kharaja", arabic: "خَرَجَ", letters: ["jim", "khaa", "reh"], audioId: "kharaja", units: ["khaa-fatha", "reh-fatha", "jim-fatha"] },
        { id: "baraza", arabic: "بَرَزَ", letters: ["baa", "reh", "zain"], audioId: "baraza", units: ["baa-fatha", "reh-fatha", "zain-fatha"] },
        { id: "zara", arabic: "زَارَ", letters: ["reh", "zain"], audioId: "zara", units: ["zain-madd-fatha", "reh-fatha"] },
        { id: "shariba", arabic: "شَرِبَ", letters: ["baa", "reh", "sheen"], audioId: "shariba", units: ["sheen-fatha", "reh-kasra", "baa-fatha"] },
        { id: "darasa", arabic: "دَرَسَ", letters: ["dal", "reh", "seen"], audioId: "darasa", units: ["dal-fatha", "reh-fatha", "seen-fatha"] },
        { id: "sharaha", arabic: "شَرَحَ", letters: ["haa", "reh", "sheen"], audioId: "sharaha", units: ["sheen-fatha", "reh-fatha", "haa-fatha"] },
        { id: "sahaba", arabic: "سَحَبَ", letters: ["baa", "haa", "seen"], audioId: "sahaba", units: ["seen-fatha", "haa-fatha", "baa-fatha"] },
        { id: "daraba", arabic: "ضَرَبَ", letters: ["baa", "dad", "reh"], audioId: "daraba", units: ["dad-fatha", "reh-fatha", "baa-fatha"] },
        { id: "rasada", arabic: "رَصَدَ", letters: ["dal", "reh", "sad"], audioId: "rasada", units: ["reh-fatha", "sad-fatha", "dal-fatha"] },
        { id: "hadara", arabic: "حَضَرَ", letters: ["dad", "haa", "reh"], audioId: "hadara", units: ["haa-fatha", "dad-fatha", "reh-fatha"] },
        { id: "sarakha", arabic: "صَرَخَ", letters: ["khaa", "reh", "sad"], audioId: "sarakha", units: ["sad-fatha", "reh-fatha", "khaa-fatha"] },
        { id: "khataba", arabic: "خَطَبَ", letters: ["baa", "khaa", "tah"], audioId: "khataba", units: ["khaa-fatha", "tah-fatha", "baa-fatha"] },
        { id: "dabata", arabic: "ضَبَطَ", letters: ["baa", "dad", "tah"], audioId: "dabata", units: ["dad-fatha", "baa-fatha", "tah-fatha"] },
        { id: "khatara", arabic: "خَطَرَ", letters: ["khaa", "reh", "tah"], audioId: "khatara", units: ["khaa-fatha", "tah-fatha", "reh-fatha"] },
        { id: "taraha", arabic: "طَرَحَ", letters: ["haa", "reh", "tah"], audioId: "taraha", units: ["tah-fatha", "reh-fatha", "haa-fatha"] },
        { id: "ghadiba", arabic: "غَضِبَ", letters: ["baa", "dad", "ghain"], audioId: "ghadiba", units: ["ghain-fatha", "dad-kasra", "baa-fatha"] },
        { id: "gharaba", arabic: "غَرَبَ", letters: ["baa", "ghain", "reh"], audioId: "gharaba", units: ["ghain-fatha", "reh-fatha", "baa-fatha"] },
        { id: "abara", arabic: "عَبَرَ", letters: ["ain", "baa", "reh"], audioId: "abara", units: ["ain-fatha", "baa-fatha", "reh-fatha"] },
        { id: "ghaza", arabic: "غَزَا", letters: ["ghain", "zain"], audioId: "ghaza", units: ["ghain-fatha", "zain-madd-fatha"] },
        { id: "kataba", arabic: "كَتَبَ", letters: ["baa", "kaf", "taa"], audioId: "kataba", units: ["kaf-fatha", "taa-fatha", "baa-fatha"] },
        { id: "qafaza", arabic: "قَفَزَ", letters: ["feh", "qaf", "zain"], audioId: "qafaza", units: ["qaf-fatha", "feh-fatha", "zain-fatha"] },
        { id: "fataha", arabic: "فَتَحَ", letters: ["feh", "haa", "taa"], audioId: "fataha", units: ["feh-fatha", "taa-fatha", "haa-fatha"] },
        { id: "arafa", arabic: "عَرَفَ", letters: ["ain", "feh", "reh"], audioId: "arafa", units: ["ain-fatha", "reh-fatha", "feh-fatha"] },
        { id: "kabura", arabic: "كَبُرَ", letters: ["baa", "kaf", "reh"], audioId: "kabura", units: ["kaf-fatha", "baa-damma", "reh-fatha"] },
        { id: "fariha", arabic: "فَرِحَ", letters: ["feh", "haa", "reh"], audioId: "fariha", units: ["feh-fatha", "reh-kasra", "haa-fatha"] },
        { id: "amila", arabic: "عَمِلَ", letters: ["ain", "lam", "meem"], audioId: "amila", units: ["ain-fatha", "meem-kasra", "lam-fatha"] },
        { id: "nazama", arabic: "نَظَمَ", letters: ["meem", "noon", "zah"], audioId: "nazama", units: ["noon-fatha", "zah-fatha", "meem-fatha"] },
        { id: "laiba", arabic: "لَعِبَ", letters: ["ain", "baa", "lam"], audioId: "laiba", units: ["lam-fatha", "ain-kasra", "baa-fatha"] },
        { id: "najaha", arabic: "نَجَحَ", letters: ["haa", "jim", "noon"], audioId: "najaha", units: ["noon-fatha", "jim-fatha", "haa-fatha"] },
        { id: "hamala", arabic: "حَمَلَ", letters: ["haa", "lam", "meem"], audioId: "hamala", units: ["haa-fatha", "meem-fatha", "lam-fatha"] },
        { id: "dakhala", arabic: "دَخَلَ", letters: ["dal", "khaa", "lam"], audioId: "dakhala", units: ["dal-fatha", "khaa-fatha", "lam-fatha"] },
        { id: "jalasa", arabic: "جَلَسَ", letters: ["jim", "lam", "seen"], audioId: "jalasa", units: ["jim-fatha", "lam-fatha", "seen-fatha"] },
        { id: "dhahaba", arabic: "ذَهَبَ", letters: ["baa", "heh", "thal"], audioId: "dhahaba", units: ["thal-fatha", "heh-fatha", "baa-fatha"] },
        { id: "wajada", arabic: "وَجَدَ", letters: ["dal", "jim", "waw"], audioId: "wajada", units: ["waw-fatha", "jim-fatha", "dal-fatha"] },
        { id: "wasala", arabic: "وَصَلَ", letters: ["lam", "sad", "waw"], audioId: "wasala", units: ["waw-fatha", "sad-fatha", "lam-fatha"] },
        { id: "wahaba", arabic: "وَهَبَ", letters: ["baa", "heh", "waw"], audioId: "wahaba", units: ["waw-fatha", "heh-fatha", "baa-fatha"] },
        { id: "haraba", arabic: "هَرَبَ", letters: ["baa", "heh", "reh"], audioId: "haraba", units: ["heh-fatha", "reh-fatha", "baa-fatha"] }
      ];

      // Pseudo-mots : combinaisons phonetiquement valides construites en
      // assemblant de vrais enregistrements de lettres (jamais de TTS).
      // But pedagogique different des vrais mots : entrainer l'oreille a
      // distinguer des sons, pas necessairement apprendre du vocabulaire.
      // Chaque audio est assemble une seule fois (silences retires,
      // niveaux egalises, fondu enchaine sinusoidal 30ms entre unites) et
      // reutilise tel quel - jamais regenere pendant que l'enfant joue.
      var PSEUDO_WORDS = [
        { id: "tatha", arabic: "تَثَ", letters: ["taa", "thaa"], audioId: "tatha", units: ["taa-fatha", "thaa-fatha"] },
        { id: "batatha", arabic: "بَتَثَ", letters: ["baa", "taa", "thaa"], audioId: "batatha", units: ["baa-fatha", "taa-fatha", "thaa-fatha"] },
        { id: "abatatha", arabic: "أَبَتَثَ", letters: ["alif", "baa", "taa", "thaa"], audioId: "abatatha", units: ["alif-fatha", "baa-fatha", "taa-fatha", "thaa-fatha"] },
        { id: "bata", arabic: "بَتَ", letters: ["baa", "taa"], audioId: "bata", units: ["baa-fatha", "taa-fatha"] },
        { id: "thaba", arabic: "ثَبَ", letters: ["baa", "thaa"], audioId: "thaba", units: ["thaa-fatha", "baa-fatha"] },
        { id: "tuthi", arabic: "تُثِ", letters: ["taa", "thaa"], audioId: "tuthi", units: ["taa-damma", "thaa-kasra"] },
        { id: "abu2", arabic: "أَبُ", letters: ["alif", "baa"], audioId: "abu2", units: ["alif-fatha", "baa-damma"] },
        { id: "tabatha", arabic: "تَبَثَ", letters: ["baa", "taa", "thaa"], audioId: "tabatha", units: ["taa-fatha", "baa-fatha", "thaa-fatha"] },
        { id: "baatatha", arabic: "بَاتَثَ", letters: ["baa", "taa", "thaa"], audioId: "baatatha", units: ["baa-madd-fatha", "taa-fatha", "thaa-fatha"] },
        { id: "ibiti", arabic: "إِبِتِ", letters: ["alif", "baa", "taa"], audioId: "ibiti", units: ["alif-kasra", "baa-kasra", "taa-kasra"] },
        { id: "m3_01", arabic: "جِيخُتِ", letters: ["jim", "khaa", "taa"], audioId: "m3_01", units: ["jim-madd-kasra", "khaa-damma", "taa-kasra"] },
        { id: "m3_02", arabic: "خِحَ", letters: ["haa", "khaa"], audioId: "m3_02", units: ["khaa-kasra", "haa-fatha"] },
        { id: "m3_03", arabic: "جُخَ", letters: ["jim", "khaa"], audioId: "m3_03", units: ["jim-damma", "khaa-fatha"] },
        { id: "m3_04", arabic: "حُوجَ", letters: ["haa", "jim"], audioId: "m3_04", units: ["haa-madd-damma", "jim-fatha"] },
        { id: "m3_05", arabic: "أَخِحُ", letters: ["alif", "haa", "khaa"], audioId: "m3_05", units: ["alif-fatha", "khaa-kasra", "haa-damma"] },
        { id: "m3_06", arabic: "إِثَخِ", letters: ["alif", "khaa", "thaa"], audioId: "m3_06", units: ["alif-kasra", "thaa-fatha", "khaa-kasra"] },
        { id: "m3_07", arabic: "آجَ", letters: ["alif", "jim"], audioId: "m3_07", units: ["alif-madd-fatha", "jim-fatha"] },
        { id: "m3_08", arabic: "تُحَثُخُ", letters: ["haa", "khaa", "taa", "thaa"], audioId: "m3_08", units: ["taa-damma", "haa-fatha", "thaa-damma", "khaa-damma"] },
        { id: "m3_09", arabic: "خَاحِ", letters: ["haa", "khaa"], audioId: "m3_09", units: ["khaa-madd-fatha", "haa-kasra"] },
        { id: "m3_10", arabic: "حَجَ", letters: ["haa", "jim"], audioId: "m3_10", units: ["haa-fatha", "jim-fatha"] },
        { id: "m3_11", arabic: "أُجَخَاحَ", letters: ["alif", "haa", "jim", "khaa"], audioId: "m3_11", units: ["alif-damma", "jim-fatha", "khaa-madd-fatha", "haa-fatha"] },
        { id: "m3_12", arabic: "ثَاخِبُ", letters: ["baa", "khaa", "thaa"], audioId: "m3_12", units: ["thaa-madd-fatha", "khaa-kasra", "baa-damma"] },
        { id: "m3_13", arabic: "حَاثَجَ", letters: ["haa", "jim", "thaa"], audioId: "m3_13", units: ["haa-madd-fatha", "thaa-fatha", "jim-fatha"] },
        { id: "m3_14", arabic: "حُخِ", letters: ["haa", "khaa"], audioId: "m3_14", units: ["haa-damma", "khaa-kasra"] },
        { id: "m3_15", arabic: "أُبِجُخُو", letters: ["alif", "baa", "jim", "khaa"], audioId: "m3_15", units: ["alif-damma", "baa-kasra", "jim-damma", "khaa-madd-damma"] },
        { id: "m3_16", arabic: "بُتِجِي", letters: ["baa", "jim", "taa"], audioId: "m3_16", units: ["baa-damma", "taa-kasra", "jim-madd-kasra"] },
        { id: "m3_17", arabic: "خُحِتَ", letters: ["haa", "khaa", "taa"], audioId: "m3_17", units: ["khaa-damma", "haa-kasra", "taa-fatha"] },
        { id: "m3_18", arabic: "خَجُو", letters: ["jim", "khaa"], audioId: "m3_18", units: ["khaa-fatha", "jim-madd-damma"] },
        { id: "m3_19", arabic: "ثُبُوجِ", letters: ["baa", "jim", "thaa"], audioId: "m3_19", units: ["thaa-damma", "baa-madd-damma", "jim-kasra"] },
        { id: "m3_20", arabic: "حُخَجَ", letters: ["haa", "jim", "khaa"], audioId: "m3_20", units: ["haa-damma", "khaa-fatha", "jim-fatha"] },
        { id: "m4_01", arabic: "دَاتِحَ", letters: ["dal", "haa", "taa"], audioId: "m4_01", units: ["dal-madd-fatha", "taa-kasra", "haa-fatha"] },
        { id: "m4_02", arabic: "دُذَ", letters: ["dal", "thal"], audioId: "m4_02", units: ["dal-damma", "thal-fatha"] },
        { id: "m4_03", arabic: "أُدُبَذَ", letters: ["alif", "baa", "dal", "thal"], audioId: "m4_03", units: ["alif-damma", "dal-damma", "baa-fatha", "thal-fatha"] },
        { id: "m4_04", arabic: "ذُودِتُ", letters: ["dal", "taa", "thal"], audioId: "m4_04", units: ["thal-madd-damma", "dal-kasra", "taa-damma"] },
        { id: "m4_05", arabic: "إِدَجُحَ", letters: ["alif", "dal", "haa", "jim"], audioId: "m4_05", units: ["alif-kasra", "dal-fatha", "jim-damma", "haa-fatha"] },
        { id: "m4_06", arabic: "دَذُو", letters: ["dal", "thal"], audioId: "m4_06", units: ["dal-fatha", "thal-madd-damma"] },
        { id: "m4_07", arabic: "بِذُدِ", letters: ["baa", "dal", "thal"], audioId: "m4_07", units: ["baa-kasra", "thal-damma", "dal-kasra"] },
        { id: "m4_08", arabic: "ذُدُ", letters: ["dal", "thal"], audioId: "m4_08", units: ["thal-damma", "dal-damma"] },
        { id: "m4_09", arabic: "ذُودَ", letters: ["dal", "thal"], audioId: "m4_09", units: ["thal-madd-damma", "dal-fatha"] },
        { id: "m4_10", arabic: "دِتُذِيثِ", letters: ["dal", "taa", "thaa", "thal"], audioId: "m4_10", units: ["dal-kasra", "taa-damma", "thal-madd-kasra", "thaa-kasra"] },
        { id: "m4_11", arabic: "ذِدَا", letters: ["dal", "thal"], audioId: "m4_11", units: ["thal-kasra", "dal-madd-fatha"] },
        { id: "m4_12", arabic: "ذُوجَبِ", letters: ["baa", "jim", "thal"], audioId: "m4_12", units: ["thal-madd-damma", "jim-fatha", "baa-kasra"] },
        { id: "m4_13", arabic: "أُتَدَ", letters: ["alif", "dal", "taa"], audioId: "m4_13", units: ["alif-damma", "taa-fatha", "dal-fatha"] },
        { id: "m4_14", arabic: "ذِدِتُ", letters: ["dal", "taa", "thal"], audioId: "m4_14", units: ["thal-kasra", "dal-kasra", "taa-damma"] },
        { id: "m5_01", arabic: "حِرَدَ", letters: ["dal", "haa", "reh"], audioId: "m5_01", units: ["haa-kasra", "reh-fatha", "dal-fatha"] },
        { id: "m5_02", arabic: "زِرَ", letters: ["reh", "zain"], audioId: "m5_02", units: ["zain-kasra", "reh-fatha"] },
        { id: "m5_03", arabic: "ثَرُ", letters: ["reh", "thaa"], audioId: "m5_03", units: ["thaa-fatha", "reh-damma"] },
        { id: "m5_04", arabic: "زَاذَ", letters: ["thal", "zain"], audioId: "m5_04", units: ["zain-madd-fatha", "thal-fatha"] },
        { id: "m5_05", arabic: "رِزَدِ", letters: ["dal", "reh", "zain"], audioId: "m5_05", units: ["reh-kasra", "zain-fatha", "dal-kasra"] },
        { id: "m5_06", arabic: "زُوجِ", letters: ["jim", "zain"], audioId: "m5_06", units: ["zain-madd-damma", "jim-kasra"] },
        { id: "m5_07", arabic: "رِحَ", letters: ["haa", "reh"], audioId: "m5_07", units: ["reh-kasra", "haa-fatha"] },
        { id: "m5_08", arabic: "رَدُوزُ", letters: ["dal", "reh", "zain"], audioId: "m5_08", units: ["reh-fatha", "dal-madd-damma", "zain-damma"] },
        { id: "m5_09", arabic: "أُرِيبَ", letters: ["alif", "baa", "reh"], audioId: "m5_09", units: ["alif-damma", "reh-madd-kasra", "baa-fatha"] },
        { id: "m5_10", arabic: "زِرُ", letters: ["reh", "zain"], audioId: "m5_10", units: ["zain-kasra", "reh-damma"] },
        { id: "m5_11", arabic: "إِرَثُ", letters: ["alif", "reh", "thaa"], audioId: "m5_11", units: ["alif-kasra", "reh-fatha", "thaa-damma"] },
        { id: "m5_12", arabic: "زِرِتُو", letters: ["reh", "taa", "zain"], audioId: "m5_12", units: ["zain-kasra", "reh-kasra", "taa-madd-damma"] },
        { id: "m5_13", arabic: "رُخُ", letters: ["khaa", "reh"], audioId: "m5_13", units: ["reh-damma", "khaa-damma"] },
        { id: "m5_14", arabic: "رَزِي", letters: ["reh", "zain"], audioId: "m5_14", units: ["reh-fatha", "zain-madd-kasra"] },
        { id: "m6_01", arabic: "شَسُ", letters: ["seen", "sheen"], audioId: "m6_01", units: ["sheen-fatha", "seen-damma"] },
        { id: "m6_02", arabic: "شُسُو", letters: ["seen", "sheen"], audioId: "m6_02", units: ["sheen-damma", "seen-madd-damma"] },
        { id: "m6_03", arabic: "ثَخَسَابِ", letters: ["baa", "khaa", "seen", "thaa"], audioId: "m6_03", units: ["thaa-fatha", "khaa-fatha", "seen-madd-fatha", "baa-kasra"] },
        { id: "m6_04", arabic: "جَذُشَ", letters: ["jim", "sheen", "thal"], audioId: "m6_04", units: ["jim-fatha", "thal-damma", "sheen-fatha"] },
        { id: "m6_05", arabic: "سِتَ", letters: ["seen", "taa"], audioId: "m6_05", units: ["seen-kasra", "taa-fatha"] },
        { id: "m6_06", arabic: "سِشَ", letters: ["seen", "sheen"], audioId: "m6_06", units: ["seen-kasra", "sheen-fatha"] },
        { id: "m6_07", arabic: "سِيشَ", letters: ["seen", "sheen"], audioId: "m6_07", units: ["seen-madd-kasra", "sheen-fatha"] },
        { id: "m6_08", arabic: "شِزَرَا", letters: ["reh", "sheen", "zain"], audioId: "m6_08", units: ["sheen-kasra", "zain-fatha", "reh-madd-fatha"] },
        { id: "m6_09", arabic: "سُرِ", letters: ["reh", "seen"], audioId: "m6_09", units: ["seen-damma", "reh-kasra"] },
        { id: "m6_10", arabic: "شَخُ", letters: ["khaa", "sheen"], audioId: "m6_10", units: ["sheen-fatha", "khaa-damma"] },
        { id: "m6_11", arabic: "خَسَشِ", letters: ["khaa", "seen", "sheen"], audioId: "m6_11", units: ["khaa-fatha", "seen-fatha", "sheen-kasra"] },
        { id: "m6_12", arabic: "رِتِحُشِ", letters: ["haa", "reh", "sheen", "taa"], audioId: "m6_12", units: ["reh-kasra", "taa-kasra", "haa-damma", "sheen-kasra"] },
        { id: "m6_13", arabic: "سِشُ", letters: ["seen", "sheen"], audioId: "m6_13", units: ["seen-kasra", "sheen-damma"] },
        { id: "m6_14", arabic: "ذِجُشَسُ", letters: ["jim", "seen", "sheen", "thal"], audioId: "m6_14", units: ["thal-kasra", "jim-damma", "sheen-fatha", "seen-damma"] },
        { id: "m7_01", arabic: "بَذَثِيصَ", letters: ["baa", "sad", "thaa", "thal"], audioId: "m7_01", units: ["baa-fatha", "thal-fatha", "thaa-madd-kasra", "sad-fatha"] },
        { id: "m7_02", arabic: "حُرَضُثَا", letters: ["dad", "haa", "reh", "thaa"], audioId: "m7_02", units: ["haa-damma", "reh-fatha", "dad-damma", "thaa-madd-fatha"] },
        { id: "m7_03", arabic: "خُصُ", letters: ["khaa", "sad"], audioId: "m7_03", units: ["khaa-damma", "sad-damma"] },
        { id: "m7_04", arabic: "أُثَدَضِ", letters: ["alif", "dad", "dal", "thaa"], audioId: "m7_04", units: ["alif-damma", "thaa-fatha", "dal-fatha", "dad-kasra"] },
        { id: "m7_05", arabic: "ضَذِصُ", letters: ["dad", "sad", "thal"], audioId: "m7_05", units: ["dad-fatha", "thal-kasra", "sad-damma"] },
        { id: "m7_06", arabic: "جَصُضُ", letters: ["dad", "jim", "sad"], audioId: "m7_06", units: ["jim-fatha", "sad-damma", "dad-damma"] },
        { id: "m7_07", arabic: "صَضِي", letters: ["dad", "sad"], audioId: "m7_07", units: ["sad-fatha", "dad-madd-kasra"] },
        { id: "m7_08", arabic: "ضَجُ", letters: ["dad", "jim"], audioId: "m7_08", units: ["dad-fatha", "jim-damma"] },
        { id: "m7_09", arabic: "ثِيصِ", letters: ["sad", "thaa"], audioId: "m7_09", units: ["thaa-madd-kasra", "sad-kasra"] },
        { id: "m7_10", arabic: "ضِزِسَصُ", letters: ["dad", "sad", "seen", "zain"], audioId: "m7_10", units: ["dad-kasra", "zain-kasra", "seen-fatha", "sad-damma"] },
        { id: "m7_11", arabic: "صَضِ", letters: ["dad", "sad"], audioId: "m7_11", units: ["sad-fatha", "dad-kasra"] },
        { id: "m7_12", arabic: "ضُسِيصَ", letters: ["dad", "sad", "seen"], audioId: "m7_12", units: ["dad-damma", "seen-madd-kasra", "sad-fatha"] },
        { id: "m7_13", arabic: "صِثِ", letters: ["sad", "thaa"], audioId: "m7_13", units: ["sad-kasra", "thaa-kasra"] },
        { id: "m7_14", arabic: "ضُصُدِ", letters: ["dad", "dal", "sad"], audioId: "m7_14", units: ["dad-damma", "sad-damma", "dal-kasra"] },
        { id: "m8_01", arabic: "أَطَارَ", letters: ["alif", "reh", "tah"], audioId: "m8_01", units: ["alif-fatha", "tah-madd-fatha", "reh-fatha"] },
        { id: "m8_02", arabic: "ظِطُ", letters: ["tah", "zah"], audioId: "m8_02", units: ["zah-kasra", "tah-damma"] },
        { id: "m8_03", arabic: "طُحَزَ", letters: ["haa", "tah", "zain"], audioId: "m8_03", units: ["tah-damma", "haa-fatha", "zain-fatha"] },
        { id: "m8_04", arabic: "ظَسُودَتُ", letters: ["dal", "seen", "taa", "zah"], audioId: "m8_04", units: ["zah-fatha", "seen-madd-damma", "dal-fatha", "taa-damma"] },
        { id: "m8_05", arabic: "طَظَ", letters: ["tah", "zah"], audioId: "m8_05", units: ["tah-fatha", "zah-fatha"] },
        { id: "m8_06", arabic: "دِرِيطَظِ", letters: ["dal", "reh", "tah", "zah"], audioId: "m8_06", units: ["dal-kasra", "reh-madd-kasra", "tah-fatha", "zah-kasra"] },
        { id: "m8_07", arabic: "طُظِ", letters: ["tah", "zah"], audioId: "m8_07", units: ["tah-damma", "zah-kasra"] },
        { id: "m8_08", arabic: "أَحُطَظَا", letters: ["alif", "haa", "tah", "zah"], audioId: "m8_08", units: ["alif-fatha", "haa-damma", "tah-fatha", "zah-madd-fatha"] },
        { id: "m8_09", arabic: "جَاطَ", letters: ["jim", "tah"], audioId: "m8_09", units: ["jim-madd-fatha", "tah-fatha"] },
        { id: "m8_10", arabic: "طِظَ", letters: ["tah", "zah"], audioId: "m8_10", units: ["tah-kasra", "zah-fatha"] },
        { id: "m8_11", arabic: "طُودِ", letters: ["dal", "tah"], audioId: "m8_11", units: ["tah-madd-damma", "dal-kasra"] },
        { id: "m8_12", arabic: "تُوظَ", letters: ["taa", "zah"], audioId: "m8_12", units: ["taa-madd-damma", "zah-fatha"] },
        { id: "m8_13", arabic: "طَسَظُتِ", letters: ["seen", "taa", "tah", "zah"], audioId: "m8_13", units: ["tah-fatha", "seen-fatha", "zah-damma", "taa-kasra"] },
        { id: "m8_14", arabic: "ظَجِي", letters: ["jim", "zah"], audioId: "m8_14", units: ["zah-fatha", "jim-madd-kasra"] },
        { id: "m9_01", arabic: "بَعُ", letters: ["ain", "baa"], audioId: "m9_01", units: ["baa-fatha", "ain-damma"] },
        { id: "m9_02", arabic: "غُزِي", letters: ["ghain", "zain"], audioId: "m9_02", units: ["ghain-damma", "zain-madd-kasra"] },
        { id: "m9_03", arabic: "غُعُ", letters: ["ain", "ghain"], audioId: "m9_03", units: ["ghain-damma", "ain-damma"] },
        { id: "m9_04", arabic: "رَغُذَشُ", letters: ["ghain", "reh", "sheen", "thal"], audioId: "m9_04", units: ["reh-fatha", "ghain-damma", "thal-fatha", "sheen-damma"] },
        { id: "m9_05", arabic: "إِظِيعِرَ", letters: ["ain", "alif", "reh", "zah"], audioId: "m9_05", units: ["alif-kasra", "zah-madd-kasra", "ain-kasra", "reh-fatha"] },
        { id: "m9_06", arabic: "أُوبَغِطِ", letters: ["alif", "baa", "ghain", "tah"], audioId: "m9_06", units: ["alif-madd-damma", "baa-fatha", "ghain-kasra", "tah-kasra"] },
        { id: "m9_07", arabic: "عُوغِحُ", letters: ["ain", "ghain", "haa"], audioId: "m9_07", units: ["ain-madd-damma", "ghain-kasra", "haa-damma"] },
        { id: "m9_08", arabic: "غَعَا", letters: ["ain", "ghain"], audioId: "m9_08", units: ["ghain-fatha", "ain-madd-fatha"] },
        { id: "m9_09", arabic: "عُغُو", letters: ["ain", "ghain"], audioId: "m9_09", units: ["ain-damma", "ghain-madd-damma"] },
        { id: "m9_10", arabic: "صَاطُغِ", letters: ["ghain", "sad", "tah"], audioId: "m9_10", units: ["sad-madd-fatha", "tah-damma", "ghain-kasra"] },
        { id: "m9_11", arabic: "شُزُثَاعُ", letters: ["ain", "sheen", "thaa", "zain"], audioId: "m9_11", units: ["sheen-damma", "zain-damma", "thaa-madd-fatha", "ain-damma"] },
        { id: "m9_12", arabic: "شُدَغِي", letters: ["dal", "ghain", "sheen"], audioId: "m9_12", units: ["sheen-damma", "dal-fatha", "ghain-madd-kasra"] },
        { id: "m9_13", arabic: "ذُغِعِ", letters: ["ain", "ghain", "thal"], audioId: "m9_13", units: ["thal-damma", "ghain-kasra", "ain-kasra"] },
        { id: "m9_14", arabic: "صِغَ", letters: ["ghain", "sad"], audioId: "m9_14", units: ["sad-kasra", "ghain-fatha"] },
        { id: "m10_01", arabic: "حِيفِطِ", letters: ["feh", "haa", "tah"], audioId: "m10_01", units: ["haa-madd-kasra", "feh-kasra", "tah-kasra"] },
        { id: "m10_02", arabic: "تَقِ", letters: ["qaf", "taa"], audioId: "m10_02", units: ["taa-fatha", "qaf-kasra"] },
        { id: "m10_03", arabic: "جُكَ", letters: ["jim", "kaf"], audioId: "m10_03", units: ["jim-damma", "kaf-fatha"] },
        { id: "m10_04", arabic: "فُصَزُكَا", letters: ["feh", "kaf", "sad", "zain"], audioId: "m10_04", units: ["feh-damma", "sad-fatha", "zain-damma", "kaf-madd-fatha"] },
        { id: "m10_05", arabic: "قَغُجُ", letters: ["ghain", "jim", "qaf"], audioId: "m10_05", units: ["qaf-fatha", "ghain-damma", "jim-damma"] },
        { id: "m10_06", arabic: "كُغِقِ", letters: ["ghain", "kaf", "qaf"], audioId: "m10_06", units: ["kaf-damma", "ghain-kasra", "qaf-kasra"] },
        { id: "m10_07", arabic: "صِحِفَتُ", letters: ["feh", "haa", "sad", "taa"], audioId: "m10_07", units: ["sad-kasra", "haa-kasra", "feh-fatha", "taa-damma"] },
        { id: "m10_08", arabic: "قَضِ", letters: ["dad", "qaf"], audioId: "m10_08", units: ["qaf-fatha", "dad-kasra"] },
        { id: "m10_09", arabic: "كُفِ", letters: ["feh", "kaf"], audioId: "m10_09", units: ["kaf-damma", "feh-kasra"] },
        { id: "m10_10", arabic: "كِفَ", letters: ["feh", "kaf"], audioId: "m10_10", units: ["kaf-kasra", "feh-fatha"] },
        { id: "m10_11", arabic: "فُقُو", letters: ["feh", "qaf"], audioId: "m10_11", units: ["feh-damma", "qaf-madd-damma"] },
        { id: "m10_12", arabic: "ظَكُو", letters: ["kaf", "zah"], audioId: "m10_12", units: ["zah-fatha", "kaf-madd-damma"] },
        { id: "m10_13", arabic: "فَحَ", letters: ["feh", "haa"], audioId: "m10_13", units: ["feh-fatha", "haa-fatha"] },
        { id: "m10_14", arabic: "بَقُسِخِي", letters: ["baa", "khaa", "qaf", "seen"], audioId: "m10_14", units: ["baa-fatha", "qaf-damma", "seen-kasra", "khaa-madd-kasra"] },
        { id: "m10_15", arabic: "كَصَ", letters: ["kaf", "sad"], audioId: "m10_15", units: ["kaf-fatha", "sad-fatha"] },
        { id: "m10_16", arabic: "دَافُضِ", letters: ["dad", "dal", "feh"], audioId: "m10_16", units: ["dal-madd-fatha", "feh-damma", "dad-kasra"] },
        { id: "m10_17", arabic: "كُقُذَسُ", letters: ["kaf", "qaf", "seen", "thal"], audioId: "m10_17", units: ["kaf-damma", "qaf-damma", "thal-fatha", "seen-damma"] },
        { id: "m10_18", arabic: "إِيكُ", letters: ["alif", "kaf"], audioId: "m10_18", units: ["alif-madd-kasra", "kaf-damma"] },
        { id: "m10_19", arabic: "زَثَقَافَ", letters: ["feh", "qaf", "thaa", "zain"], audioId: "m10_19", units: ["zain-fatha", "thaa-fatha", "qaf-madd-fatha", "feh-fatha"] },
        { id: "m10_20", arabic: "فُضِقُ", letters: ["dad", "feh", "qaf"], audioId: "m10_20", units: ["feh-damma", "dad-kasra", "qaf-damma"] },
        { id: "m10_21", arabic: "جُكُ", letters: ["jim", "kaf"], audioId: "m10_21", units: ["jim-damma", "kaf-damma"] },
        { id: "m11_01", arabic: "لَمِ", letters: ["lam", "meem"], audioId: "m11_01", units: ["lam-fatha", "meem-kasra"] },
        { id: "m11_02", arabic: "قَامَ", letters: ["meem", "qaf"], audioId: "m11_02", units: ["qaf-madd-fatha", "meem-fatha"] },
        { id: "m11_03", arabic: "نَلَ", letters: ["lam", "noon"], audioId: "m11_03", units: ["noon-fatha", "lam-fatha"] },
        { id: "m11_04", arabic: "لَغُومَ", letters: ["ghain", "lam", "meem"], audioId: "m11_04", units: ["lam-fatha", "ghain-madd-damma", "meem-fatha"] },
        { id: "m11_05", arabic: "نُذُعِيمُ", letters: ["ain", "meem", "noon", "thal"], audioId: "m11_05", units: ["noon-damma", "thal-damma", "ain-madd-kasra", "meem-damma"] },
        { id: "m11_06", arabic: "نَتُ", letters: ["noon", "taa"], audioId: "m11_06", units: ["noon-fatha", "taa-damma"] },
        { id: "m11_07", arabic: "لِقُو", letters: ["lam", "qaf"], audioId: "m11_07", units: ["lam-kasra", "qaf-madd-damma"] },
        { id: "m11_08", arabic: "سَمُ", letters: ["meem", "seen"], audioId: "m11_08", units: ["seen-fatha", "meem-damma"] },
        { id: "m11_09", arabic: "نِلَ", letters: ["lam", "noon"], audioId: "m11_09", units: ["noon-kasra", "lam-fatha"] },
        { id: "m11_10", arabic: "حِصُلَ", letters: ["haa", "lam", "sad"], audioId: "m11_10", units: ["haa-kasra", "sad-damma", "lam-fatha"] },
        { id: "m11_11", arabic: "أَمِي", letters: ["alif", "meem"], audioId: "m11_11", units: ["alif-fatha", "meem-madd-kasra"] },
        { id: "m11_12", arabic: "أُلَانَ", letters: ["alif", "lam", "noon"], audioId: "m11_12", units: ["alif-damma", "lam-madd-fatha", "noon-fatha"] },
        { id: "m11_13", arabic: "دَمَلِ", letters: ["dal", "lam", "meem"], audioId: "m11_13", units: ["dal-fatha", "meem-fatha", "lam-kasra"] },
        { id: "m11_14", arabic: "دُولُمُ", letters: ["dal", "lam", "meem"], audioId: "m11_14", units: ["dal-madd-damma", "lam-damma", "meem-damma"] },
        { id: "m11_15", arabic: "بَانُ", letters: ["baa", "noon"], audioId: "m11_15", units: ["baa-madd-fatha", "noon-damma"] },
        { id: "m11_16", arabic: "ضِلِ", letters: ["dad", "lam"], audioId: "m11_16", units: ["dad-kasra", "lam-kasra"] },
        { id: "m11_17", arabic: "أُمُرَثُ", letters: ["alif", "meem", "reh", "thaa"], audioId: "m11_17", units: ["alif-damma", "meem-damma", "reh-fatha", "thaa-damma"] },
        { id: "m11_18", arabic: "نَزَ", letters: ["noon", "zain"], audioId: "m11_18", units: ["noon-fatha", "zain-fatha"] },
        { id: "m11_19", arabic: "مِلُ", letters: ["lam", "meem"], audioId: "m11_19", units: ["meem-kasra", "lam-damma"] },
        { id: "m11_20", arabic: "قِمِ", letters: ["meem", "qaf"], audioId: "m11_20", units: ["qaf-kasra", "meem-kasra"] },
        { id: "m11_21", arabic: "مِنِ", letters: ["meem", "noon"], audioId: "m11_21", units: ["meem-kasra", "noon-kasra"] },
        { id: "m12_01", arabic: "وِهَ", letters: ["heh", "waw"], audioId: "m12_01", units: ["waw-kasra", "heh-fatha"] },
        { id: "m12_02", arabic: "قَوَخَا", letters: ["khaa", "qaf", "waw"], audioId: "m12_02", units: ["qaf-fatha", "waw-fatha", "khaa-madd-fatha"] },
        { id: "m12_03", arabic: "أُيِمِهُ", letters: ["alif", "heh", "meem", "yeh"], audioId: "m12_03", units: ["alif-damma", "yeh-kasra", "meem-kasra", "heh-damma"] },
        { id: "m12_04", arabic: "هَرِ", letters: ["heh", "reh"], audioId: "m12_04", units: ["heh-fatha", "reh-kasra"] },
        { id: "m12_05", arabic: "تَظِوَ", letters: ["taa", "waw", "zah"], audioId: "m12_05", units: ["taa-fatha", "zah-kasra", "waw-fatha"] },
        { id: "m12_06", arabic: "يُصُ", letters: ["sad", "yeh"], audioId: "m12_06", units: ["yeh-damma", "sad-damma"] },
        { id: "m12_07", arabic: "طُهُو", letters: ["heh", "tah"], audioId: "m12_07", units: ["tah-damma", "heh-madd-damma"] },
        { id: "m12_08", arabic: "يَوِكُو", letters: ["kaf", "waw", "yeh"], audioId: "m12_08", units: ["yeh-fatha", "waw-kasra", "kaf-madd-damma"] },
        { id: "m12_09", arabic: "ثِيَاهَوِ", letters: ["heh", "thaa", "waw", "yeh"], audioId: "m12_09", units: ["thaa-kasra", "yeh-madd-fatha", "heh-fatha", "waw-kasra"] },
        { id: "m12_10", arabic: "هِوُ", letters: ["heh", "waw"], audioId: "m12_10", units: ["heh-kasra", "waw-damma"] },
        { id: "m12_11", arabic: "وِيرَغُ", letters: ["ghain", "reh", "waw"], audioId: "m12_11", units: ["waw-madd-kasra", "reh-fatha", "ghain-damma"] },
        { id: "m12_12", arabic: "ظُويِ", letters: ["yeh", "zah"], audioId: "m12_12", units: ["zah-madd-damma", "yeh-kasra"] },
        { id: "m12_13", arabic: "هُذُ", letters: ["heh", "thal"], audioId: "m12_13", units: ["heh-damma", "thal-damma"] },
        { id: "m12_14", arabic: "قَوَمِ", letters: ["meem", "qaf", "waw"], audioId: "m12_14", units: ["qaf-fatha", "waw-fatha", "meem-kasra"] },
        { id: "m12_15", arabic: "يُوُ", letters: ["waw", "yeh"], audioId: "m12_15", units: ["yeh-damma", "waw-damma"] },
        { id: "m12_16", arabic: "يَاذَهِسِ", letters: ["heh", "seen", "thal", "yeh"], audioId: "m12_16", units: ["yeh-madd-fatha", "thal-fatha", "heh-kasra", "seen-kasra"] },
        { id: "m12_17", arabic: "نُزِيوِ", letters: ["noon", "waw", "zain"], audioId: "m12_17", units: ["noon-damma", "zain-madd-kasra", "waw-kasra"] },
        { id: "m12_18", arabic: "يَاعِزُ", letters: ["ain", "yeh", "zain"], audioId: "m12_18", units: ["yeh-madd-fatha", "ain-kasra", "zain-damma"] },
        { id: "m12_19", arabic: "زِدُطَهُو", letters: ["dal", "heh", "tah", "zain"], audioId: "m12_19", units: ["zain-kasra", "dal-damma", "tah-fatha", "heh-madd-damma"] },
        { id: "m12_20", arabic: "وُيُ", letters: ["waw", "yeh"], audioId: "m12_20", units: ["waw-damma", "yeh-damma"] },
        { id: "m12_21", arabic: "يِقُو", letters: ["qaf", "yeh"], audioId: "m12_21", units: ["yeh-kasra", "qaf-madd-damma"] }
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
              minModule: wordMinModule(w), units: w.units
            };
          });
        }
        return eligible(WORDS, "words").concat(eligible(PSEUDO_WORDS, "pseudowords"));
      }

      // Texte affiche pour chaque unite son (lettre + harakat/prolongation),
      // utilise pour reconstruire des variantes proches d'un mot a des fins
      // de distracteurs (jamais pour l'audio : seule la bonne reponse est
      // jouee, les propositions ne sont que du texte). Couvre uniquement
      // les formes reellement utilisees par WORDS/PSEUDO_WORDS (harakat +
      // prolongations, jamais le tanwin, reserve au jeu de sons).
      var UNIT_TEXT = {
        "ain-damma": "عُ", "ain-fatha": "عَ", "ain-kasra": "عِ",
        "ain-madd-damma": "عُو", "ain-madd-fatha": "عَا", "ain-madd-kasra": "عِي",
        "alif-damma": "أُ", "alif-fatha": "أَ", "alif-kasra": "إِ",
        "alif-madd-damma": "أُو", "alif-madd-fatha": "آ", "alif-madd-kasra": "إِي",
        "baa-damma": "بُ", "baa-fatha": "بَ", "baa-kasra": "بِ",
        "baa-madd-damma": "بُو", "baa-madd-fatha": "بَا", "baa-madd-kasra": "بِي",
        "dad-damma": "ضُ", "dad-fatha": "ضَ", "dad-kasra": "ضِ",
        "dad-madd-damma": "ضُو", "dad-madd-fatha": "ضَا", "dad-madd-kasra": "ضِي",
        "dal-damma": "دُ", "dal-fatha": "دَ", "dal-kasra": "دِ",
        "dal-madd-damma": "دُو", "dal-madd-fatha": "دَا", "dal-madd-kasra": "دِي",
        "feh-damma": "فُ", "feh-fatha": "فَ", "feh-kasra": "فِ",
        "feh-madd-damma": "فُو", "feh-madd-fatha": "فَا", "feh-madd-kasra": "فِي",
        "ghain-damma": "غُ", "ghain-fatha": "غَ", "ghain-kasra": "غِ",
        "ghain-madd-damma": "غُو", "ghain-madd-fatha": "غَا", "ghain-madd-kasra": "غِي",
        "haa-damma": "حُ", "haa-fatha": "حَ", "haa-kasra": "حِ",
        "haa-madd-damma": "حُو", "haa-madd-fatha": "حَا", "haa-madd-kasra": "حِي",
        "heh-damma": "هُ", "heh-fatha": "هَ", "heh-kasra": "هِ",
        "heh-madd-damma": "هُو", "heh-madd-fatha": "هَا", "heh-madd-kasra": "هِي",
        "jim-damma": "جُ", "jim-fatha": "جَ", "jim-kasra": "جِ",
        "jim-madd-damma": "جُو", "jim-madd-fatha": "جَا", "jim-madd-kasra": "جِي",
        "kaf-damma": "كُ", "kaf-fatha": "كَ", "kaf-kasra": "كِ",
        "kaf-madd-damma": "كُو", "kaf-madd-fatha": "كَا", "kaf-madd-kasra": "كِي",
        "khaa-damma": "خُ", "khaa-fatha": "خَ", "khaa-kasra": "خِ",
        "khaa-madd-damma": "خُو", "khaa-madd-fatha": "خَا", "khaa-madd-kasra": "خِي",
        "lam-damma": "لُ", "lam-fatha": "لَ", "lam-kasra": "لِ",
        "lam-madd-damma": "لُو", "lam-madd-fatha": "لَا", "lam-madd-kasra": "لِي",
        "meem-damma": "مُ", "meem-fatha": "مَ", "meem-kasra": "مِ",
        "meem-madd-damma": "مُو", "meem-madd-fatha": "مَا", "meem-madd-kasra": "مِي",
        "noon-damma": "نُ", "noon-fatha": "نَ", "noon-kasra": "نِ",
        "noon-madd-damma": "نُو", "noon-madd-fatha": "نَا", "noon-madd-kasra": "نِي",
        "qaf-damma": "قُ", "qaf-fatha": "قَ", "qaf-kasra": "قِ",
        "qaf-madd-damma": "قُو", "qaf-madd-fatha": "قَا", "qaf-madd-kasra": "قِي",
        "reh-damma": "رُ", "reh-fatha": "رَ", "reh-kasra": "رِ",
        "reh-madd-damma": "رُو", "reh-madd-fatha": "رَا", "reh-madd-kasra": "رِي",
        "sad-damma": "صُ", "sad-fatha": "صَ", "sad-kasra": "صِ",
        "sad-madd-damma": "صُو", "sad-madd-fatha": "صَا", "sad-madd-kasra": "صِي",
        "seen-damma": "سُ", "seen-fatha": "سَ", "seen-kasra": "سِ",
        "seen-madd-damma": "سُو", "seen-madd-fatha": "سَا", "seen-madd-kasra": "سِي",
        "sheen-damma": "شُ", "sheen-fatha": "شَ", "sheen-kasra": "شِ",
        "sheen-madd-damma": "شُو", "sheen-madd-fatha": "شَا", "sheen-madd-kasra": "شِي",
        "taa-damma": "تُ", "taa-fatha": "تَ", "taa-kasra": "تِ",
        "taa-madd-damma": "تُو", "taa-madd-fatha": "تَا", "taa-madd-kasra": "تِي",
        "tah-damma": "طُ", "tah-fatha": "طَ", "tah-kasra": "طِ",
        "tah-madd-damma": "طُو", "tah-madd-fatha": "طَا", "tah-madd-kasra": "طِي",
        "thaa-damma": "ثُ", "thaa-fatha": "ثَ", "thaa-kasra": "ثِ",
        "thaa-madd-damma": "ثُو", "thaa-madd-fatha": "ثَا", "thaa-madd-kasra": "ثِي",
        "thal-damma": "ذُ", "thal-fatha": "ذَ", "thal-kasra": "ذِ",
        "thal-madd-damma": "ذُو", "thal-madd-fatha": "ذَا", "thal-madd-kasra": "ذِي",
        "waw-damma": "وُ", "waw-fatha": "وَ", "waw-kasra": "وِ",
        "waw-madd-damma": "وُو", "waw-madd-fatha": "وَا", "waw-madd-kasra": "وِي",
        "yeh-damma": "يُ", "yeh-fatha": "يَ", "yeh-kasra": "يِ",
        "yeh-madd-damma": "يُو", "yeh-madd-fatha": "يَا", "yeh-madd-kasra": "يِي",
        "zah-damma": "ظُ", "zah-fatha": "ظَ", "zah-kasra": "ظِ",
        "zah-madd-damma": "ظُو", "zah-madd-fatha": "ظَا", "zah-madd-kasra": "ظِي",
        "zain-damma": "زُ", "zain-fatha": "زَ", "zain-kasra": "زِ",
        "zain-madd-damma": "زُو", "zain-madd-fatha": "زَا", "zain-madd-kasra": "زِي"
      };

      // Lettres pouvant etre confondues a l'oreille (choix pedagogique,
      // ajustable) : utilisees pour fabriquer des distracteurs "piege" en
      // substituant une seule lettre du mot entendu par une lettre proche.
      var CONFUSABLE_LETTERS = {
        alif: ["ain"], baa: ["meem", "waw"], taa: ["thaa", "tah"],
        thaa: ["taa", "seen"], jim: ["sheen"], haa: ["khaa", "heh"],
        khaa: ["haa", "ghain"], dal: ["thal", "dad"], thal: ["dal", "zah", "zain"],
        reh: ["lam"], zain: ["thal", "zah"], seen: ["sad", "thaa"],
        sheen: ["jim", "seen"], sad: ["seen", "dad"], dad: ["dal", "zah", "tah"],
        tah: ["taa", "dad"], zah: ["thal", "dad", "zain"], ain: ["ghain", "haa", "alif"],
        ghain: ["khaa", "ain"], feh: [], qaf: ["kaf"], kaf: ["qaf"],
        lam: ["noon", "reh"], meem: ["noon", "baa"], noon: ["meem", "lam"],
        heh: ["haa"], waw: ["baa"], yeh: []
      };

      function unitLetter(unitId) { return unitId.split("-")[0]; }
      function unitForm(unitId) { return unitId.slice(unitLetter(unitId).length + 1); }
      var OPEN_FORMS = ["fatha", "damma", "kasra"];

      function unitsToArabic(units) {
        return units.map(function (u) { return UNIT_TEXT[u]; }).join("");
      }

      // Genere des variantes "proches" d'une sequence d'unites, en
      // appliquant un seul type de transformation a la fois (voyelle
      // changee, prolongation ajoutee/retiree, ordre inverse, lettre
      // confondue) : c'est ce qui rend chaque distracteur un vrai piege
      // phonetique plutot qu'un mot au hasard.
      function generateCloseVariants(units, cumSet) {
        var variants = [];

        function addVariant(newUnits) {
          variants.push(newUnits);
        }

        // 1) Une voyelle differente sur une unite (fatha/damma/kasra).
        units.forEach(function (u, i) {
          var letter = unitLetter(u), form = unitForm(u);
          if (OPEN_FORMS.indexOf(form) === -1) return;
          OPEN_FORMS.forEach(function (alt) {
            if (alt === form) return;
            var copy = units.slice();
            copy[i] = letter + "-" + alt;
            addVariant(copy);
          });
        });

        // 2) Prolongation ajoutee ou retiree sur une unite.
        units.forEach(function (u, i) {
          var letter = unitLetter(u), form = unitForm(u);
          var copy = units.slice();
          if (OPEN_FORMS.indexOf(form) !== -1) {
            copy[i] = letter + "-madd-" + form;
            addVariant(copy);
          } else if (form.indexOf("madd-") === 0) {
            copy[i] = letter + "-" + form.slice(5);
            addVariant(copy);
          }
        });

        // 3) Ordre des unites inverse (deux a deux, et inversion complete).
        if (units.length >= 2) {
          for (var i = 0; i < units.length; i++) {
            for (var j = i + 1; j < units.length; j++) {
              var swapped = units.slice();
              var tmp = swapped[i]; swapped[i] = swapped[j]; swapped[j] = tmp;
              addVariant(swapped);
            }
          }
          addVariant(units.slice().reverse());
        }

        // 4) Une seule lettre remplacee par une lettre proche a l'oreille,
        // en gardant la meme voyelle/prolongation, et seulement si cette
        // lettre est deja apprise dans le module en cours.
        units.forEach(function (u, i) {
          var letter = unitLetter(u), form = unitForm(u);
          (CONFUSABLE_LETTERS[letter] || []).forEach(function (alt) {
            if (!cumSet[alt]) return;
            var altUnit = alt + "-" + form;
            if (!UNIT_TEXT[altUnit]) return;
            var copy = units.slice();
            copy[i] = altUnit;
            addVariant(copy);
          });
        });

        return variants;
      }

      // Construit les 4 propositions d'une question "mot" : la bonne
      // reponse, au moins deux distracteurs phonetiquement proches (pour
      // empecher de deviner sans ecouter), et le reste en distracteurs plus
      // eloignes tires du pool habituel. Les distracteurs proches ne
      // portent jamais d'audio : seule la bonne reponse est ecoutee, les
      // propositions ne servent qu'a l'affichage (texte).
      function buildWordChoices(correct, pool, moduleNumber, answerCount) {
        var cumSet = {};
        cumulativeLetterIds(moduleNumber).forEach(function (id) { cumSet[id] = true; });

        var seenArabic = {};
        seenArabic[correct.arabic] = true;

        var closeCandidates = [];
        if (correct.units) {
          var rawVariants = generateCloseVariants(correct.units, cumSet);
          shuffle(rawVariants).forEach(function (variantUnits) {
            var allKnown = variantUnits.every(function (u) { return cumSet[unitLetter(u)]; });
            if (!allKnown) return;
            var arabic = unitsToArabic(variantUnits);
            if (seenArabic[arabic]) return;
            seenArabic[arabic] = true;
            closeCandidates.push({ kind: "word", key: "d:" + variantUnits.join("-"), arabic: arabic });
          });
        }

        var neededClose = Math.min(2, answerCount - 1);
        var closeChoices = closeCandidates.slice(0, Math.max(neededClose, Math.min(closeCandidates.length, answerCount - 2)));

        var chosenKeys = {};
        chosenKeys[correct.key] = true;
        closeChoices.forEach(function (c) { chosenKeys[c.key] = true; });

        var farPoolChoices = shuffle(pool.filter(function (item) {
          return !chosenKeys[item.key] && !seenArabic[item.arabic];
        }));

        var choices = [correct].concat(closeChoices);
        var idx = 0;
        while (choices.length < answerCount && idx < farPoolChoices.length) {
          choices.push(farPoolChoices[idx]);
          seenArabic[farPoolChoices[idx].arabic] = true;
          idx += 1;
        }

        return shuffle(choices);
      }

      // Meme principe que buildWordChoices, applique au jeu de sons : les
      // distracteurs "proches" sont soit la MEME lettre dans une AUTRE
      // forme (fatha/damma/kasra/prolongation/tanwin - teste l'oreille sur
      // la voyelle), soit une lettre CONFONDUE dans la MEME forme (teste
      // l'oreille sur la consonne). Contrairement aux mots, chaque
      // combinaison lettre+forme est un vrai enregistrement individuel
      // deja present dans le pool : pas besoin de rien synthetiser, on
      // selectionne simplement les bonnes entrees existantes. On vise un
      // bon melange (environ la moitie des propositions proches, le reste
      // pioche dans tout le module) pour continuer a exposer l'enfant a
      // des lettres tres differentes, pas seulement aux variantes de la
      // lettre entendue.
      function buildSoundChoices(correct, pool, answerCount) {
        var correctLetter = unitLetter(correct.key);
        var correctForm = unitForm(correct.key);
        var confusables = CONFUSABLE_LETTERS[correctLetter] || [];

        var closeCandidates = shuffle(pool.filter(function (item) {
          if (item.key === correct.key) return false;
          var letter = unitLetter(item.key), form = unitForm(item.key);
          if (letter === correctLetter) return true;
          return confusables.indexOf(letter) !== -1 && form === correctForm;
        }));

        var closeKeys = {};
        closeCandidates.forEach(function (c) { closeKeys[c.key] = true; });
        var farCandidates = shuffle(pool.filter(function (item) {
          return item.key !== correct.key && !closeKeys[item.key];
        }));

        var targetClose = Math.min(Math.ceil((answerCount - 1) / 2), closeCandidates.length);
        var choices = [correct].concat(closeCandidates.slice(0, targetClose));

        // Complete d'abord avec des distracteurs "eloignes" (lettres tres
        // differentes) ; si ce bassin est trop petit (modules avec peu de
        // lettres, ex. Module 1 ou tout est la meme lettre), on complete
        // avec le reste des candidats proches plutot que d'afficher moins
        // de propositions que prevu.
        var i = 0;
        while (choices.length < answerCount && i < farCandidates.length) {
          choices.push(farCandidates[i]); i += 1;
        }
        var j = targetClose;
        while (choices.length < answerCount && j < closeCandidates.length) {
          choices.push(closeCandidates[j]); j += 1;
        }

        return shuffle(choices);
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

        // Les distracteurs sont construits a partir de la bonne reponse
        // elle-meme (voyelle changee, ordre inverse, lettre confondue...)
        // pour empecher de deviner sans ecouter - pour les mots comme pour
        // les sons.
        var choices = gameState.category === "word"
          ? buildWordChoices(correct, pool, gameState.moduleNumber, answerCount)
          : buildSoundChoices(correct, pool, answerCount);
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
