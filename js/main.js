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
  // Uniquement present sur les pages qui ont une galerie (l'accueil) ;
  // sur les autres pages, ce bloc ne s'active pas du tout.
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
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

    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      lightboxImg.src = "";
    };

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

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

  // ---- Letter lab + donnees pedagogiques partagees (lettres, modules) ----
  // Ce bloc regroupe aussi bien le labo de lettres (accueil et page
  // Modules) que les jeux (page Jeux, imbriques plus bas) : les deux
  // s'appuient sur les memes donnees (MODULES, ALL_LETTERS_BY_ID...).
  // Il doit donc s'activer des qu'au moins un des trois declencheurs est
  // present sur la page, sinon aucune des trois pages ne fonctionnerait.
  var letterLabBtns = document.querySelectorAll(".js-open-letterlab");
  var moduleLabBtns = document.querySelectorAll(".js-open-module");
  var pageHasGameBtns = document.querySelectorAll(".js-open-game").length;
  // La page Dictee (dictee.html) n'a aucun de ces trois declencheurs mais a
  // quand meme besoin de ce bloc (DICTEE_LEVELS, ALL_LETTERS_BY_ID, la
  // logique de jeu plus bas) : sans ce dernier test, elle serait ignoree.
  if (letterLabBtns.length || moduleLabBtns.length || pageHasGameBtns || document.getElementById("gameModal")) {
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
    // Deuxieme carte ajoutee ensuite : la meme lettre isolee (sans "بَ"),
    // avec son propre enregistrement - vient completer, pas remplacer.
    // L'alif n'a pas d'enregistrement isole (il ne prend pas reellement
    // de sukun/shadda en arabe - deja exclu de la section modules pour
    // cette raison), donc pas de deuxieme carte pour lui.
    function buildLetterF4(id, char, name) {
      var sukunForms = [["بَ" + char + "ْ", id + "-sukun", 3]];
      var shaddaForms = [["بَ" + char + "ّ" + "َ", id + "-shadda", 3]];
      if (id !== "alif") {
        sukunForms.push([char + "ْ", id + "-sukun-iso", 1]);
        shaddaForms.push([char + "ّ" + "َ", id + "-shadda-iso", 1]);
      }
      return { id: id, char: char, name: name, sukun: sukunForms, shadda: shaddaForms };
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

    // Index par id (comme ALL_LETTERS_BY_ID) pour retrouver rapidement les
    // formes sukun/shadda d'une lettre donnee, utilise par l'integration
    // dans les modules ci-dessous.
    var LETTERS_F4_BY_ID = {};
    LETTERS_F4.forEach(function (l) { LETTERS_F4_BY_ID[l.id] = l; });

    // Jeu "Dictee - Niveau 1" : contenu retranscrit a la main depuis le
    // cahier de dictee manuscrit fourni (5 pages), lettre par lettre dans
    // l'ordre du cahier, et recoupe avec les 28 enregistrements audio
    // d'origine (un seul fichier par lettre, qui dicte toute la ligne).
    // Quelques mots sont restes incertains malgre ce recoupement (ecriture
    // manuscrite ambigue) : marques ci-dessous par "verifier". Les mots
    // entierement rayes/noircis dans le cahier (ratures reelles, pas une
    // limite de lecture) ne sont volontairement pas repris - impossible de
    // les lire sans deviner.
    var DICTEE_LEVEL_1_ENTRIES = [
      // Ordre confirme par l'utilisateur a l'ecoute de l'audio complet
      // (le premier passage l'avait mal transcrit, coupe court par erreur) :
      // fatha, puis madd-damma, puis tanwin-damma, puis kasra, puis
      // madd-fatha - chaque son repete deux fois dans l'audio.
      { id: "alif", items: ["أَ", "أُو", "أٌ", "إِ", "آ"] },
      // Ordre confirme par l'utilisateur a l'ecoute : tanwin-fatha,
      // madd-kasra, damma, tanwin-kasra, fatha, puis le mot combine
      // "أَبًا" (alif-fatha + baa-tanwin-fatha).
      { id: "baa", items: ["بًا", "بِي", "بُ", "بٍ", "بَ", "أَبًا"] },
      // Ordre confirme par l'utilisateur : madd-fatha, tanwin-kasra,
      // tanwin-fatha, madd-damma, madd-kasra, puis deux mots combines
      // "بَاتَا" et "أَبَتَ".
      { id: "taa", items: ["تَا", "تٍ", "تًا", "تُو", "تِي", "بَاتَا", "أَبَتَ", "بَابَا", "تَبَا"] },
      // Ordre confirme par l'utilisateur : madd-damma, madd-kasra,
      // tanwin-damma, tanwin-kasra, madd-fatha, puis 5 mots combines
      // (les 2 derniers reutilisent "ت", en revision).
      { id: "thaa", items: ["ثُو", "ثِي", "ثٌ", "ثٍ", "ثَا", "أَثَا", "تَابَ", "ثَبَتَ", "أَثَاثًا", "تَابَا"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, madd-damma,
      // tanwin-kasra, damma, madd-kasra, puis 4 mots combines.
      { id: "jim", items: ["جًا", "جُو", "جٍ", "جُ", "جِي", "أَجَابَ", "بَجَا", "تَجَا", "أَجَبَ"] },
      // Ordre confirme par l'utilisateur : madd-fatha, madd-damma,
      // tanwin-kasra, tanwin-damma, tanwin-fatha, puis 3 mots combines
      // (sans chadda sur "أَحَبَ", confirme explicitement).
      { id: "haa", items: ["حَا", "حُو", "حٍ", "حٌ", "حًا", "أَحَبَ", "حَبَا", "بَحَثَ"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, tanwin-damma,
      // fatha, madd-kasra, puis 3 mots combines ("أَثَبَ" sans allongement,
      // confirme explicitement).
      { id: "khaa", items: ["خًا", "خٌ", "خَ", "خِي", "خَبَثَ", "أَثَبَ", "خَابَ"] },
      // Ordre confirme par l'utilisateur : fatha, damma, tanwin-kasra,
      // madd-fatha, puis 4 mots combines.
      { id: "dal", items: ["دَ", "دُ", "دٍ", "دَا", "أَجَدَ", "أَحَدًا", "حَدَثَ", "بَدَأَ"] },
      // Ordre confirme par l'utilisateur : madd-kasra, madd-fatha,
      // madd-damma, tanwin-fatha, fatha, puis 4 mots combines (sans
      // chadda sur les 2 derniers, confirme explicitement - "أَدَبَ" avec
      // dal vs "أَذَبَ" avec thal, paire minimale).
      { id: "thal", items: ["ذِي", "ذَا", "ذُو", "ذًا", "ذَ", "أَخَذَ", "ذَبَحَ", "أَدَبَ", "أَذَبَ"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, tanwin-damma,
      // tanwin-kasra, fatha, puis 3 mots combines.
      { id: "reh", items: ["رًا", "رٌ", "رٍ", "رَ", "حَذَرَ", "حَرَبَ", "جَرَحَ"] },
      // Ordre confirme par l'utilisateur : madd-fatha, kasra, tanwin-damma,
      // tanwin-kasra, tanwin-fatha, puis 3 mots combines ("حَزَزَ" sans
      // chadda, confirme explicitement - 3 lettres distinctes, pas de
      // doublement).
      { id: "zain", items: ["زَا", "زِ", "زٌ", "زٍ", "زًا", "حَزَزَ", "أَزَبَ", "بَذَرَ"] },
      // Ordre confirme par l'utilisateur : madd-fatha, tanwin-kasra,
      // tanwin-fatha, madd-damma, damma, puis 3 mots combines ("أَسَسَ"
      // sans chadda, confirme explicitement).
      { id: "seen", items: ["سَا", "سٍ", "سًا", "سُو", "سُ", "أَسَسَ", "سَحَبَ", "أَسَاسًا"] },
      // Ordre confirme par l'utilisateur : madd-kasra, tanwin-kasra,
      // fatha, madd-damma, puis 3 mots combines ("بَشَرَ" sans chadda,
      // confirme explicitement).
      { id: "sheen", items: ["شِي", "شٍ", "شَ", "شُو", "حَشَرَ", "بَشَرَ", "شَارَبَ"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, tanwin-damma,
      // kasra, madd-fatha, puis 3 mots combines.
      { id: "sad", items: ["صًا", "صٌ", "صِ", "صَا", "صَادَ", "أَصَابَ", "حَصَدَ"] },
      // Ordre confirme par l'utilisateur : madd-damma, madd-kasra,
      // madd-fatha, fatha, puis 3 mots combines (voyelles confirmees
      // explicitement une par une).
      { id: "dad", items: ["ضُو", "ضِي", "ضَا", "ضَ", "بَصَرَ", "أَضَبَ", "حَضَرَ"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, madd-fatha,
      // damma, madd-damma, tanwin-kasra, puis 3 mots combines ("طَابَ"
      // sans lam, confirme explicitement).
      { id: "tah", items: ["طًا", "طَا", "طُ", "طُو", "طٍ", "بَسَطَ", "حَطَبَ", "طَابَ"] },
      // Ordre confirme par l'utilisateur : madd-damma, madd-fatha,
      // tanwin-kasra, damma, madd-kasra, puis 2 mots combines.
      { id: "zah", items: ["ظُو", "ظَا", "ظٍ", "ظُ", "ظِي", "حَظَرَ", "بَظَرَ"] },
      // Ordre confirme par l'utilisateur : fatha, tanwin-fatha, madd-fatha,
      // tanwin-damma, madd-damma, puis 4 mots combines ("بَضَعَ" 3 fatha,
      // sans soukoune sur le dad, confirme explicitement - pas "بِضْعَ").
      { id: "ain", items: ["عَ", "عًا", "عَا", "عٌ", "عُو", "جَاعَ", "بَعَثَ", "بَضَعَ", "عَجَبَ"] },
      // Ordre confirme par l'utilisateur : tanwin-kasra, madd-fatha,
      // kasra, madd-damma, damma, puis 3 mots combines ("غَاضَبَ" avec
      // fatha sur le dad, corrige apres une 1ere reponse kasra).
      { id: "ghain", items: ["غٍ", "غَا", "غِ", "غُو", "غُ", "غَابَ", "غَاضَبَ", "جَغَبَ"] },
      // Ordre confirme par l'utilisateur : tanwin-damma, tanwin-kasra,
      // tanwin-fatha, madd-damma, puis 3 mots combines.
      { id: "feh", items: ["فٌ", "فٍ", "فًا", "فُو", "حَفَرَ", "فَتَحَ", "غَفَرَ"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, tanwin-damma,
      // tanwin-kasra, madd-fatha, puis 3 mots combines ("أَقَعَ" avec
      // alif, confirme explicitement - pas "وَقَعَ").
      { id: "qaf", items: ["قًا", "قٌ", "قٍ", "قَا", "حَقَبَ", "بَقَرَ", "أَقَعَ"] },
      // Ordre confirme par l'utilisateur : madd-kasra, tanwin-damma,
      // tanwin-kasra, tanwin-fatha, puis 3 mots combines ("كَعَبَ" avec
      // fatha sur le ain, sans soukoune, corrige apres 1ere reponse).
      { id: "kaf", items: ["كِي", "كٌ", "كٍ", "كًا", "كَتَبَ", "كَعَبَ", "تَرَكَ"] },
      // Ordre confirme par l'utilisateur : tanwin-damma, tanwin-kasra,
      // madd-kasra, madd-fatha, puis 3 mots combines.
      { id: "lam", items: ["لٌ", "لٍ", "لِي", "لَا", "قَتَلَ", "بَلَعَ", "جَلَسَ"] },
      // Ordre confirme par l'utilisateur : tanwin-fatha, tanwin-kasra,
      // damma, tanwin-damma, madd-damma, puis 4 verbes (pas des noms en
      // taa marbouta, confirme explicitement apres verification).
      { id: "meem", items: ["مًا", "مٍ", "مُ", "مٌ", "مُو", "مَلَكَ", "حَكَمَ", "جَمَعَ", "جَامَعَ"] },
      // Ordre confirme par l'utilisateur : madd-kasra, tanwin-fatha,
      // madd-damma, fatha, tanwin-kasra, puis 3 mots combines.
      { id: "noon", items: ["نِي", "نًا", "نُو", "نَ", "نٍ", "أَنَارَ", "جَنَحَ", "حَسُنَ"] },
      // Ordre confirme par l'utilisateur : madd-fatha, damma, tanwin-kasra,
      // tanwin-fatha, madd-damma, puis 3 mots combines ("جَهَدَ" verbe,
      // pas le nom "جُهْد").
      { id: "heh", items: ["هَا", "هُ", "هٍ", "هًا", "هُو", "هَجَمَ", "هَاجَمَ", "جَهَدَ"] },
      // Ordre confirme par l'utilisateur : fatha, damma, kasra,
      // tanwin-fatha, puis 3 mots combines.
      { id: "waw", items: ["وَ", "وُ", "وِ", "وًا", "جَاوَبَ", "وَجَدَهَا", "جَوَزَ"] },
      // Ordre confirme par l'utilisateur : tanwin-damma, madd-fatha,
      // tanwin-fatha, fatha, kasra, puis 3 mots combines (sans chadda sur
      // "يَسَرَ", fatha - pas soukoune - sur "بَيَنَ", confirmes
      // explicitement).
      { id: "yeh", items: ["يٌ", "يَا", "يًا", "يَ", "يِ", "يَسَرَ", "حَيَا", "بَيَنَ"] }
    ];

    // Niveau 2 : meme principe que le niveau 1 (un enregistrement par
    // lettre, dans l'ordre des 28 lettres), mais contenu different -
    // reste a transcrire/valider avec l'utilisateur comme pour le niveau 1
    // (audios deja en place, "items" vides en attendant sa correction).
    var DICTEE_LEVEL_2_ENTRIES = [
      // Ordre confirme par l'utilisateur : tanwin-damma, tanwin-kasra,
      // kasra, madd-fatha.
      { id: "alif", items: ["أٌ", "إٍ", "إِ", "آ"] },
      // Ordre confirme par l'utilisateur : "بَاتَ" simple (une seule
      // elongation, confirme explicitement - pas "بَاتَا").
      { id: "baa", items: ["بَابًا", "بَاتَ", "أَبَتِ"] }, { id: "taa", items: [] },
      // Ordre confirme par l'utilisateur : 2 mots combines.
      { id: "thaa", items: ["أَثَاثًا", "ثَابَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines ("أُجَابَ" avec
      // alif, confirme explicitement - pas "وُجَابَ").
      { id: "jim", items: ["جَابَ", "أُجَابَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines ("حُثِثَ" sans
      // chadda, 3 lettres distinctes, confirme explicitement).
      { id: "haa", items: ["بَاحَ", "حُثِثَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines.
      { id: "khaa", items: ["خَبُثَ", "خَابَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines.
      { id: "dal", items: ["دُجِبَ", "دَأَبَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines (formes passives
      // des verbes actifs deja vus au niveau 1 : أَخَذَ/ذَبَحَ).
      { id: "thal", items: ["أُخِذَ", "ذُبِحَ"] },
      // Ordre confirme par l'utilisateur (apres correction : ces mots
      // etaient d'abord attribues par erreur a "jim") : 2 mots combines.
      { id: "reh", items: ["جُرِحَ", "رَحُبَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines.
      { id: "zain", items: ["زَادَ", "بَرُزَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines (meme racine,
      // voyelles differentes).
      { id: "seen", items: ["حَسُبَ", "حَسِبَ"] },
      // Ordre confirme par l'utilisateur : 3 mots combines chacun.
      { id: "sheen", items: ["شُجِرَ", "شُرِبَ", "بَشُرَ"] },
      { id: "sad", items: ["صُبِرَ", "صُجِرَ", "صَبُحَ"] },
      // Ordre confirme par l'utilisateur : 3 mots combines.
      { id: "dad", items: ["ضَاجَ", "ضُرِبَ", "ضَجِرَ"] },
      // Ordre confirme par l'utilisateur : 5 mots combines ("بَطَحَا"
      // corrige apres une 1ere lecture "بَطَا", "طُوبَا" avec alif normal
      // (pas alif maqsura) confirme explicitement, "حُطِبَ" avec ha
      // confirme explicitement, "طَبَخَ" clarifie apres une 1ere
      // transcription erronee "babakha").
      { id: "tah", items: ["بَطَحَا", "طُوبَا", "بَطِرَ", "حُطِبَ", "طَبَخَ"] },
      // Ordre confirme par l'utilisateur : 3 mots combines ("بَظِرَ"
      // corrige apres une 1ere lecture "razhira").
      { id: "zah", items: ["بَظَرَ", "أَظَرُ", "بَظِرَ"] },
      // Ordre confirme par l'utilisateur : 3 mots combines.
      { id: "ain", items: ["عَجِبَ", "عَسُرَ", "عُبِدَ"] },
      // Ordre confirme par l'utilisateur : 2 mots combines (meme racine,
      // voyelles differentes).
      { id: "ghain", items: ["غَرُبَ", "غَرِبَ"] }, { id: "feh", items: [] }, { id: "qaf", items: [] },
      { id: "kaf", items: [] }, { id: "lam", items: [] }, { id: "meem", items: [] },
      { id: "noon", items: [] }, { id: "heh", items: [] }, { id: "waw", items: [] },
      { id: "yeh", items: [] }
    ];

    // Niveau 3 : dictee par paires de lettres (et quelques phenomenes -
    // chadda/soukoune sur alif, "entree du al-" - plutot que lettre par
    // lettre). "label" (les deux lettres reunies) sert d'affichage a la
    // fois dans le choix de la lettre et l'entete de l'exercice - ce n'est
    // pas le contenu dicte, donc pas un spoiler. "items" a completer avec
    // l'utilisateur, comme le niveau 1.
    var DICTEE_LEVEL_3_ENTRIES = [
      { id: "alif-baa", label: "أ ب", items: [] },
      { id: "taa-thaa", label: "ت ث", items: [] },
      { id: "jim-haa", label: "ج ح", items: [] },
      { id: "khaa-dal", label: "خ د", items: [] },
      { id: "thal-reh", label: "ذ ر", items: [] },
      { id: "zain-seen", label: "ز س", items: [] },
      { id: "sheen-sad", label: "ش ص", items: [] },
      { id: "dad-tah", label: "ض ط", items: [] },
      { id: "zah-ain", label: "ظ ع", items: [] },
      { id: "ghain-feh", label: "غ ف", items: [] },
      { id: "qaf-kaf", label: "ق ك", items: [] },
      { id: "lam-meem", label: "ل م", items: [] },
      { id: "noon-heh", label: "ن ه", items: [] },
      { id: "waw-yeh", label: "و ي", items: [] },
      { id: "chadda-alif-sad", label: "شدة الألف + ص", items: [] },
      { id: "chadda-alif-yeh", label: "شدة الألف + ي", items: [] },
      { id: "soukoun-alif-thal", label: "سكون الألف + ذ", items: [] },
      { id: "soukoun-alif-ghain", label: "سكون الألف + غ", items: [] },
      { id: "soukoun-alif-yeh", label: "سكون الألف + ي", items: [] },
      { id: "doukhoul-al", label: "دخول ال", items: [] }
    ];

    // Niveau 4 : dictee de phrases completes. Contrairement aux autres
    // niveaux, le contenu n'a pas besoin d'etre devine ou corrige : les 20
    // fichiers audio fournis etaient nommes directement avec la phrase
    // arabe complete et diacritee - reprise ici telle quelle.
    var DICTEE_LEVEL_4_ENTRIES = [
      { id: "s01", items: ["الحَلَالُ بَيِّنٌ وَ الحَرَامُ بَيِّنٌ"] },
      { id: "s02", items: ["الرَّجُلُ قَوِيٌّ"] },
      { id: "s03", items: ["العَيْنُ حَقٌّ"] },
      { id: "s04", items: ["اللَّهُ خَلَقَ الإِنْسَانَ وَ الجِنَّ"] },
      { id: "s05", items: ["أَرْسَلَ رَبُّنَا رُسُلًا كَثِيرِينَ"] },
      { id: "s06", items: ["أَكَلَتْ زَيْنَبُ لَحْمًا"] },
      { id: "s07", items: ["أَنَا مُسْلِمٌ"] },
      { id: "s08", items: ["بِسْمِ اللهِ الرَّحْمَانِ الرَّحِيمِ"] },
      { id: "s09", items: ["تَجْلِسُ هِنْدُ أَمَامَ المُعَلِّمِ"] },
      { id: "s10", items: ["تَزَوَّجْ أَرْبَعًا"] },
      { id: "s11", items: ["خَرَجَ عُمَرُ مِنَ المَسْجِدِ"] },
      { id: "s12", items: ["خَرَجَتْ مَرْيَمُ لِتُصَلِّيَ التَّرَاوِيحَ"] },
      { id: "s13", items: ["دَرَسَ الطَّالِبُ النَّحْوَ"] },
      { id: "s14", items: ["كَتَبَ طُلَّابٌ دَرْسًا"] },
      { id: "s15", items: ["يَتَوَضَّأُ المُسْلِمُ قَبْلَ الصَّلَاةِ"] },
      { id: "s16", items: ["يَدْخُلُ المُكْرَمُونَ فِي الفِرْدَوْسِ"] },
      { id: "s17", items: ["يَشْتَرِي خالِدٌ خُبْزًا وَ جُبْنًا"] },
      { id: "s18", items: ["يَمَسُّ الأَبُ بِإِصْبَعِهِ العَيْنَ"] },
      { id: "s19", items: ["يَمْشِي عَلِيٌّ فِي الطَّرِيقِ"] },
      { id: "s20", items: ["يَهْدِي اللهُ مَنْ يُرِيدُ"] }
    ];

    // Niveau 5 : dictee de phrases/mots courts. Noms de fichiers fournis
    // sans diacritiques complets (parfois partiels) : contenu a valider
    // avec l'utilisateur comme les niveaux 2 et 3, "items" vides en
    // attendant sa correction (l'audio, lui, est deja en place).
    var DICTEE_LEVEL_5_ENTRIES = [
      { id: "s01", items: [] }, { id: "s02", items: [] }, { id: "s03", items: [] },
      { id: "s04", items: [] }, { id: "s05", items: [] }, { id: "s06", items: [] },
      { id: "s07", items: [] }, { id: "s08", items: [] }
    ];

    // Les 5 niveaux de "Dictee" (page dediee dictee.html) : chacun garde
    // ses propres audios/contenu, mais partage la meme mecanique de jeu
    // (choix de l'element -> ecoute -> correction -> element suivant).
    // "unitFr/unitEn" nomme l'unite dictee (lettre, paire, phrase) pour les
    // entetes ; un "label" sur une entree sert d'affichage non-spoiler
    // (ex. une paire de lettres) - une entree sans label ni lettre connue
    // (phrases) affiche simplement son numero.
    var DICTEE_LEVELS = [
      { id: "1", titleFr: "Dictée — Niveau 1", titleEn: "Dictation — Level 1",
        subtitleFr: "Niveau 1 — les 28 lettres", subtitleEn: "Level 1 — all 28 letters",
        unitFr: "Lettre", unitEn: "Letter", audioFolder: "dictee-niveau-1", entries: DICTEE_LEVEL_1_ENTRIES },
      { id: "2", titleFr: "Dictée — Niveau 2", titleEn: "Dictation — Level 2",
        subtitleFr: "Niveau 2 — les 28 lettres", subtitleEn: "Level 2 — all 28 letters",
        unitFr: "Lettre", unitEn: "Letter", audioFolder: "dictee-niveau-2", entries: DICTEE_LEVEL_2_ENTRIES },
      { id: "3", titleFr: "Dictée — Niveau 3", titleEn: "Dictation — Level 3",
        subtitleFr: "Niveau 3 — paires de lettres", subtitleEn: "Level 3 — letter pairs",
        unitFr: "Paire", unitEn: "Pair", audioFolder: "dictee-niveau-3", entries: DICTEE_LEVEL_3_ENTRIES },
      { id: "4", titleFr: "Dictée — Niveau 4", titleEn: "Dictation — Level 4",
        subtitleFr: "Niveau 4 — phrases", subtitleEn: "Level 4 — sentences",
        unitFr: "Phrase", unitEn: "Sentence", audioFolder: "dictee-niveau-4", entries: DICTEE_LEVEL_4_ENTRIES },
      { id: "5", titleFr: "Dictée — Niveau 5", titleEn: "Dictation — Level 5",
        subtitleFr: "Niveau 5 — phrases", subtitleEn: "Level 5 — sentences",
        unitFr: "Phrase", unitEn: "Sentence", audioFolder: "dictee-niveau-5", entries: DICTEE_LEVEL_5_ENTRIES }
    ];
    var DICTEE_LEVELS_BY_ID = {};
    DICTEE_LEVELS.forEach(function (level) { DICTEE_LEVELS_BY_ID[level.id] = level; });

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
    var letterLabPronunciation = document.getElementById("letterLabPronunciation");
    var letterLabPronunciationText = document.getElementById("letterLabPronunciationText");
    var letterLabGroups = document.getElementById("letterLabGroups");
    var letterLabClose = document.getElementById("letterLabClose");
    var currentAudio = null;
    var currentPlayingCell = null;
    var currentAudioBase = "";
    // Casse le cache navigateur quand un fichier audio est remplace sur le
    // serveur (meme piege deja rencontre avec le CSS/JS) : a incrementer
    // a chaque nouveau remplacement d'enregistrements.
    var AUDIO_VERSION = "8";

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

    // Lettres qui ne se lient jamais vers la lettre suivante (pas de
    // tatwil possible juste apres) : les alif, dal/dhal, reh/zain, waw.
    var NON_CONNECTING_LETTERS = { "ا": 1, "أ": 1, "إ": 1, "آ": 1, "ٱ": 1, "د": 1, "ذ": 1, "ر": 1, "ز": 1, "و": 1, "ؤ": 1 };

    function isArabicBaseLetter(ch) {
      var code = ch.charCodeAt(0);
      return (code >= 0x0621 && code <= 0x064A) || code === 0x0671;
    }

    // Insere un tatwil (ـ) entre chaque paire de lettres arabes liees, pour
    // allonger visuellement les mots et faciliter la lecture des debutants
    // (demande explicite, cf. capture avec "_" ajoutes a la main). Respecte
    // les marques harakat/shadda/soukoune (restent collees a leur lettre
    // porteuse) et les lettres non liantes (pas de tatwil apres elles).
    function stretchArabic(text) {
      var tokens = [];
      var i = 0;
      while (i < text.length) {
        var ch = text.charAt(i);
        if (isArabicBaseLetter(ch)) {
          var tok = ch;
          i++;
          while (i < text.length && COMBINING_MARKS[text.charAt(i)]) {
            tok += text.charAt(i);
            i++;
          }
          tokens.push({ base: ch, str: tok });
        } else {
          tokens.push({ base: null, str: ch });
          i++;
        }
      }
      var out = "";
      for (var j = 0; j < tokens.length; j++) {
        out += tokens[j].str;
        var next = tokens[j + 1];
        if (tokens[j].base && !NON_CONNECTING_LETTERS[tokens[j].base] && next && next.base) {
          out += "ـ";
        }
      }
      return out;
    }

    // Le "إ" (alif + hamza en dessous) porte deja une marque en dessous
    // (la hamza) : y ajouter une kasra separee les fait se chevaucher
    // visuellement avec la plupart des polices/navigateurs (gene reelle
    // pour un debutant). On isole cette kasra dans son propre span pour
    // pouvoir la redescendre en CSS, exactement comme deja fait pour les
    // cartes du labo de lettres (voir .letterlab-mark-widened) - mais
    // sans la teinte rouge (reservee a la lettre etudiee dans le labo).
    function renderArabicText(container, text) {
      container.textContent = "";
      var i = 0;
      while (i < text.length) {
        if (text.charAt(i) === "إ" && text.charAt(i + 1) === "ِ") {
          container.appendChild(document.createTextNode("إ"));
          var mark = document.createElement("span");
          mark.className = "arabic-kasra-fix";
          mark.textContent = "ِ";
          container.appendChild(mark);
          i += 2;
        } else {
          container.appendChild(document.createTextNode(text.charAt(i)));
          i++;
        }
      }
    }

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

    // Notes de prononciation (position de la langue, comparaison avec un
    // son connu...) fournies par l'utilisateur, lettre par lettre - pas
    // encore de traduction anglaise, donc affichees uniquement en FR.
    // Liste complete telle que voulue : les autres lettres n'ont pas
    // besoin d'aide a la prononciation, elles n'affichent donc pas ce
    // bloc (pas d'oubli).
    var LETTER_PRONUNCIATION_NOTES = {
      thaa: "Sortir le bout de la langue et la mettre entre les incisives du bas et du haut, et la mordre un petit peu, puis souffler.",
      haa: "Comme le fait de vouloir retirer la buée présente sur des lunettes afin de les nettoyer.",
      khaa: "Comme vouloir sortir des glaires ou une arête de poisson coincée dans la gorge.",
      thal: "Positionner la langue comme pour le « ث », puis faire comme le son du téléphone qui vibre sur une table.",
      reh: "La langue frappe le palais de façon rapide, comme le « r » en espagnol.",
      zain: "Comme pour la prononciation du mot « zéro ».",
      seen: "Comme pour la prononciation du mot « sous ».",
      sad: "Même positionnement de la langue que pour le « س », sauf que la lettre est grave, donc la bouche un peu plus refermée que pour le « س ».",
      dad: "Le côté de la langue (droite ou gauche) vient se positionner sur le côté des molaires d'en haut, puis en la prononçant, la joue se gonfle un peu.",
      tah: "Même positionnement de la langue que pour le « ت », sauf que la lettre est grave, donc la bouche est plus ouverte que pour le « ت ».",
      zah: "Même positionnement de la langue que pour le « ذ », sauf que la lettre est grave, donc la bouche est plus ouverte que pour le « ذ ».",
      ain: "Comme pour la prononciation du mot « Alamîn » dans le 1er verset de la Fatiha. Cette lettre provient du fond de la gorge, l'endroit où pose ses mains celui qui étrangle une personne, et le son qui en provient est celui-ci.",
      ghain: "Comme pour la prononciation du « r » français dans les mots « roue » / « riz ».",
      feh: "Comme pour la prononciation du mot « Fait ».",
      qaf: "Le fond de la langue se lève pour se positionner et toucher le fond du palais.",
      kaf: "Comme pour la prononciation du mot « Cou ».",
      heh: "L'air léger venant des poumons — et non de la gorge — après une petite course très lente."
    };

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
      var note = !isEnglish && LETTER_PRONUNCIATION_NOTES[letter.id];
      letterLabPronunciation.hidden = !note;
      letterLabPronunciationText.textContent = note || "";
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

    // Shadda et Soukoune, integres progressivement dans les modules : les
    // enregistrements du fascicule 4 sont des blocs audio fixes ("بَ" +
    // lettre + marque, un seul fichier non decoupable - voir buildLetterF4
    // plus haut), donc on ne construit jamais de nouveau mot avec : on
    // rejoue simplement, lettre par lettre, les fichiers existants, filtres
    // aux lettres deja apprises dans ce module (jamais au-dela). L'alif est
    // volontairement exclu : cette lettre ne porte pas de shadda en arabe
    // reel (lettre faible), sa presence dans le fascicule 4 est purement
    // pour la completude du cahier papier.
    function openShaddaSukunLab(moduleNumber, title) {
      var module = MODULES.filter(function (m) { return String(m.number) === String(moduleNumber); })[0];
      if (!module) return;
      var allIds = [];
      MODULES.forEach(function (m) {
        if (m.number <= Number(moduleNumber)) { allIds = allIds.concat(m.letterIds); }
      });
      allIds = allIds.filter(function (id) { return id !== "alif" && LETTERS_F4_BY_ID[id]; });
      var letters = allIds.map(function (id) { return LETTERS_F4_BY_ID[id]; });
      if (!letters.length) return;
      var newIds = module.letterIds.filter(function (id) { return id !== "alif"; });
      currentGroupKeys = GROUPS_BY_FASCICULE["4"];
      currentAudioBase = ROOT_BASE + "assets/audio/fascicule-4/";
      letterLabTitle.textContent = title;
      buildTabs(letters);
      var firstNew = newIds.length ? LETTERS_F4_BY_ID[newIds[0]] : letters[0];
      renderLetter(firstNew || letters[0]);
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
    document.querySelectorAll(".js-open-shadda").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openShaddaSukunLab(btn.getAttribute("data-module"), btn.getAttribute("data-title"));
      });
    });
    // La modale #letterLab elle-meme n'est presente que sur les pages qui
    // l'utilisent (accueil, page Modules) ; la page Jeux partage ce meme
    // bloc pour ses donnees (MODULES, AUDIO_VERSION...) mais n'a pas besoin
    // de la modale du labo de lettres.
    if (letterLab) {
      letterLabClose.addEventListener("click", closeLetterLab);
      document.addEventListener("keydown", function (e) {
        if (letterLab.classList.contains("is-open") && e.key === "Escape") closeLetterLab();
      });
    }

    // ---- Section pedagogique "Formes des lettres selon leur position" ----
    // Page Modules uniquement (#formLab absent des autres pages). Montre,
    // pour chaque lettre, sa forme au debut/milieu/fin D'UN VRAI MOT, la
    // lettre etudiee coloree en rouge. Pas un jeu : aucun score, aucune
    // validation - uniquement de l'observation visuelle.
    var formLab = document.getElementById("formLab");
    if (formLab) {
      var formLabClose = document.getElementById("formLabClose");
      var formLabPrev = document.getElementById("formLabPrev");
      var formLabNext = document.getElementById("formLabNext");
      var formLabLetter = document.getElementById("formLabLetter");
      var formLabName = document.getElementById("formLabName");
      var formLabSunMoon = document.getElementById("formLabSunMoon");
      var formLabExamples = document.getElementById("formLabExamples");
      var sunMoonLab = document.getElementById("sunMoonLab");
      var sunMoonLabClose = document.getElementById("sunMoonLabClose");
      var sunMoonLabTitle = document.getElementById("sunMoonLabTitle");
      var sunMoonPanel = document.getElementById("sunMoonPanel");

      // Classification des 28 lettres (regle standard, verifiee par le
      // mnemonique "ابغ حجك وخف عقيمه" pour les 14 lunaires - les 14
      // restantes sont solaires). Sert au badge d'observation (des le
      // module ou la lettre est apprise) et a la notion complete
      // "Lettres solaires et lunaires" (modules 11-12, une fois ل connu).
      var SUN_MOON_TYPE = {
        taa: "sun", thaa: "sun", dal: "sun", thal: "sun", reh: "sun", zain: "sun",
        seen: "sun", sheen: "sun", sad: "sun", dad: "sun", tah: "sun", zah: "sun",
        lam: "sun", noon: "sun",
        alif: "moon", baa: "moon", jim: "moon", haa: "moon", khaa: "moon",
        ain: "moon", ghain: "moon", feh: "moon", qaf: "moon", kaf: "moon",
        meem: "moon", heh: "moon", waw: "moon", yeh: "moon"
      };

      // Exemples "ال + mot" verifies lettre par lettre : chaque mot n'utilise
      // que des lettres apprises au plus tard au module 11 (solaires) ou 12
      // (lunaires, une fois ه و ي connus). alif est volontairement absent
      // (cas particulier peu clair pour un enfant, voir hamza).
      var SUN_WORDS = {
        taa: "التَّمْر", thaa: "الثَّعْلَب", dal: "الدَّرْس", thal: "الذُّرَة",
        reh: "الرَّجُل", zain: "الزُّجَاج", seen: "السَّمَك", sheen: "الشَّمْس",
        sad: "الصَّقْر", dad: "الضَّفْدَع", tah: "الطِّفْل", zah: "الظَّلَام",
        lam: "اللُّغَة", noon: "النَّجْم"
      };
      var MOON_WORDS = {
        baa: "الْبَاب", jim: "الْجَمَل", haa: "الْحِصَان", khaa: "الْخُبْز",
        ain: "الْعَسَل", ghain: "الْغُرَاب", feh: "الْفَرَس", qaf: "الْقَمَر",
        kaf: "الْكَلْب", meem: "الْمَطَر", heh: "الْهِلَال", waw: "الْوَرْدَة", yeh: "الْيَد"
      };

      // Lettres qui ne se lient jamais a la lettre suivante (regle reelle
      // de l'ecriture arabe, pas une simplification) : leurs formes
      // "milieu" et "fin" sont donc visuellement identiques - seule la
      // connexion par la droite existe pour elles.
      var NON_FORWARD_JOINING = { alif: true, dal: true, thal: true, reh: true, zain: true, waw: true };

      // Mots-exemples reels pour chaque lettre, decoupes en segments :
      // texte normal, ou lettre etudiee (h:true, coloree en rouge). Les
      // harakat du mot restent en couleur normale ici (pas de double
      // codage avec le rouge des voyelles utilise ailleurs sur le site) -
      // seul le rouge signale la lettre dont on etudie la forme.
      var LETTER_FORM_EXAMPLES = {
        alif: {
          start: [{ t: "أَ", h: true }, { t: "سَد" }],
          middle: [{ t: "نَ" }, { t: "ا", h: true }, { t: "مَ" }],
          end: [{ t: "دَعَ" }, { t: "ا", h: true }]
        },
        baa: {
          start: [{ t: "بَ", h: true }, { t: "اب" }],
          middle: [{ t: "حَ" }, { t: "بِ", h: true }, { t: "يب" }],
          end: [{ t: "كِتَا" }, { t: "ب", h: true }]
        },
        taa: {
          start: [{ t: "تَ", h: true }, { t: "مْر" }],
          middle: [{ t: "كِ" }, { t: "تَ", h: true }, { t: "اب" }],
          end: [{ t: "بَيْ" }, { t: "ت", h: true }]
        },
        thaa: {
          start: [{ t: "ثَ", h: true }, { t: "عْلَب" }],
          middle: [{ t: "كَ" }, { t: "ثِ", h: true }, { t: "ير" }],
          end: [{ t: "حَدِي" }, { t: "ث", h: true }]
        },
        jim: {
          start: [{ t: "جَ", h: true }, { t: "مَل" }],
          middle: [{ t: "مَسْ" }, { t: "جِ", h: true }, { t: "د" }],
          end: [{ t: "ثَلْ" }, { t: "ج", h: true }]
        },
        haa: {
          start: [{ t: "حِ", h: true }, { t: "صَان" }],
          middle: [{ t: "بَ" }, { t: "حْ", h: true }, { t: "ر" }],
          end: [{ t: "مِلْ" }, { t: "ح", h: true }]
        },
        khaa: {
          start: [{ t: "خُ", h: true }, { t: "بْز" }],
          middle: [{ t: "بُ" }, { t: "خَ", h: true }, { t: "ار" }],
          end: [{ t: "شَيْ" }, { t: "خ", h: true }]
        },
        dal: {
          start: [{ t: "دُ", h: true }, { t: "ب" }],
          middle: [{ t: "مَ" }, { t: "دْ", h: true }, { t: "رَسَة" }],
          end: [{ t: "بَرِي" }, { t: "د", h: true }]
        },
        thal: {
          start: [{ t: "ذُ", h: true }, { t: "بَاب" }],
          middle: [{ t: "نَافِ" }, { t: "ذَ", h: true }, { t: "ة" }],
          end: [{ t: "تِلْمِي" }, { t: "ذ", h: true }]
        },
        reh: {
          start: [{ t: "رَ", h: true }, { t: "جُل" }],
          middle: [{ t: "كَ" }, { t: "رِ", h: true }, { t: "يم" }],
          end: [{ t: "قَمَ" }, { t: "ر", h: true }]
        },
        zain: {
          start: [{ t: "زَ", h: true }, { t: "هْرَة" }],
          middle: [{ t: "غَ" }, { t: "زَ", h: true }, { t: "ال" }],
          end: [{ t: "كَنْ" }, { t: "ز", h: true }]
        },
        seen: {
          start: [{ t: "سَ", h: true }, { t: "مَك" }],
          middle: [{ t: "مِ" }, { t: "سْ", h: true }, { t: "مَار" }],
          end: [{ t: "شَمْ" }, { t: "س", h: true }]
        },
        sheen: {
          start: [{ t: "شَ", h: true }, { t: "جَرَة" }],
          middle: [{ t: "قِ" }, { t: "شْ", h: true }, { t: "رَة" }],
          end: [{ t: "عَطْ" }, { t: "ش", h: true }]
        },
        sad: {
          start: [{ t: "صَ", h: true }, { t: "قْر" }],
          middle: [{ t: "قَ" }, { t: "صِ", h: true }, { t: "ير" }],
          end: [{ t: "قَمِي" }, { t: "ص", h: true }]
        },
        dad: {
          start: [{ t: "ضَ", h: true }, { t: "فْدَع" }],
          middle: [{ t: "بَيْ" }, { t: "ضَ", h: true }, { t: "ة" }],
          end: [{ t: "بَعْ" }, { t: "ض", h: true }]
        },
        tah: {
          start: [{ t: "طِ", h: true }, { t: "فْل" }],
          middle: [{ t: "بَ" }, { t: "طَّ", h: true }, { t: "ة" }],
          end: [{ t: "خَيْ" }, { t: "ط", h: true }]
        },
        zah: {
          start: [{ t: "ظُ", h: true }, { t: "هْر" }],
          middle: [{ t: "نَ" }, { t: "ظَ", h: true }, { t: "ر" }],
          end: [{ t: "حِفْ" }, { t: "ظ", h: true }]
        },
        ain: {
          start: [{ t: "عَ", h: true }, { t: "يْن" }],
          middle: [{ t: "بَ" }, { t: "عِ", h: true }, { t: "يد" }],
          end: [{ t: "جَمِي" }, { t: "ع", h: true }]
        },
        ghain: {
          start: [{ t: "غُ", h: true }, { t: "رَاب" }],
          middle: [{ t: "صَ" }, { t: "غِ", h: true }, { t: "ير" }],
          end: [{ t: "بَلَ" }, { t: "غ", h: true }]
        },
        feh: {
          start: [{ t: "فِ", h: true }, { t: "يل" }],
          middle: [{ t: "قَ" }, { t: "فَ", h: true }, { t: "ص" }],
          end: [{ t: "سَقْ" }, { t: "ف", h: true }]
        },
        qaf: {
          start: [{ t: "قَ", h: true }, { t: "لَم" }],
          middle: [{ t: "بَ" }, { t: "قَ", h: true }, { t: "رَة" }],
          end: [{ t: "طَرِي" }, { t: "ق", h: true }]
        },
        kaf: {
          start: [{ t: "كَ", h: true }, { t: "لْب" }],
          middle: [{ t: "مَ" }, { t: "كْ", h: true }, { t: "تَب" }],
          end: [{ t: "سَمَ" }, { t: "ك", h: true }]
        },
        lam: {
          start: [{ t: "لَ", h: true }, { t: "يْمُون" }],
          middle: [{ t: "قَ" }, { t: "لَ", h: true }, { t: "م" }],
          end: [{ t: "جَمَ" }, { t: "ل", h: true }]
        },
        meem: {
          start: [{ t: "مَ", h: true }, { t: "وْز" }],
          middle: [{ t: "قَ" }, { t: "مَ", h: true }, { t: "ر" }],
          end: [{ t: "قَلَ" }, { t: "م", h: true }]
        },
        noon: {
          start: [{ t: "نَ", h: true }, { t: "جْم" }],
          middle: [{ t: "بِ" }, { t: "نْ", h: true }, { t: "ت" }],
          end: [{ t: "لَبَ" }, { t: "ن", h: true }]
        },
        heh: {
          start: [{ t: "هِ", h: true }, { t: "لَال" }],
          middle: [{ t: "نَ" }, { t: "هْ", h: true }, { t: "ر" }],
          end: [{ t: "وَجْ" }, { t: "ه", h: true }],
          endAlt: [{ t: "مِيَا" }, { t: "ه", h: true }]
        },
        waw: {
          start: [{ t: "وَ", h: true }, { t: "رْدَة" }],
          middle: [{ t: "نَ" }, { t: "وْ", h: true }, { t: "م" }],
          end: [{ t: "جَ" }, { t: "و", h: true }]
        },
        yeh: {
          start: [{ t: "يَ", h: true }, { t: "د" }],
          middle: [{ t: "بَ" }, { t: "يْ", h: true }, { t: "ت" }],
          end: [{ t: "كُرْسِ" }, { t: "ي", h: true }]
        }
      };

      var FORM_LABEL = {
        start: isEnglish ? "At the start" : "Au début",
        middle: isEnglish ? "In the middle" : "Au milieu",
        end: isEnglish ? "At the end" : "À la fin",
        endAlt: isEnglish ? "At the end (after a non-connecting letter)" : "À la fin (après une lettre qui ne se lie pas)"
      };

      var formLabState = { ids: [], index: 0 };

      // Variante segment-aware de stretchArabic : le mot est deja decoupe
      // en plusieurs morceaux (normal / lettre etudiee en rouge) qui se
      // concatenent sans espace - on calcule le tatwil sur le mot complet
      // reconstitue, puis on redistribue chaque tatwil insere a la fin du
      // segment qui porte la lettre precedente (le rendu visuel final est
      // identique, seul le decoupage normal/rouge est preserve).
      function stretchSegments(segments) {
        var flat = [];
        segments.forEach(function (seg, segIndex) {
          var text = seg.t;
          var i = 0;
          while (i < text.length) {
            var ch = text.charAt(i);
            if (isArabicBaseLetter(ch)) {
              var tok = ch;
              i++;
              while (i < text.length && COMBINING_MARKS[text.charAt(i)]) {
                tok += text.charAt(i);
                i++;
              }
              flat.push({ segIndex: segIndex, base: ch, str: tok });
            } else {
              flat.push({ segIndex: segIndex, base: null, str: ch });
              i++;
            }
          }
        });
        var rebuilt = segments.map(function () { return ""; });
        for (var j = 0; j < flat.length; j++) {
          rebuilt[flat[j].segIndex] += flat[j].str;
          var next = flat[j + 1];
          if (flat[j].base && !NON_CONNECTING_LETTERS[flat[j].base] && next && next.base) {
            rebuilt[flat[j].segIndex] += "ـ";
          }
        }
        return segments.map(function (seg, idx) {
          return { t: rebuilt[idx], h: seg.h };
        });
      }

      function renderFormSegments(container, segments) {
        container.innerHTML = "";
        segments.forEach(function (seg) {
          if (seg.h) {
            var mark = document.createElement("span");
            mark.className = "formlab-highlight";
            mark.textContent = seg.t;
            container.appendChild(mark);
          } else {
            container.appendChild(document.createTextNode(seg.t));
          }
        });
      }

      function addFormCard(labelKey, segments) {
        var card = document.createElement("div");
        card.className = "formlab-card";
        var label = document.createElement("p");
        label.className = "formlab-card-label";
        label.textContent = FORM_LABEL[labelKey];
        var word = document.createElement("p");
        word.className = "formlab-word";
        renderFormSegments(word, stretchSegments(segments));
        card.appendChild(label);
        card.appendChild(word);
        formLabExamples.appendChild(card);
      }

      function renderFormLab() {
        var id = formLabState.ids[formLabState.index];
        var letter = ALL_LETTERS_BY_ID[id];
        var examples = LETTER_FORM_EXAMPLES[id];
        formLabLetter.textContent = letter.char;
        formLabName.textContent = letter.name;
        var sunMoon = SUN_MOON_TYPE[id];
        formLabSunMoon.textContent = sunMoon === "sun"
          ? (isEnglish ? "☀️ Sun letter" : "☀️ Lettre solaire")
          : (isEnglish ? "🌙 Moon letter" : "🌙 Lettre lunaire");
        formLabSunMoon.className = "formlab-sunmoon formlab-sunmoon-" + sunMoon;
        formLabExamples.innerHTML = "";
        if (!examples) return;

        addFormCard("start", examples.start);
        addFormCard("middle", examples.middle);
        addFormCard("end", examples.end);
        if (examples.endAlt) { addFormCard("endAlt", examples.endAlt); }

        if (NON_FORWARD_JOINING[id]) {
          var note = document.createElement("p");
          note.className = "formlab-note";
          note.textContent = isEnglish
            ? "This letter never connects to the one after it, so its “middle” and “end” shapes look the same."
            : "Cette lettre ne se lie jamais à la lettre suivante : ses formes « milieu » et « fin » se ressemblent donc.";
          formLabExamples.appendChild(note);
        }

        formLabPrev.disabled = formLabState.index === 0;
        formLabNext.disabled = formLabState.index === formLabState.ids.length - 1;
      }

      function cumulativeFormLetterIds(moduleNumber) {
        var ids = [];
        MODULES.forEach(function (m) {
          if (m.number <= Number(moduleNumber)) { ids = ids.concat(m.letterIds); }
        });
        return ids;
      }

      function openFormLab(moduleNumber) {
        var module = MODULES.filter(function (m) { return String(m.number) === String(moduleNumber); })[0];
        if (!module) return;
        var allIds = cumulativeFormLetterIds(moduleNumber);
        formLabState.ids = allIds;
        formLabState.index = allIds.indexOf(module.letterIds[0]);
        renderFormLab();
        formLab.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      function closeFormLab() {
        formLab.classList.remove("is-open");
        document.body.style.overflow = "";
      }

      // Lettres solaires et lunaires : module 13, dedie, place apres les 12
      // modules de lettres (les 28 lettres et ل en particulier sont donc
      // toujours connues a ce stade - jamais de filtrage par module ici).
      // Les enregistrements existants ("بَ" + lettre) ne conviennent pas a
      // des mots complets : en attendant de vrais enregistrements humains,
      // les mots utilisent la synthese vocale du navigateur (aucun fichier
      // genere ni stocke) - uniquement les mots, jamais les lettres du
      // tableau de reference.
      function speakArabicWord(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar-SA";
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }

      function openSunMoonLab(title) {
        var allIds = [];
        MODULES.forEach(function (m) { allIds = allIds.concat(m.letterIds); });
        // Classification complete (tableau de reference) : les 28 lettres,
        // alif inclus - independant des exemples de mots disponibles.
        var allSunIds = allIds.filter(function (id) { return SUN_MOON_TYPE[id] === "sun"; });
        var allMoonIds = allIds.filter(function (id) { return SUN_MOON_TYPE[id] === "moon"; });
        // Exemples "ال + mot" : alif exclu, aucun exemple clair et simple
        // n'existe pour cette lettre (voir analyse validee).
        var sunIds = allSunIds.filter(function (id) { return SUN_WORDS[id]; });
        var moonIds = allMoonIds.filter(function (id) { return MOON_WORDS[id]; });
        if (!sunIds.length && !moonIds.length) return;

        sunMoonLabTitle.textContent = title;
        sunMoonPanel.innerHTML = "";

        // Tableau de reference clair, avant les exemples en situation.
        var table = document.createElement("div");
        table.className = "sunmoon-table";
        [["sun", allSunIds], ["moon", allMoonIds]].forEach(function (pair) {
          var type = pair[0], ids = pair[1];
          var col = document.createElement("div");
          col.className = "sunmoon-table-col sunmoon-table-" + type;
          var h4 = document.createElement("h4");
          h4.className = "sunmoon-table-title";
          h4.textContent = type === "sun"
            ? (isEnglish ? "☀️ Sun letters (14)" : "☀️ Lettres solaires (14)")
            : (isEnglish ? "🌙 Moon letters (14)" : "🌙 Lettres lunaires (14)");
          var lettersP = document.createElement("p");
          lettersP.className = "sunmoon-table-letters";
          lettersP.textContent = ids.map(function (id) { return ALL_LETTERS_BY_ID[id] ? ALL_LETTERS_BY_ID[id].char : id; }).join("  ");
          col.appendChild(h4);
          col.appendChild(lettersP);
          table.appendChild(col);
        });
        sunMoonPanel.appendChild(table);

        var intro = document.createElement("p");
        intro.className = "sunmoon-intro";
        intro.textContent = isEnglish
          ? "When you add الـ (\"the\") before a word, its first letter decides what happens to the ل:"
          : "Quand on ajoute الـ (« le / la ») devant un mot, sa première lettre décide ce qui arrive au ل :";
        sunMoonPanel.appendChild(intro);

        function addSection(type, ids, wordsMap) {
          if (!ids.length) return;
          var h3 = document.createElement("h3");
          h3.className = "sunmoon-section-title sunmoon-section-" + type;
          h3.textContent = type === "sun"
            ? (isEnglish ? "☀️ Sun — the ل is silent, the letter takes a Shadda" : "☀️ Solaire — le ل ne s'entend pas, la lettre porte une Shadda")
            : (isEnglish ? "🌙 Moon — the ل is pronounced" : "🌙 Lunaire — le ل s'entend");
          sunMoonPanel.appendChild(h3);
          var grid = document.createElement("div");
          grid.className = "formlab-examples sunmoon-grid";
          ids.forEach(function (id) {
            // Bouton (pas juste une carte) : uniquement les mots ont une
            // prononciation synthetique au clic, en attendant de vrais
            // enregistrements - jamais les lettres du tableau au-dessus.
            var card = document.createElement("button");
            card.type = "button";
            card.className = "formlab-card sunmoon-word-card";
            var label = document.createElement("p");
            label.className = "formlab-card-label";
            label.textContent = ALL_LETTERS_BY_ID[id] ? ALL_LETTERS_BY_ID[id].char : id;
            var word = document.createElement("p");
            word.className = "formlab-word";
            renderArabicText(word, stretchArabic(wordsMap[id]));
            var play = document.createElement("span");
            play.className = "sunmoon-word-play";
            play.textContent = "🔊";
            card.appendChild(label);
            card.appendChild(word);
            card.appendChild(play);
            card.addEventListener("click", function () { speakArabicWord(wordsMap[id]); });
            grid.appendChild(card);
          });
          sunMoonPanel.appendChild(grid);
        }

        addSection("sun", sunIds, SUN_WORDS);
        addSection("moon", moonIds, MOON_WORDS);

        sunMoonLab.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      function closeSunMoonLab() {
        sunMoonLab.classList.remove("is-open");
        document.body.style.overflow = "";
      }

      document.querySelectorAll(".js-open-formlab").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openFormLab(btn.getAttribute("data-module"));
        });
      });
      formLabClose.addEventListener("click", closeFormLab);
      formLabPrev.addEventListener("click", function () {
        if (formLabState.index > 0) { formLabState.index -= 1; renderFormLab(); }
      });
      formLabNext.addEventListener("click", function () {
        if (formLabState.index < formLabState.ids.length - 1) { formLabState.index += 1; renderFormLab(); }
      });
      document.addEventListener("keydown", function (e) {
        if (formLab.classList.contains("is-open") && e.key === "Escape") closeFormLab();
      });

      document.querySelectorAll(".js-open-sunmoon").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openSunMoonLab(btn.getAttribute("data-title"));
        });
      });
      if (sunMoonLab) {
        sunMoonLabClose.addEventListener("click", closeSunMoonLab);
        document.addEventListener("keydown", function (e) {
          if (sunMoonLab.classList.contains("is-open") && e.key === "Escape") closeSunMoonLab();
        });
      }
    }

    // ---- Jeux : "Quel son as-tu entendu ?", par module ----
    // Architecture prevue pour les 12 modules (buildSoundPool marche pour
    // n'importe lequel), mais seul le module 1 (Alif) a ses questions
    // activees pour l'instant ; les autres restent "Bientot disponible".
    var gameBtns = document.querySelectorAll(".js-open-game");
    // La page Dictee (dictee.html) n'a pas de cartes de module (gameBtns
    // vide) mais partage la meme modale #gameModal : sans ce deuxieme test,
    // toute la section jeux serait ignoree et les niveaux de Dictee ne
    // s'initialiseraient jamais sur cette page.
    if (gameBtns.length || document.getElementById("gameModal")) {
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
        { id: "haraba", arabic: "هَرَبَ", letters: ["baa", "heh", "reh"], audioId: "haraba", units: ["heh-fatha", "reh-fatha", "baa-fatha"] },
        { id: "daraja", arabic: "دَرَجَ", letters: ["dal", "jim", "reh"], audioId: "daraja", units: ["dal-fatha", "reh-fatha", "jim-fatha"] },
        { id: "hadhira", arabic: "حَذِرَ", letters: ["haa", "reh", "thal"], audioId: "hadhira", units: ["haa-fatha", "thal-kasra", "reh-fatha"] },
        { id: "harasa", arabic: "حَرَسَ", letters: ["haa", "reh", "seen"], audioId: "harasa", units: ["haa-fatha", "reh-fatha", "seen-fatha"] },
        { id: "sarada", arabic: "سَرَدَ", letters: ["dal", "reh", "seen"], audioId: "sarada", units: ["seen-fatha", "reh-fatha", "dal-fatha"] },
        { id: "hasada", arabic: "حَصَدَ", letters: ["dal", "haa", "sad"], audioId: "hasada", units: ["haa-fatha", "sad-fatha", "dal-fatha"] },
        { id: "sabara", arabic: "صَبَرَ", letters: ["baa", "reh", "sad"], audioId: "sabara", units: ["sad-fatha", "baa-fatha", "reh-fatha"] },
        { id: "tabakha", arabic: "طَبَخَ", letters: ["baa", "khaa", "tah"], audioId: "tabakha", units: ["tah-fatha", "baa-fatha", "khaa-fatha"] },
        { id: "basata", arabic: "بَسَطَ", letters: ["baa", "seen", "tah"], audioId: "basata", units: ["baa-fatha", "seen-fatha", "tah-fatha"] },
        { id: "atisha", arabic: "عَطِشَ", letters: ["ain", "sheen", "tah"], audioId: "atisha", units: ["ain-fatha", "tah-kasra", "sheen-fatha"] },
        { id: "abada", arabic: "عَبَدَ", letters: ["ain", "baa", "dal"], audioId: "abada", units: ["ain-fatha", "baa-fatha", "dal-fatha"] },
        { id: "daaverb", arabic: "دَعَا", letters: ["ain", "dal"], audioId: "daaverb", units: ["dal-fatha", "ain-madd-fatha"] },
        { id: "dahika", arabic: "ضَحِكَ", letters: ["dad", "haa", "kaf"], audioId: "dahika", units: ["dad-fatha", "haa-kasra", "kaf-fatha"] },
        { id: "sakata", arabic: "سَكَتَ", letters: ["kaf", "seen", "taa"], audioId: "sakata", units: ["seen-fatha", "kaf-fatha", "taa-fatha"] },
        { id: "rafaa", arabic: "رَفَعَ", letters: ["ain", "feh", "reh"], audioId: "rafaa", units: ["reh-fatha", "feh-fatha", "ain-fatha"] },
        { id: "ghasala", arabic: "غَسَلَ", letters: ["ghain", "lam", "seen"], audioId: "ghasala", units: ["ghain-fatha", "seen-fatha", "lam-fatha"] },
        { id: "nazara", arabic: "نَظَرَ", letters: ["noon", "reh", "zah"], audioId: "nazara", units: ["noon-fatha", "zah-fatha", "reh-fatha"] },
        { id: "samia", arabic: "سَمِعَ", letters: ["ain", "meem", "seen"], audioId: "samia", units: ["seen-fatha", "meem-kasra", "ain-fatha"] },
        { id: "talaba", arabic: "طَلَبَ", letters: ["baa", "lam", "tah"], audioId: "talaba", units: ["tah-fatha", "lam-fatha", "baa-fatha"] },
        { id: "fahima", arabic: "فَهِمَ", letters: ["feh", "heh", "meem"], audioId: "fahima", units: ["feh-fatha", "heh-kasra", "meem-fatha"] },
        { id: "waqafa", arabic: "وَقَفَ", letters: ["feh", "qaf", "waw"], audioId: "waqafa", units: ["waw-fatha", "qaf-fatha", "feh-fatha"] },
        { id: "wasafa", arabic: "وَصَفَ", letters: ["feh", "sad", "waw"], audioId: "wasafa", units: ["waw-fatha", "sad-fatha", "feh-fatha"] }
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
        { id: "m12_21", arabic: "يِقُو", letters: ["qaf", "yeh"], audioId: "m12_21", units: ["yeh-kasra", "qaf-madd-damma"] },
        { id: "m2_01", arabic: "بِتَ", letters: ["baa", "taa"], audioId: "m2_01", units: ["baa-kasra", "taa-fatha"] },
        { id: "m2_02", arabic: "إِتِي", letters: ["alif", "taa"], audioId: "m2_02", units: ["alif-kasra", "taa-madd-kasra"] },
        { id: "m2_03", arabic: "أَبِثِتَا", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_03", units: ["alif-fatha", "baa-kasra", "thaa-kasra", "taa-madd-fatha"] },
        { id: "m2_04", arabic: "إِتِثَبَ", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_04", units: ["alif-kasra", "taa-kasra", "thaa-fatha", "baa-fatha"] },
        { id: "m2_05", arabic: "أُبُثِتَ", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_05", units: ["alif-damma", "baa-damma", "thaa-kasra", "taa-fatha"] },
        { id: "m2_06", arabic: "آثُتِ", letters: ["alif", "taa", "thaa"], audioId: "m2_06", units: ["alif-madd-fatha", "thaa-damma", "taa-kasra"] },
        { id: "m2_07", arabic: "بَاثُ", letters: ["baa", "thaa"], audioId: "m2_07", units: ["baa-madd-fatha", "thaa-damma"] },
        { id: "m2_08", arabic: "إِتُ", letters: ["alif", "taa"], audioId: "m2_08", units: ["alif-kasra", "taa-damma"] },
        { id: "m2_09", arabic: "ثَبُ", letters: ["baa", "thaa"], audioId: "m2_09", units: ["thaa-fatha", "baa-damma"] },
        { id: "m2_10", arabic: "إِثِتِبَ", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_10", units: ["alif-kasra", "thaa-kasra", "taa-kasra", "baa-fatha"] },
        { id: "m2_11", arabic: "أَبُثِتِ", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_11", units: ["alif-fatha", "baa-damma", "thaa-kasra", "taa-kasra"] },
        { id: "m2_12", arabic: "آبِتُثُ", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_12", units: ["alif-madd-fatha", "baa-kasra", "taa-damma", "thaa-damma"] },
        { id: "m2_13", arabic: "أُبِيثَتُ", letters: ["alif", "baa", "taa", "thaa"], audioId: "m2_13", units: ["alif-damma", "baa-madd-kasra", "thaa-fatha", "taa-damma"] },
        { id: "m2_14", arabic: "بُتَثُ", letters: ["baa", "taa", "thaa"], audioId: "m2_14", units: ["baa-damma", "taa-fatha", "thaa-damma"] },
        { id: "m3_21", arabic: "حِجُثَ", letters: ["haa", "jim", "thaa"], audioId: "m3_21", units: ["haa-kasra", "jim-damma", "thaa-fatha"] },
        { id: "m3_22", arabic: "حُجَبَا", letters: ["baa", "haa", "jim"], audioId: "m3_22", units: ["haa-damma", "jim-fatha", "baa-madd-fatha"] },
        { id: "m3_23", arabic: "آحَخُ", letters: ["alif", "haa", "khaa"], audioId: "m3_23", units: ["alif-madd-fatha", "haa-fatha", "khaa-damma"] },
        { id: "m3_24", arabic: "ثَتَاجِ", letters: ["jim", "taa", "thaa"], audioId: "m3_24", units: ["thaa-fatha", "taa-madd-fatha", "jim-kasra"] },
        { id: "m3_25", arabic: "بَتَحَا", letters: ["baa", "haa", "taa"], audioId: "m3_25", units: ["baa-fatha", "taa-fatha", "haa-madd-fatha"] },
        { id: "m3_26", arabic: "ثِخَحَجُ", letters: ["haa", "jim", "khaa", "thaa"], audioId: "m3_26", units: ["thaa-kasra", "khaa-fatha", "haa-fatha", "jim-damma"] },
        { id: "m3_27", arabic: "أُجِي", letters: ["alif", "jim"], audioId: "m3_27", units: ["alif-damma", "jim-madd-kasra"] },
        { id: "m3_28", arabic: "إِحُوثُخُ", letters: ["alif", "haa", "khaa", "thaa"], audioId: "m3_28", units: ["alif-kasra", "haa-madd-damma", "thaa-damma", "khaa-damma"] },
        { id: "m3_29", arabic: "جَخُ", letters: ["jim", "khaa"], audioId: "m3_29", units: ["jim-fatha", "khaa-damma"] },
        { id: "m3_30", arabic: "حَخِيجِ", letters: ["haa", "jim", "khaa"], audioId: "m3_30", units: ["haa-fatha", "khaa-madd-kasra", "jim-kasra"] },
        { id: "m3_31", arabic: "حِيجَ", letters: ["haa", "jim"], audioId: "m3_31", units: ["haa-madd-kasra", "jim-fatha"] },
        { id: "m3_32", arabic: "ثَخَاجَ", letters: ["jim", "khaa", "thaa"], audioId: "m3_32", units: ["thaa-fatha", "khaa-madd-fatha", "jim-fatha"] },
        { id: "m3_33", arabic: "بِجُحَثُ", letters: ["baa", "haa", "jim", "thaa"], audioId: "m3_33", units: ["baa-kasra", "jim-damma", "haa-fatha", "thaa-damma"] },
        { id: "m3_34", arabic: "إِيحُجُ", letters: ["alif", "haa", "jim"], audioId: "m3_34", units: ["alif-madd-kasra", "haa-damma", "jim-damma"] },
        { id: "m3_35", arabic: "آتُخِبُ", letters: ["alif", "baa", "khaa", "taa"], audioId: "m3_35", units: ["alif-madd-fatha", "taa-damma", "khaa-kasra", "baa-damma"] },
        { id: "m3_36", arabic: "إِثَجُتُ", letters: ["alif", "jim", "taa", "thaa"], audioId: "m3_36", units: ["alif-kasra", "thaa-fatha", "jim-damma", "taa-damma"] },
        { id: "m4_15", arabic: "تُبَاذُدَ", letters: ["baa", "dal", "taa", "thal"], audioId: "m4_15", units: ["taa-damma", "baa-madd-fatha", "thal-damma", "dal-fatha"] },
        { id: "m4_16", arabic: "دُجِثِذُ", letters: ["dal", "jim", "thaa", "thal"], audioId: "m4_16", units: ["dal-damma", "jim-kasra", "thaa-kasra", "thal-damma"] },
        { id: "m4_17", arabic: "ثُدِ", letters: ["dal", "thaa"], audioId: "m4_17", units: ["thaa-damma", "dal-kasra"] },
        { id: "m4_18", arabic: "ذِدِ", letters: ["dal", "thal"], audioId: "m4_18", units: ["thal-kasra", "dal-kasra"] },
        { id: "m4_19", arabic: "دُخُ", letters: ["dal", "khaa"], audioId: "m4_19", units: ["dal-damma", "khaa-damma"] },
        { id: "m4_20", arabic: "ذُحُ", letters: ["haa", "thal"], audioId: "m4_20", units: ["thal-damma", "haa-damma"] },
        { id: "m4_21", arabic: "أُدَ", letters: ["alif", "dal"], audioId: "m4_21", units: ["alif-damma", "dal-fatha"] },
        { id: "m4_22", arabic: "حِيذِبُ", letters: ["baa", "haa", "thal"], audioId: "m4_22", units: ["haa-madd-kasra", "thal-kasra", "baa-damma"] },
        { id: "m4_23", arabic: "ذُدِ", letters: ["dal", "thal"], audioId: "m4_23", units: ["thal-damma", "dal-kasra"] },
        { id: "m4_24", arabic: "حُدِتَذِي", letters: ["dal", "haa", "taa", "thal"], audioId: "m4_24", units: ["haa-damma", "dal-kasra", "taa-fatha", "thal-madd-kasra"] },
        { id: "m4_25", arabic: "دَذَ", letters: ["dal", "thal"], audioId: "m4_25", units: ["dal-fatha", "thal-fatha"] },
        { id: "m4_26", arabic: "دِذَ", letters: ["dal", "thal"], audioId: "m4_26", units: ["dal-kasra", "thal-fatha"] },
        { id: "m4_27", arabic: "خَدِجُو", letters: ["dal", "jim", "khaa"], audioId: "m4_27", units: ["khaa-fatha", "dal-kasra", "jim-madd-damma"] },
        { id: "m4_28", arabic: "ذَاحَ", letters: ["haa", "thal"], audioId: "m4_28", units: ["thal-madd-fatha", "haa-fatha"] },
        { id: "m5_15", arabic: "رِثُو", letters: ["reh", "thaa"], audioId: "m5_15", units: ["reh-kasra", "thaa-madd-damma"] },
        { id: "m5_16", arabic: "زَرُدُوثِ", letters: ["dal", "reh", "thaa", "zain"], audioId: "m5_16", units: ["zain-fatha", "reh-damma", "dal-madd-damma", "thaa-kasra"] },
        { id: "m5_17", arabic: "خِتُبِرِ", letters: ["baa", "khaa", "reh", "taa"], audioId: "m5_17", units: ["khaa-kasra", "taa-damma", "baa-kasra", "reh-kasra"] },
        { id: "m5_18", arabic: "أُورَخُزَ", letters: ["alif", "khaa", "reh", "zain"], audioId: "m5_18", units: ["alif-madd-damma", "reh-fatha", "khaa-damma", "zain-fatha"] },
        { id: "m5_19", arabic: "زُرُودِ", letters: ["dal", "reh", "zain"], audioId: "m5_19", units: ["zain-damma", "reh-madd-damma", "dal-kasra"] },
        { id: "m5_20", arabic: "أَزُذُو", letters: ["alif", "thal", "zain"], audioId: "m5_20", units: ["alif-fatha", "zain-damma", "thal-madd-damma"] },
        { id: "m5_21", arabic: "أُزَرُ", letters: ["alif", "reh", "zain"], audioId: "m5_21", units: ["alif-damma", "zain-fatha", "reh-damma"] },
        { id: "m5_22", arabic: "تَثِخُوزُ", letters: ["khaa", "taa", "thaa", "zain"], audioId: "m5_22", units: ["taa-fatha", "thaa-kasra", "khaa-madd-damma", "zain-damma"] },
        { id: "m5_23", arabic: "زَرُ", letters: ["reh", "zain"], audioId: "m5_23", units: ["zain-fatha", "reh-damma"] },
        { id: "m5_24", arabic: "إِرُزُ", letters: ["alif", "reh", "zain"], audioId: "m5_24", units: ["alif-kasra", "reh-damma", "zain-damma"] },
        { id: "m5_25", arabic: "رِزُبَ", letters: ["baa", "reh", "zain"], audioId: "m5_25", units: ["reh-kasra", "zain-damma", "baa-fatha"] },
        { id: "m5_26", arabic: "جَزُ", letters: ["jim", "zain"], audioId: "m5_26", units: ["jim-fatha", "zain-damma"] },
        { id: "m5_27", arabic: "رَابَدُ", letters: ["baa", "dal", "reh"], audioId: "m5_27", units: ["reh-madd-fatha", "baa-fatha", "dal-damma"] },
        { id: "m5_28", arabic: "زِرُخَ", letters: ["khaa", "reh", "zain"], audioId: "m5_28", units: ["zain-kasra", "reh-damma", "khaa-fatha"] },
        { id: "m6_15", arabic: "أَشَسِتِ", letters: ["alif", "seen", "sheen", "taa"], audioId: "m6_15", units: ["alif-fatha", "sheen-fatha", "seen-kasra", "taa-kasra"] },
        { id: "m6_16", arabic: "خَشَزُ", letters: ["khaa", "sheen", "zain"], audioId: "m6_16", units: ["khaa-fatha", "sheen-fatha", "zain-damma"] },
        { id: "m6_17", arabic: "آسَزُشَ", letters: ["alif", "seen", "sheen", "zain"], audioId: "m6_17", units: ["alif-madd-fatha", "seen-fatha", "zain-damma", "sheen-fatha"] },
        { id: "m6_18", arabic: "سُجُشَتِ", letters: ["jim", "seen", "sheen", "taa"], audioId: "m6_18", units: ["seen-damma", "jim-damma", "sheen-fatha", "taa-kasra"] },
        { id: "m6_19", arabic: "إِسُ", letters: ["alif", "seen"], audioId: "m6_19", units: ["alif-kasra", "seen-damma"] },
        { id: "m6_20", arabic: "شَسَخَ", letters: ["khaa", "seen", "sheen"], audioId: "m6_20", units: ["sheen-fatha", "seen-fatha", "khaa-fatha"] },
        { id: "m6_21", arabic: "سَشَ", letters: ["seen", "sheen"], audioId: "m6_21", units: ["seen-fatha", "sheen-fatha"] },
        { id: "m6_22", arabic: "شَخَرُ", letters: ["khaa", "reh", "sheen"], audioId: "m6_22", units: ["sheen-fatha", "khaa-fatha", "reh-damma"] },
        { id: "m6_23", arabic: "سَجُوشَ", letters: ["jim", "seen", "sheen"], audioId: "m6_23", units: ["seen-fatha", "jim-madd-damma", "sheen-fatha"] },
        { id: "m6_24", arabic: "شِسِحِ", letters: ["haa", "seen", "sheen"], audioId: "m6_24", units: ["sheen-kasra", "seen-kasra", "haa-kasra"] },
        { id: "m6_25", arabic: "سَجَ", letters: ["jim", "seen"], audioId: "m6_25", units: ["seen-fatha", "jim-fatha"] },
        { id: "m6_26", arabic: "ذَشُ", letters: ["sheen", "thal"], audioId: "m6_26", units: ["thal-fatha", "sheen-damma"] },
        { id: "m6_27", arabic: "رَبُوسُ", letters: ["baa", "reh", "seen"], audioId: "m6_27", units: ["reh-fatha", "baa-madd-damma", "seen-damma"] },
        { id: "m6_28", arabic: "شَاسُتُحِ", letters: ["haa", "seen", "sheen", "taa"], audioId: "m6_28", units: ["sheen-madd-fatha", "seen-damma", "taa-damma", "haa-kasra"] },
        { id: "m7_15", arabic: "صِيتَ", letters: ["sad", "taa"], audioId: "m7_15", units: ["sad-madd-kasra", "taa-fatha"] },
        { id: "m7_16", arabic: "ضِرِ", letters: ["dad", "reh"], audioId: "m7_16", units: ["dad-kasra", "reh-kasra"] },
        { id: "m7_17", arabic: "أُذِصَ", letters: ["alif", "sad", "thal"], audioId: "m7_17", units: ["alif-damma", "thal-kasra", "sad-fatha"] },
        { id: "m7_18", arabic: "ضُثِبِ", letters: ["baa", "dad", "thaa"], audioId: "m7_18", units: ["dad-damma", "thaa-kasra", "baa-kasra"] },
        { id: "m7_19", arabic: "صَرُودِ", letters: ["dal", "reh", "sad"], audioId: "m7_19", units: ["sad-fatha", "reh-madd-damma", "dal-kasra"] },
        { id: "m7_20", arabic: "ضُصَاخَ", letters: ["dad", "khaa", "sad"], audioId: "m7_20", units: ["dad-damma", "sad-madd-fatha", "khaa-fatha"] },
        { id: "m7_21", arabic: "حُخَاصُضِ", letters: ["dad", "haa", "khaa", "sad"], audioId: "m7_21", units: ["haa-damma", "khaa-madd-fatha", "sad-damma", "dad-kasra"] },
        { id: "m7_22", arabic: "ضِصَ", letters: ["dad", "sad"], audioId: "m7_22", units: ["dad-kasra", "sad-fatha"] },
        { id: "m7_23", arabic: "رُثَصَ", letters: ["reh", "sad", "thaa"], audioId: "m7_23", units: ["reh-damma", "thaa-fatha", "sad-fatha"] },
        { id: "m7_24", arabic: "ذُضُ", letters: ["dad", "thal"], audioId: "m7_24", units: ["thal-damma", "dad-damma"] },
        { id: "m7_25", arabic: "ضِصُ", letters: ["dad", "sad"], audioId: "m7_25", units: ["dad-kasra", "sad-damma"] },
        { id: "m7_26", arabic: "صِحِيتُضِ", letters: ["dad", "haa", "sad", "taa"], audioId: "m7_26", units: ["sad-kasra", "haa-madd-kasra", "taa-damma", "dad-kasra"] },
        { id: "m7_27", arabic: "صُوبَزُ", letters: ["baa", "sad", "zain"], audioId: "m7_27", units: ["sad-madd-damma", "baa-fatha", "zain-damma"] },
        { id: "m7_28", arabic: "دَصَاضُ", letters: ["dad", "dal", "sad"], audioId: "m7_28", units: ["dal-fatha", "sad-madd-fatha", "dad-damma"] },
        { id: "m8_15", arabic: "طَظَزِ", letters: ["tah", "zah", "zain"], audioId: "m8_15", units: ["tah-fatha", "zah-fatha", "zain-kasra"] },
        { id: "m8_16", arabic: "خَاظَذِ", letters: ["khaa", "thal", "zah"], audioId: "m8_16", units: ["khaa-madd-fatha", "zah-fatha", "thal-kasra"] },
        { id: "m8_17", arabic: "سَطِ", letters: ["seen", "tah"], audioId: "m8_17", units: ["seen-fatha", "tah-kasra"] },
        { id: "m8_18", arabic: "أُطَاظِ", letters: ["alif", "tah", "zah"], audioId: "m8_18", units: ["alif-damma", "tah-madd-fatha", "zah-kasra"] },
        { id: "m8_19", arabic: "خِظِيطُ", letters: ["khaa", "tah", "zah"], audioId: "m8_19", units: ["khaa-kasra", "zah-madd-kasra", "tah-damma"] },
        { id: "m8_20", arabic: "ظِجِحُ", letters: ["haa", "jim", "zah"], audioId: "m8_20", units: ["zah-kasra", "jim-kasra", "haa-damma"] },
        { id: "m8_21", arabic: "ظِزَطَجَ", letters: ["jim", "tah", "zah", "zain"], audioId: "m8_21", units: ["zah-kasra", "zain-fatha", "tah-fatha", "jim-fatha"] },
        { id: "m8_22", arabic: "طُظَ", letters: ["tah", "zah"], audioId: "m8_22", units: ["tah-damma", "zah-fatha"] },
        { id: "m8_23", arabic: "صَدُوطَحِ", letters: ["dal", "haa", "sad", "tah"], audioId: "m8_23", units: ["sad-fatha", "dal-madd-damma", "tah-fatha", "haa-kasra"] },
        { id: "m8_24", arabic: "أَثِظُوصُ", letters: ["alif", "sad", "thaa", "zah"], audioId: "m8_24", units: ["alif-fatha", "thaa-kasra", "zah-madd-damma", "sad-damma"] },
        { id: "m8_25", arabic: "طَظُ", letters: ["tah", "zah"], audioId: "m8_25", units: ["tah-fatha", "zah-damma"] },
        { id: "m8_26", arabic: "تُوظَطِضَ", letters: ["dad", "taa", "tah", "zah"], audioId: "m8_26", units: ["taa-madd-damma", "zah-fatha", "tah-kasra", "dad-fatha"] },
        { id: "m8_27", arabic: "أَجَطِ", letters: ["alif", "jim", "tah"], audioId: "m8_27", units: ["alif-fatha", "jim-fatha", "tah-kasra"] },
        { id: "m8_28", arabic: "بَجِدَظَ", letters: ["baa", "dal", "jim", "zah"], audioId: "m8_28", units: ["baa-fatha", "jim-kasra", "dal-fatha", "zah-fatha"] },
        { id: "m9_15", arabic: "عِغِ", letters: ["ain", "ghain"], audioId: "m9_15", units: ["ain-kasra", "ghain-kasra"] },
        { id: "m9_16", arabic: "غُوظُعَحِ", letters: ["ain", "ghain", "haa", "zah"], audioId: "m9_16", units: ["ghain-madd-damma", "zah-damma", "ain-fatha", "haa-kasra"] },
        { id: "m9_17", arabic: "عَحُ", letters: ["ain", "haa"], audioId: "m9_17", units: ["ain-fatha", "haa-damma"] },
        { id: "m9_18", arabic: "صِسَغُعَا", letters: ["ain", "ghain", "sad", "seen"], audioId: "m9_18", units: ["sad-kasra", "seen-fatha", "ghain-damma", "ain-madd-fatha"] },
        { id: "m9_19", arabic: "غُعُو", letters: ["ain", "ghain"], audioId: "m9_19", units: ["ghain-damma", "ain-madd-damma"] },
        { id: "m9_20", arabic: "صُغِتَ", letters: ["ghain", "sad", "taa"], audioId: "m9_20", units: ["sad-damma", "ghain-kasra", "taa-fatha"] },
        { id: "m9_21", arabic: "عُدُثِ", letters: ["ain", "dal", "thaa"], audioId: "m9_21", units: ["ain-damma", "dal-damma", "thaa-kasra"] },
        { id: "m9_22", arabic: "غِعُ", letters: ["ain", "ghain"], audioId: "m9_22", units: ["ghain-kasra", "ain-damma"] },
        { id: "m9_23", arabic: "خَعُذَا", letters: ["ain", "khaa", "thal"], audioId: "m9_23", units: ["khaa-fatha", "ain-damma", "thal-madd-fatha"] },
        { id: "m9_24", arabic: "غِعَا", letters: ["ain", "ghain"], audioId: "m9_24", units: ["ghain-kasra", "ain-madd-fatha"] },
        { id: "m9_25", arabic: "عُصُتِ", letters: ["ain", "sad", "taa"], audioId: "m9_25", units: ["ain-damma", "sad-damma", "taa-kasra"] },
        { id: "m9_26", arabic: "رِيغُعِ", letters: ["ain", "ghain", "reh"], audioId: "m9_26", units: ["reh-madd-kasra", "ghain-damma", "ain-kasra"] },
        { id: "m9_27", arabic: "رُوغُعُ", letters: ["ain", "ghain", "reh"], audioId: "m9_27", units: ["reh-madd-damma", "ghain-damma", "ain-damma"] },
        { id: "m9_28", arabic: "إِيغَرَ", letters: ["alif", "ghain", "reh"], audioId: "m9_28", units: ["alif-madd-kasra", "ghain-fatha", "reh-fatha"] },
        { id: "m10_22", arabic: "قَفُو", letters: ["feh", "qaf"], audioId: "m10_22", units: ["qaf-fatha", "feh-madd-damma"] },
        { id: "m10_23", arabic: "قَكَ", letters: ["kaf", "qaf"], audioId: "m10_23", units: ["qaf-fatha", "kaf-fatha"] },
        { id: "m10_24", arabic: "رُكِيبُ", letters: ["baa", "kaf", "reh"], audioId: "m10_24", units: ["reh-damma", "kaf-madd-kasra", "baa-damma"] },
        { id: "m10_25", arabic: "فَقُرُ", letters: ["feh", "qaf", "reh"], audioId: "m10_25", units: ["feh-fatha", "qaf-damma", "reh-damma"] },
        { id: "m10_26", arabic: "فُوقِ", letters: ["feh", "qaf"], audioId: "m10_26", units: ["feh-madd-damma", "qaf-kasra"] },
        { id: "m10_27", arabic: "ظَكِيصِ", letters: ["kaf", "sad", "zah"], audioId: "m10_27", units: ["zah-fatha", "kaf-madd-kasra", "sad-kasra"] },
        { id: "m10_28", arabic: "فِبَقُ", letters: ["baa", "feh", "qaf"], audioId: "m10_28", units: ["feh-kasra", "baa-fatha", "qaf-damma"] },
        { id: "m10_29", arabic: "كِقِبَ", letters: ["baa", "kaf", "qaf"], audioId: "m10_29", units: ["kaf-kasra", "qaf-kasra", "baa-fatha"] },
        { id: "m10_30", arabic: "تُكَ", letters: ["kaf", "taa"], audioId: "m10_30", units: ["taa-damma", "kaf-fatha"] },
        { id: "m10_31", arabic: "كِفِ", letters: ["feh", "kaf"], audioId: "m10_31", units: ["kaf-kasra", "feh-kasra"] },
        { id: "m10_32", arabic: "عُقَ", letters: ["ain", "qaf"], audioId: "m10_32", units: ["ain-damma", "qaf-fatha"] },
        { id: "m10_33", arabic: "غُوكَتَ", letters: ["ghain", "kaf", "taa"], audioId: "m10_33", units: ["ghain-madd-damma", "kaf-fatha", "taa-fatha"] },
        { id: "m10_34", arabic: "فَقِ", letters: ["feh", "qaf"], audioId: "m10_34", units: ["feh-fatha", "qaf-kasra"] },
        { id: "m10_35", arabic: "تُقَصُ", letters: ["qaf", "sad", "taa"], audioId: "m10_35", units: ["taa-damma", "qaf-fatha", "sad-damma"] },
        { id: "m11_22", arabic: "رُدِلِ", letters: ["dal", "lam", "reh"], audioId: "m11_22", units: ["reh-damma", "dal-kasra", "lam-kasra"] },
        { id: "m11_23", arabic: "ظَمُلُبُ", letters: ["baa", "lam", "meem", "zah"], audioId: "m11_23", units: ["zah-fatha", "meem-damma", "lam-damma", "baa-damma"] },
        { id: "m11_24", arabic: "مُدُنِ", letters: ["dal", "meem", "noon"], audioId: "m11_24", units: ["meem-damma", "dal-damma", "noon-kasra"] },
        { id: "m11_25", arabic: "أُولَنُبُ", letters: ["alif", "baa", "lam", "noon"], audioId: "m11_25", units: ["alif-madd-damma", "lam-fatha", "noon-damma", "baa-damma"] },
        { id: "m11_26", arabic: "ضُمِي", letters: ["dad", "meem"], audioId: "m11_26", units: ["dad-damma", "meem-madd-kasra"] },
        { id: "m11_27", arabic: "ظَنَا", letters: ["noon", "zah"], audioId: "m11_27", units: ["zah-fatha", "noon-madd-fatha"] },
        { id: "m11_28", arabic: "سِلُ", letters: ["lam", "seen"], audioId: "m11_28", units: ["seen-kasra", "lam-damma"] },
        { id: "m11_29", arabic: "مُدُوبِ", letters: ["baa", "dal", "meem"], audioId: "m11_29", units: ["meem-damma", "dal-madd-damma", "baa-kasra"] },
        { id: "m11_30", arabic: "ضُقِنَجِ", letters: ["dad", "jim", "noon", "qaf"], audioId: "m11_30", units: ["dad-damma", "qaf-kasra", "noon-fatha", "jim-kasra"] },
        { id: "m11_31", arabic: "بِلُزِي", letters: ["baa", "lam", "zain"], audioId: "m11_31", units: ["baa-kasra", "lam-damma", "zain-madd-kasra"] },
        { id: "m11_32", arabic: "مِذُو", letters: ["meem", "thal"], audioId: "m11_32", units: ["meem-kasra", "thal-madd-damma"] },
        { id: "m11_33", arabic: "نِلِ", letters: ["lam", "noon"], audioId: "m11_33", units: ["noon-kasra", "lam-kasra"] },
        { id: "m11_34", arabic: "لِبَ", letters: ["baa", "lam"], audioId: "m11_34", units: ["lam-kasra", "baa-fatha"] },
        { id: "m11_35", arabic: "مَتِ", letters: ["meem", "taa"], audioId: "m11_35", units: ["meem-fatha", "taa-kasra"] },
        { id: "m12_22", arabic: "هَاظَ", letters: ["heh", "zah"], audioId: "m12_22", units: ["heh-madd-fatha", "zah-fatha"] },
        { id: "m12_23", arabic: "وَاضَ", letters: ["dad", "waw"], audioId: "m12_23", units: ["waw-madd-fatha", "dad-fatha"] },
        { id: "m12_24", arabic: "جِيِي", letters: ["jim", "yeh"], audioId: "m12_24", units: ["jim-kasra", "yeh-madd-kasra"] },
        { id: "m12_25", arabic: "فَهِ", letters: ["feh", "heh"], audioId: "m12_25", units: ["feh-fatha", "heh-kasra"] },
        { id: "m12_26", arabic: "بِيوِثِ", letters: ["baa", "thaa", "waw"], audioId: "m12_26", units: ["baa-madd-kasra", "waw-kasra", "thaa-kasra"] },
        { id: "m12_27", arabic: "وَيَ", letters: ["waw", "yeh"], audioId: "m12_27", units: ["waw-fatha", "yeh-fatha"] },
        { id: "m12_28", arabic: "وَاهَحَ", letters: ["haa", "heh", "waw"], audioId: "m12_28", units: ["waw-madd-fatha", "heh-fatha", "haa-fatha"] },
        { id: "m12_29", arabic: "وُوشَنُ", letters: ["noon", "sheen", "waw"], audioId: "m12_29", units: ["waw-madd-damma", "sheen-fatha", "noon-damma"] },
        { id: "m12_30", arabic: "يَارِوُ", letters: ["reh", "waw", "yeh"], audioId: "m12_30", units: ["yeh-madd-fatha", "reh-kasra", "waw-damma"] },
        { id: "m12_31", arabic: "أُهُعُيُ", letters: ["ain", "alif", "heh", "yeh"], audioId: "m12_31", units: ["alif-damma", "heh-damma", "ain-damma", "yeh-damma"] },
        { id: "m12_32", arabic: "زَوُفِي", letters: ["feh", "waw", "zain"], audioId: "m12_32", units: ["zain-fatha", "waw-damma", "feh-madd-kasra"] },
        { id: "m12_33", arabic: "دَاوَيَ", letters: ["dal", "waw", "yeh"], audioId: "m12_33", units: ["dal-madd-fatha", "waw-fatha", "yeh-fatha"] },
        { id: "m12_34", arabic: "هُوُو", letters: ["heh", "waw"], audioId: "m12_34", units: ["heh-damma", "waw-madd-damma"] },
        { id: "m12_35", arabic: "جَاحَوَ", letters: ["haa", "jim", "waw"], audioId: "m12_35", units: ["jim-madd-fatha", "haa-fatha", "waw-fatha"] }
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

      // Jeu "Place les harakat" : uniquement les mots dont TOUTES les
      // unites sont en voyelle simple (fatha/damma/kasra), sans
      // prolongation ni tanwin - le squelette de lettres est affiche,
      // l'enfant doit retrouver la bonne voyelle par l'oreille. Le
      // sukoun/chadda ne sont pas encore exploitables ici (audio non
      // isolable dans les enregistrements actuels du fascicule 4).
      function buildHarakatPool(moduleNumber) {
        return buildWordPool(moduleNumber).filter(function (w) {
          return w.units.every(function (u) { return OPEN_FORMS.indexOf(unitForm(u)) !== -1; });
        });
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
      var gameBackToMenuBtn = document.getElementById("gameBackToMenuBtn");
      var gameEndBackToMenuBtn = document.getElementById("gameEndBackToMenuBtn");
      var gameMenuScreen = document.getElementById("gameMenuScreen");
      var gameMenuHeading = document.getElementById("gameMenuHeading");
      var gameMenuLevelInfo = document.getElementById("gameMenuLevelInfo");
      var gameMenuGrid = document.getElementById("gameMenuGrid");
      var gameQuizPanel = document.getElementById("gameQuizPanel");
      var gameReadPanel = document.getElementById("gameReadPanel");
      var gameReadWord = document.getElementById("gameReadWord");
      var gameReadListenBtn = document.getElementById("gameReadListenBtn");
      var gameReadNextBtn = document.getElementById("gameReadNextBtn");
      var gameInstruction = document.getElementById("gameInstruction");
      var gamePlayBtn = document.getElementById("gamePlayBtn");
      var gameAnswers = document.getElementById("gameAnswers");
      var gameFeedback = document.getElementById("gameFeedback");
      var gameNextBtn = document.getElementById("gameNextBtn");
      var gameEndScore = document.getElementById("gameEndScore");
      var gameEndMessage = document.getElementById("gameEndMessage");
      var gameReplayBtn = document.getElementById("gameReplayBtn");
      var gameContinueBtn = document.getElementById("gameContinueBtn");
      var gamePrestartWarning = document.getElementById("gamePrestartWarning");
      var gamePrestartMessage = document.getElementById("gamePrestartMessage");
      var gamePrestartBackBtn = document.getElementById("gamePrestartBackBtn");
      var gamePrestartContinueBtn = document.getElementById("gamePrestartContinueBtn");
      var gameDicteePanel = document.getElementById("gameDicteePanel");
      var gameDicteeWord = document.getElementById("gameDicteeWord");
      var gameDicteeListenBtn = document.getElementById("gameDicteeListenBtn");
      var gameDicteeRevealBtn = document.getElementById("gameDicteeRevealBtn");
      var gameDicteeNextBtn = document.getElementById("gameDicteeNextBtn");
      var gameHarakatPanel = document.getElementById("gameHarakatPanel");
      var gameHarakatListenBtn = document.getElementById("gameHarakatListenBtn");
      var harakatSlots = document.getElementById("harakatSlots");
      var harakatPicker = document.getElementById("harakatPicker");
      var gameHarakatCheckBtn = document.getElementById("gameHarakatCheckBtn");
      var gameHarakatFeedback = document.getElementById("gameHarakatFeedback");
      var gameHarakatCorrect = document.getElementById("gameHarakatCorrect");
      var gameHarakatNextBtn = document.getElementById("gameHarakatNextBtn");
      var gameSortPanel = document.getElementById("gameSortPanel");
      var gameSortLetter = document.getElementById("gameSortLetter");
      var gameSortSunBtn = document.getElementById("gameSortSunBtn");
      var gameSortMoonBtn = document.getElementById("gameSortMoonBtn");
      var gameSortFeedback = document.getElementById("gameSortFeedback");
      var gameSortNextBtn = document.getElementById("gameSortNextBtn");
      var gameSortAllPanel = document.getElementById("gameSortAllPanel");
      var sortAllPool = document.getElementById("sortAllPool");
      var sortAllSunZone = document.getElementById("sortAllSunZone");
      var sortAllMoonZone = document.getElementById("sortAllMoonZone");
      var sortAllSunColumn = document.getElementById("sortAllSunColumn");
      var sortAllMoonColumn = document.getElementById("sortAllMoonColumn");
      var sortAllFeedback = document.getElementById("sortAllFeedback");
      var sortAllDoneMessage = document.getElementById("sortAllDoneMessage");
      var sortAllReplayBtn = document.getElementById("sortAllReplayBtn");
      var gameDictee1Panel = document.getElementById("gameDictee1Panel");
      var gameDictee1Words = document.getElementById("gameDictee1Words");
      var gameDictee1ListenBtn = document.getElementById("gameDictee1ListenBtn");
      var gameDictee1RevealBtn = document.getElementById("gameDictee1RevealBtn");
      var gameDictee1NextBtn = document.getElementById("gameDictee1NextBtn");

      var INSTRUCTION_TEXT = {
        sound: isEnglish ? "Listen, then choose the sound you heard." : "Écoute puis choisis le son que tu as entendu.",
        word: isEnglish ? "Listen, then choose the word you heard." : "Écoute puis choisis le mot que tu as entendu.",
        script: isEnglish ? "Which spelling is correct?" : "Quelle est la bonne écriture ?"
      };

      // Menu des jeux (nouvel ecran intermediaire entre la grille des
      // modules et l'interface complete d'un jeu) : une grande carte par
      // categorie, icone + titre uniquement (voir renderGameMenu).
      var GAME_MENU_ITEMS = {
        sound: { icon: "🎧", title: isEnglish ? "Recognize the sound" : "Reconnaître le son" },
        word: { icon: "📖", title: isEnglish ? "Recognize the word" : "Reconnaître le mot" },
        read: { icon: "🗣️", title: isEnglish ? "Read a word" : "Lire un mot" },
        dictee: { icon: "✍️", title: isEnglish ? "Pure dictation" : "Dictée pure" },
        harakat: { icon: "🖍️", title: isEnglish ? "Place the harakāt" : "Place les harakāt" },
        script: { icon: "✍️", title: isEnglish ? "The correct spelling" : "La bonne écriture" },
        sort: { icon: "☀️🌙", title: isEnglish ? "Sun or moon?" : "Solaire ou lunaire ?" },
        sortall: { icon: "🗂️", title: isEnglish ? "Sort all the letters" : "Trie toutes les lettres" }
      };
      var SUN_MOON_MENU_ITEMS = [
        { category: "script", disabled: false },
        { category: "sort", disabled: false },
        { category: "sortall", disabled: false }
      ];

      // Banque verifiee pour "Je choisis la bonne ecriture" : pour chaque
      // mot, la forme incorrecte ne change QU'UNE seule chose, toujours liee
      // a la notion travaillee - jamais une faute arbitraire. Lettre
      // solaire : la forme incorrecte retire la Shadda. Lettre lunaire : la
      // forme incorrecte ajoute une Shadda qui n'existe pas. minModule =
      // module le plus eleve parmi les lettres du mot (deduit a la main et
      // verifie, comme pour la table de reference du Module 13).
      var SCRIPT_CHOICE_WORDS = [
        { id: "tamr", correct: "التَّمْر", incorrect: "التَمْر", type: "sun", letter: "ت", minModule: 2 },
        { id: "thaalab", correct: "الثَّعْلَب", incorrect: "الثَعْلَب", type: "sun", letter: "ث", minModule: 3 },
        { id: "dars", correct: "الدَّرْس", incorrect: "الدَرْس", type: "sun", letter: "د", minModule: 4 },
        { id: "dhura", correct: "الذُّرَة", incorrect: "الذُرَة", type: "sun", letter: "ذ", minModule: 4 },
        { id: "rajul", correct: "الرَّجُل", incorrect: "الرَجُل", type: "sun", letter: "ر", minModule: 5 },
        { id: "zujaj", correct: "الزُّجَاج", incorrect: "الزُجَاج", type: "sun", letter: "ز", minModule: 5 },
        { id: "samak", correct: "السَّمَك", incorrect: "السَمَك", type: "sun", letter: "س", minModule: 6 },
        { id: "shams", correct: "الشَّمْس", incorrect: "الشَمْس", type: "sun", letter: "ش", minModule: 6 },
        { id: "saqr", correct: "الصَّقْر", incorrect: "الصَقْر", type: "sun", letter: "ص", minModule: 7 },
        { id: "difda", correct: "الضَّفْدَع", incorrect: "الضَفْدَع", type: "sun", letter: "ض", minModule: 7 },
        { id: "tifl", correct: "الطِّفْل", incorrect: "الطِفْل", type: "sun", letter: "ط", minModule: 8 },
        { id: "zalam", correct: "الظَّلَام", incorrect: "الظَلَام", type: "sun", letter: "ظ", minModule: 8 },
        { id: "lugha", correct: "اللُّغَة", incorrect: "اللُغَة", type: "sun", letter: "ل", minModule: 11 },
        { id: "najm", correct: "النَّجْم", incorrect: "النَجْم", type: "sun", letter: "ن", minModule: 11 },
        { id: "tajir", correct: "التَّاجِر", incorrect: "التَاجِر", type: "sun", letter: "ت", minModule: 5 },
        { id: "nazar", correct: "النَّظَر", incorrect: "النَظَر", type: "sun", letter: "ن", minModule: 11 },
        { id: "bab", correct: "الْبَاب", incorrect: "الْبَّاب", type: "moon", letter: "ب", minModule: 2 },
        { id: "jamal", correct: "الْجَمَل", incorrect: "الْجَّمَل", type: "moon", letter: "ج", minModule: 3 },
        { id: "hisan", correct: "الْحِصَان", incorrect: "الْحِّصَان", type: "moon", letter: "ح", minModule: 3 },
        { id: "khubz", correct: "الْخُبْز", incorrect: "الْخُّبْز", type: "moon", letter: "خ", minModule: 3 },
        { id: "asal", correct: "الْعَسَل", incorrect: "الْعَّسَل", type: "moon", letter: "ع", minModule: 9 },
        { id: "ghurab", correct: "الْغُرَاب", incorrect: "الْغُّرَاب", type: "moon", letter: "غ", minModule: 9 },
        { id: "faras", correct: "الْفَرَس", incorrect: "الْفَّرَس", type: "moon", letter: "ف", minModule: 10 },
        { id: "qamar", correct: "الْقَمَر", incorrect: "الْقَّمَر", type: "moon", letter: "ق", minModule: 10 },
        { id: "kalb", correct: "الْكَلْب", incorrect: "الْكَّلْب", type: "moon", letter: "ك", minModule: 10 },
        { id: "matar", correct: "الْمَطَر", incorrect: "الْمَّطَر", type: "moon", letter: "م", minModule: 11 },
        { id: "hilal", correct: "الْهِلَال", incorrect: "الْهِّلَال", type: "moon", letter: "ه", minModule: 12 },
        { id: "warda", correct: "الْوَرْدَة", incorrect: "الْوَّرْدَة", type: "moon", letter: "و", minModule: 12 },
        { id: "yad", correct: "الْيَد", incorrect: "الْيَّد", type: "moon", letter: "ي", minModule: 12 },
        { id: "bahr", correct: "الْبَحْر", incorrect: "الْبَّحْر", type: "moon", letter: "ب", minModule: 5 },
        { id: "kitab", correct: "الْكِتَاب", incorrect: "الْكِّتَاب", type: "moon", letter: "ك", minModule: 10 },
        { id: "farah", correct: "الْفَرْح", incorrect: "الْفَّرْح", type: "moon", letter: "ف", minModule: 10 }
      ];

      var HARAKAT_MARK = { fatha: "َ", damma: "ُ", kasra: "ِ" };
      var HARAKAT_ORDER = ["fatha", "damma", "kasra"];
      var HARAKAT_LABEL = {
        fatha: "ـ" + HARAKAT_MARK.fatha,
        damma: "ـ" + HARAKAT_MARK.damma,
        kasra: "ـ" + HARAKAT_MARK.kasra
      };
      // Categories ayant un score objectif (bonne/mauvaise reponse) : seules
      // celles-ci passent par la regle des 80% en fin de serie. "read" et
      // "dictee" sont auto-corrigees par l'enfant, sans score mesurable.
      var SCORED_CATEGORIES = { sound: true, word: true, harakat: true, script: true, sort: true };

      function buildScriptChoicePool(moduleNumber) {
        return SCRIPT_CHOICE_WORDS.filter(function (w) { return w.minModule <= Number(moduleNumber); });
      }

      // "Solaire ou lunaire ?" : classification des 28 lettres dans la
      // bonne colonne. Duplique volontairement SUN_MOON_TYPE (deja defini
      // dans le bloc "Formes des lettres", non accessible depuis cette
      // page) - meme pattern que cumulativeLetterIds duplique ailleurs.
      var SORT_LETTER_TYPE = {
        taa: "sun", thaa: "sun", dal: "sun", thal: "sun", reh: "sun", zain: "sun",
        seen: "sun", sheen: "sun", sad: "sun", dad: "sun", tah: "sun", zah: "sun",
        lam: "sun", noon: "sun",
        alif: "moon", baa: "moon", jim: "moon", haa: "moon", khaa: "moon",
        ain: "moon", ghain: "moon", feh: "moon", qaf: "moon", kaf: "moon",
        meem: "moon", heh: "moon", waw: "moon", yeh: "moon"
      };

      function buildSortPool() {
        var ids = [];
        MODULES.forEach(function (m) { ids = ids.concat(m.letterIds); });
        return ids.map(function (id) { return { id: id, type: SORT_LETTER_TYPE[id] }; });
      }

      var gameAudio = null;
      var gameState = null;

      // Historique (en memoire, le temps de la session) des mots deja vus
      // par categorie et par module : sert a eviter de faire revoir tout de
      // suite les memes mots d'une serie a l'autre. Jamais persiste sur
      // disque - repart a zero au rechargement de la page.
      var recentWordHistory = {};
      function markRecentWord(category, moduleNumber, key) {
        var histKey = category + "_" + moduleNumber;
        var entry = recentWordHistory[histKey];
        if (!entry) { entry = recentWordHistory[histKey] = { order: [], has: {} }; }
        if (!entry.has[key]) {
          entry.order.push(key);
          entry.has[key] = true;
          if (entry.order.length > 24) { delete entry.has[entry.order.shift()]; }
        }
      }
      function recentWordSet(category, moduleNumber) {
        var entry = recentWordHistory[category + "_" + moduleNumber];
        return entry ? entry.has : {};
      }

      // Meilleur score (%) obtenu par module, toutes categories notees
      // confondues (sound/word/harakat) : persiste entre les visites via
      // localStorage, pour savoir si un module a deja ete "maitrise" (>=80%)
      // quand l'enfant revient sur le site plus tard. Ne bloque jamais rien
      // par lui-meme - sert uniquement a afficher un rappel non contraignant.
      var MODULE_PROGRESS_KEY = "ahlArabiyahModuleProgress";
      function loadModuleProgress() {
        try {
          return JSON.parse(localStorage.getItem(MODULE_PROGRESS_KEY)) || {};
        } catch (e) {
          return {};
        }
      }
      function getModuleBestPct(moduleNumber) {
        var data = loadModuleProgress();
        return data[moduleNumber] || 0;
      }
      function saveModuleBestPct(moduleNumber, pct) {
        try {
          var data = loadModuleProgress();
          if (!data[moduleNumber] || pct > data[moduleNumber]) {
            data[moduleNumber] = pct;
            localStorage.setItem(MODULE_PROGRESS_KEY, JSON.stringify(data));
          }
        } catch (e) {
          // localStorage indisponible (navigation privee, etc.) : on
          // continue sans memoriser, le jeu reste jouable.
        }
      }

      // Modules ou l'enfant a volontairement choisi "Acceder quand meme"
      // malgre un score < 80% sur le module precedent. Une fois ce choix
      // fait, le module reste accessible sans redemander a chaque visite -
      // separe du score lui-meme (l'acces force ne compte jamais comme une
      // reussite du module precedent).
      var MODULE_OVERRIDE_KEY = "ahlArabiyahModuleOverrides";
      function loadModuleOverrides() {
        try {
          return JSON.parse(localStorage.getItem(MODULE_OVERRIDE_KEY)) || {};
        } catch (e) {
          return {};
        }
      }
      function hasModuleOverride(moduleNumber) {
        return !!loadModuleOverrides()[moduleNumber];
      }
      function saveModuleOverride(moduleNumber) {
        try {
          var data = loadModuleOverrides();
          data[moduleNumber] = true;
          localStorage.setItem(MODULE_OVERRIDE_KEY, JSON.stringify(data));
        } catch (e) {
          // localStorage indisponible : le rappel pourra reapparaitre au
          // prochain clic, sans autre consequence.
        }
      }

      // Etat d'un module dans la liste : "available" (module 1, jamais de
      // prerequis), "unlocked" (module precedent >= 80%), "override" (acces
      // force accepte volontairement) ou "locked" (recommandation des 80%
      // pas encore atteinte, pas encore contournee).
      function moduleUnlockState(moduleNumber) {
        if (Number(moduleNumber) <= 1) return "available";
        var prevPct = getModuleBestPct(Number(moduleNumber) - 1);
        if (prevPct >= 80) return "unlocked";
        if (hasModuleOverride(moduleNumber)) return "override";
        return "locked";
      }

      function refreshModuleBadges() {
        gameBtns.forEach(function (btn) {
          var moduleNumber = btn.getAttribute("data-module");
          var card = btn.closest(".module-card");
          if (!card) return;
          var state = moduleUnlockState(moduleNumber);
          var badge = card.querySelector(".module-status");
          if (!badge) {
            badge = document.createElement("p");
            badge.className = "module-status";
            var progress = card.querySelector(".module-progress");
            if (progress && progress.nextSibling) {
              card.insertBefore(badge, progress.nextSibling);
            } else {
              card.insertBefore(badge, btn);
            }
          }
          badge.className = "module-status module-status-" + state;
          if (state === "available") {
            badge.textContent = isEnglish ? "🟢 Available" : "🟢 Disponible";
          } else if (state === "unlocked") {
            badge.textContent = isEnglish ? "🟢 Unlocked" : "🟢 Débloqué";
          } else if (state === "override") {
            badge.textContent = isEnglish ? "🟡 Access granted" : "🟡 Accès autorisé";
          } else {
            badge.textContent = isEnglish ? "🔒 80% recommended" : "🔒 80% recommandé";
          }
        });
      }

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
        gameEndScore.textContent = gameState.category === "read"
          ? (isEnglish ? "You read " + QUESTIONS_PER_ROUND + " words!" : "Tu as lu " + QUESTIONS_PER_ROUND + " mots !")
          : gameState.category === "dictee"
            ? (isEnglish ? "You wrote " + QUESTIONS_PER_ROUND + " words!" : "Tu as écrit " + QUESTIONS_PER_ROUND + " mots !")
            : gameState.score + " / " + QUESTIONS_PER_ROUND;

        // Regle des 80% : recommande la suite ou l'entrainement, mais ne
        // bloque JAMAIS l'acces au module suivant - uniquement pour les
        // categories a score objectif (SCORED_CATEGORIES).
        var nextModuleBtn = document.querySelector('.js-open-game[data-module="' + (Number(gameState.moduleNumber) + 1) + '"]');
        if (SCORED_CATEGORIES[gameState.category]) {
          var pct = Math.round((gameState.score / QUESTIONS_PER_ROUND) * 100);
          saveModuleBestPct(gameState.moduleNumber, pct);
          refreshModuleBadges();
          gameEndMessage.hidden = false;
          if (pct >= 80) {
            gameEndMessage.textContent = isEnglish
              ? "Well done! You've mastered this level enough to move on to the next module."
              : "Bravo ! Tu maîtrises suffisamment ce niveau pour passer au module suivant.";
            gameContinueBtn.textContent = isEnglish ? "Continue to next module →" : "Continuer vers le module suivant →";
          } else {
            gameEndMessage.textContent = isEnglish
              ? "You can move on to the next module, but it would be better to practice this module a bit more to really master these sounds before continuing."
              : "Tu peux continuer vers le module suivant, mais il serait préférable de t'entraîner encore un peu sur ce module pour bien maîtriser les sons avant de poursuivre.";
            gameContinueBtn.textContent = isEnglish ? "Continue anyway →" : "Continuer quand même →";
          }
          gameContinueBtn.hidden = !nextModuleBtn;
        } else {
          gameEndMessage.hidden = true;
          gameContinueBtn.hidden = true;
        }
      }

      function nextQuestion() {
        if (gameState.questionIndex >= QUESTIONS_PER_ROUND) {
          showEnd();
          return;
        }
        if (gameState.category === "read") {
          nextReadQuestion();
          return;
        }
        if (gameState.category === "dictee") {
          nextDicteeQuestion();
          return;
        }
        if (gameState.category === "harakat") {
          nextHarakatQuestion();
          return;
        }
        if (gameState.category === "script") {
          nextScriptQuestion();
          return;
        }
        if (gameState.category === "sort") {
          nextSortQuestion();
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
            renderArabicText(btn, stretchArabic(choice.arabic));
          } else {
            btn.className = "letterlab-cell game-answer";
            renderLetterForm(btn, choice.text, choice.baseLen);
          }
          btn.addEventListener("click", function () { onAnswer(choice, btn); });
          gameAnswers.appendChild(btn);
        });
      }

      // "Lire un mot" : aucun choix a faire, aucun audio automatique.
      // L'enfant voit le mot, le lit a voix haute, puis declenche
      // lui-meme l'ecoute pour se corriger. Reutilise le meme pool que
      // "Reconnaitre le mot" (buildWordPool) : memes mots/pseudo-mots,
      // memes enregistrements humains, meme regle cumulative par module.
      function nextReadQuestion() {
        var pool = gameState.pool;
        var recentSet = recentWordSet("read", gameState.moduleNumber);

        // Priorite : mots pas encore vus dans cette serie ET pas vus
        // recemment dans une serie precedente de ce module. Si le module
        // n'a pas assez de mots pour satisfaire les deux a la fois, on
        // relache d'abord la contrainte "recent", puis en dernier recours
        // la contrainte "serie en cours".
        var notUsed = pool.filter(function (item) { return !gameState.usedKeys[item.key]; });
        var notUsedAndFresh = notUsed.filter(function (item) { return !recentSet[item.key]; });
        var candidates = notUsedAndFresh.length ? notUsedAndFresh : (notUsed.length ? notUsed : pool);
        if (!notUsed.length) { gameState.usedKeys = {}; }

        var correct = pickWeighted(candidates, gameState.moduleNumber);
        gameState.usedKeys[correct.key] = true;
        markRecentWord("read", gameState.moduleNumber, correct.key);
        gameState.questionIndex += 1;
        gameState.current = { correct: correct, listened: false };

        renderArabicText(gameReadWord, stretchArabic(correct.arabic));
        gameReadListenBtn.textContent = isEnglish ? "🔊 Listen" : "🔊 Écouter";
        gameReadNextBtn.hidden = true;
        gameScoreEl.textContent = (isEnglish ? "Word " : "Mot ") + gameState.questionIndex + " / " + QUESTIONS_PER_ROUND;
      }

      // "Dictee pure" : l'enfant entend le mot (jamais affiche a l'ecran)
      // et l'ecrit lui-meme sur une feuille, sans choix ni indice. La
      // correction n'apparait qu'a sa demande, via "Afficher la
      // correction" - jamais automatiquement. Reutilise le meme pool que
      // "Reconnaitre le mot"/"Lire un mot" (memes mots, memes audios),
      // avec son propre historique anti-repetition.
      function nextDicteeQuestion() {
        var pool = gameState.pool;
        var recentSet = recentWordSet("dictee", gameState.moduleNumber);

        var notUsed = pool.filter(function (item) { return !gameState.usedKeys[item.key]; });
        var notUsedAndFresh = notUsed.filter(function (item) { return !recentSet[item.key]; });
        var candidates = notUsedAndFresh.length ? notUsedAndFresh : (notUsed.length ? notUsed : pool);
        if (!notUsed.length) { gameState.usedKeys = {}; }

        var correct = pickWeighted(candidates, gameState.moduleNumber);
        gameState.usedKeys[correct.key] = true;
        markRecentWord("dictee", gameState.moduleNumber, correct.key);
        gameState.questionIndex += 1;
        gameState.current = { correct: correct };

        renderArabicText(gameDicteeWord, stretchArabic(correct.arabic));
        gameDicteeWord.hidden = true;
        gameDicteeListenBtn.textContent = isEnglish ? "🔊 Listen" : "🔊 Écouter";
        gameDicteeRevealBtn.hidden = false;
        gameDicteeNextBtn.hidden = true;
        gameScoreEl.textContent = (isEnglish ? "Word " : "Mot ") + gameState.questionIndex + " / " + QUESTIONS_PER_ROUND;
      }

      // "J'ecoute et je place les harakat" : le squelette de lettres est
      // affiche, l'enfant doit entendre le mot et poser la bonne voyelle
      // (fatha/damma/kasra) sur chaque lettre avant de valider. Pool filtre
      // par buildHarakatPool (voyelles simples uniquement pour l'instant).
      function nextHarakatQuestion() {
        var pool = gameState.pool;
        var recentSet = recentWordSet("harakat", gameState.moduleNumber);

        var notUsed = pool.filter(function (item) { return !gameState.usedKeys[item.key]; });
        var notUsedAndFresh = notUsed.filter(function (item) { return !recentSet[item.key]; });
        var candidates = notUsedAndFresh.length ? notUsedAndFresh : (notUsed.length ? notUsed : pool);
        if (!notUsed.length) { gameState.usedKeys = {}; }

        var correct = pickWeighted(candidates, gameState.moduleNumber);
        gameState.usedKeys[correct.key] = true;
        markRecentWord("harakat", gameState.moduleNumber, correct.key);
        gameState.questionIndex += 1;
        gameState.current = { correct: correct, slots: [], armedForm: null, checked: false };

        renderHarakatSlots(correct);
        renderHarakatPicker();
        gameHarakatCheckBtn.hidden = true;
        gameHarakatFeedback.hidden = true;
        gameHarakatFeedback.className = "game-feedback";
        gameHarakatCorrect.hidden = true;
        gameHarakatNextBtn.hidden = true;
        renderScore();
      }

      function renderHarakatSlotContent(idx) {
        var slot = gameState.current.slots[idx];
        var placeholder = harakatSlots.children[idx].querySelector(".harakat-slot-placeholder");
        placeholder.textContent = slot.filled ? HARAKAT_MARK[slot.filled] : "";
        placeholder.className = "harakat-slot-placeholder" + (slot.filled ? " harakat-slot-placeholder-" + slot.filled : "");
      }

      function assignArmedToSlot(idx) {
        if (gameState.current.checked) return;
        var form = gameState.current.armedForm;
        if (!form) return;
        gameState.current.slots[idx].filled = form;
        renderHarakatSlotContent(idx);
        gameState.current.armedForm = null;
        Array.prototype.forEach.call(harakatPicker.children, function (b) { b.classList.remove("is-armed"); });
        var allFilled = gameState.current.slots.every(function (s) { return s.filled; });
        gameHarakatCheckBtn.hidden = !allFilled;
      }

      function renderHarakatSlots(correct) {
        harakatSlots.innerHTML = "";
        gameState.current.slots = correct.units.map(function (unitId) {
          return { unitId: unitId, filled: null };
        });
        gameState.current.slots.forEach(function (slot, idx) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "harakat-slot";
          var baseSpan = document.createElement("span");
          baseSpan.className = "harakat-slot-base";
          baseSpan.textContent = ALL_LETTERS_BY_ID[unitLetter(slot.unitId)].char;
          var placeholder = document.createElement("span");
          placeholder.className = "harakat-slot-placeholder";
          btn.appendChild(baseSpan);
          btn.appendChild(placeholder);
          btn.addEventListener("click", function () { assignArmedToSlot(idx); });
          harakatSlots.appendChild(btn);
        });
      }

      function armHarakat(form, btnEl) {
        if (gameState.current.checked) return;
        var alreadyArmed = gameState.current.armedForm === form;
        Array.prototype.forEach.call(harakatPicker.children, function (b) { b.classList.remove("is-armed"); });
        gameState.current.armedForm = alreadyArmed ? null : form;
        if (!alreadyArmed) { btnEl.classList.add("is-armed"); }
      }

      function renderHarakatPicker() {
        harakatPicker.innerHTML = "";
        HARAKAT_ORDER.forEach(function (form) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "harakat-picker-btn harakat-picker-btn-" + form;
          btn.textContent = HARAKAT_LABEL[form];
          btn.addEventListener("click", function () { armHarakat(form, btn); });
          harakatPicker.appendChild(btn);
        });
      }

      // "Je choisis la bonne ecriture" : deux cartes (une correcte, une
      // avec une erreur solaire/lunaire volontaire), position gauche/droite
      // aleatoire. Reutilise entierement le panneau "Reconnaitre le mot"
      // (gameQuizPanel/gameAnswers) - seule la logique de correction change
      // (onScriptAnswer), pour pouvoir afficher une explication courte.
      function nextScriptQuestion() {
        var pool = gameState.pool;
        var recentSet = recentWordSet("script", gameState.moduleNumber);

        var notUsed = pool.filter(function (item) { return !gameState.usedKeys[item.id]; });
        var notUsedAndFresh = notUsed.filter(function (item) { return !recentSet[item.id]; });
        var candidates = notUsedAndFresh.length ? notUsedAndFresh : (notUsed.length ? notUsed : pool);
        if (!notUsed.length) { gameState.usedKeys = {}; }

        var item = pickWeighted(candidates, gameState.moduleNumber);
        gameState.usedKeys[item.id] = true;
        markRecentWord("script", gameState.moduleNumber, item.id);
        gameState.questionIndex += 1;

        var choices = Math.random() < 0.5
          ? [{ key: "correct", text: item.correct }, { key: "wrong", text: item.incorrect }]
          : [{ key: "wrong", text: item.incorrect }, { key: "correct", text: item.correct }];
        gameState.current = { item: item, choices: choices, answered: false };

        gameFeedback.hidden = true;
        gameFeedback.className = "game-feedback";
        gameFeedback.textContent = "";
        gameNextBtn.hidden = true;
        renderScore();

        gameAnswers.innerHTML = "";
        gameAnswers.classList.add("game-answers-word");
        choices.forEach(function (choice) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "letterlab-cell game-answer game-answer-word game-answer-script";
          renderArabicText(btn, stretchArabic(choice.text));
          btn.addEventListener("click", function () { onScriptAnswer(choice, btn); });
          gameAnswers.appendChild(btn);
        });
      }

      function onScriptAnswer(choice, btnEl) {
        if (gameState.current.answered) return;
        gameState.current.answered = true;
        var isCorrect = choice.key === "correct";
        if (isCorrect) { gameState.score += 1; }

        Array.prototype.forEach.call(gameAnswers.children, function (btn) {
          btn.disabled = true;
        });
        btnEl.classList.add(isCorrect ? "is-correct" : "is-wrong");
        if (!isCorrect) {
          Array.prototype.forEach.call(gameAnswers.children, function (btn, idx) {
            if (gameState.current.choices[idx].key === "correct") { btn.classList.add("is-correct"); }
          });
        }

        var item = gameState.current.item;
        var explain = item.type === "sun"
          ? (isEnglish
              ? item.letter + " is a sun letter: the Shadda appears on " + item.letter + "."
              : item.letter + " est une lettre solaire : la Shadda apparaît sur " + item.letter + ".")
          : (isEnglish
              ? item.letter + " is a moon letter: no Shadda, the ل is pronounced."
              : item.letter + " est une lettre lunaire : pas de Shadda, le ل se prononce.");

        gameFeedback.hidden = false;
        gameFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        gameFeedback.textContent = (isCorrect
          ? (isEnglish ? "Correct! " : "Bravo ! ")
          : (isEnglish ? "Not quite — " : "Ce n'était pas ça — ")) + explain;

        gameNextBtn.hidden = false;
        renderScore();
      }

      // "Solaire ou lunaire ?" : une lettre a la fois, l'enfant la place
      // dans la bonne colonne (clic direct sur la colonne, pas de drag&drop
      // - plus fiable sur mobile, meme logique "on touche pour poser" que
      // les autres jeux). Les 28 lettres tournent, avec anti-repetition.
      function nextSortQuestion() {
        var pool = gameState.pool;
        var recentSet = recentWordSet("sort", gameState.moduleNumber);

        var notUsed = pool.filter(function (item) { return !gameState.usedKeys[item.id]; });
        var notUsedAndFresh = notUsed.filter(function (item) { return !recentSet[item.id]; });
        var candidates = notUsedAndFresh.length ? notUsedAndFresh : (notUsed.length ? notUsed : pool);
        if (!notUsed.length) { gameState.usedKeys = {}; }

        var item = pickWeighted(candidates, gameState.moduleNumber);
        gameState.usedKeys[item.id] = true;
        markRecentWord("sort", gameState.moduleNumber, item.id);
        gameState.questionIndex += 1;
        gameState.current = { item: item, answered: false };

        gameSortLetter.textContent = ALL_LETTERS_BY_ID[item.id].char;
        gameSortSunBtn.disabled = false;
        gameSortMoonBtn.disabled = false;
        gameSortSunBtn.classList.remove("is-correct", "is-wrong");
        gameSortMoonBtn.classList.remove("is-correct", "is-wrong");
        gameSortFeedback.hidden = true;
        gameSortFeedback.className = "game-feedback";
        gameSortFeedback.textContent = "";
        gameSortNextBtn.hidden = true;
        renderScore();
      }

      function onSortAnswer(type, btnEl) {
        if (gameState.current.answered) return;
        gameState.current.answered = true;
        var item = gameState.current.item;
        var isCorrect = type === item.type;
        if (isCorrect) { gameState.score += 1; }

        gameSortSunBtn.disabled = true;
        gameSortMoonBtn.disabled = true;
        btnEl.classList.add(isCorrect ? "is-correct" : "is-wrong");
        if (!isCorrect) {
          (item.type === "sun" ? gameSortSunBtn : gameSortMoonBtn).classList.add("is-correct");
        }

        var letterChar = ALL_LETTERS_BY_ID[item.id].char;
        var explain = item.type === "sun"
          ? (isEnglish
              ? letterChar + " is a sun letter."
              : letterChar + " est une lettre solaire.")
          : (isEnglish
              ? letterChar + " is a moon letter."
              : letterChar + " est une lettre lunaire.");

        gameSortFeedback.hidden = false;
        gameSortFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        gameSortFeedback.textContent = (isCorrect
          ? (isEnglish ? "Correct! " : "Bravo ! ")
          : (isEnglish ? "Not quite — " : "Ce n'était pas ça — ")) + explain;

        gameSortNextBtn.hidden = false;
        renderScore();
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

      // Affiche le bon panneau interne selon la categorie choisie dans le
      // menu des jeux (voir renderGameMenu/enterGame). Ne gere plus aucun
      // onglet - la selection du jeu se fait desormais entierement via le
      // menu, avant d'arriver ici.
      function setActiveTab(category) {
        gameInstruction.textContent = INSTRUCTION_TEXT[category] || "";
        gameQuizPanel.hidden = category !== "sound" && category !== "word" && category !== "script";
        // Pas d'audio pour "script"/"sort" (comparaisons/classification
        // visuelles, voir analyses validees) : le bouton "Ecouter" du
        // panneau partage n'a pas lieu d'etre pour ces categories.
        gamePlayBtn.hidden = category === "script" || category === "sort";
        gameReadPanel.hidden = category !== "read";
        gameDicteePanel.hidden = category !== "dictee";
        gameHarakatPanel.hidden = category !== "harakat";
        gameSortPanel.hidden = category !== "sort";
        gameSortAllPanel.hidden = true;
        gameDictee1Panel.hidden = true;
      }

      // Construit la liste des jeux disponibles pour un module 1-12 (le
      // Module 13 utilise SUN_MOON_MENU_ITEMS, fixe). "sound" est toujours
      // disponible ; les autres categories n'apparaissent qu'a partir du
      // Module 2 et sont grisees si leur reserve de mots est insuffisante
      // (meme logique que l'ancienne barre d'onglets).
      function buildModuleMenuItems(moduleNumber) {
        var items = [{ category: "sound", disabled: false }];
        if (Number(moduleNumber) > 1) {
          var wordReady = buildWordPool(moduleNumber).length >= 2;
          items.push({ category: "word", disabled: !wordReady });
          items.push({ category: "read", disabled: !wordReady });
          items.push({ category: "dictee", disabled: !wordReady });
          var harakatReady = buildHarakatPool(moduleNumber).length >= 2;
          items.push({ category: "harakat", disabled: !harakatReady });
        }
        return items;
      }

      function startRound(moduleNumber, title, category) {
        var pool = category === "sound" ? buildSoundPool(moduleNumber)
          : category === "harakat" ? buildHarakatPool(moduleNumber)
          : category === "script" ? buildScriptChoicePool(moduleNumber)
          : category === "sort" ? buildSortPool()
          : buildWordPool(moduleNumber);
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

      // Menu des jeux : ecran intermediaire obligatoire entre la grille des
      // modules et l'interface complete d'un jeu (voir analyse validee -
      // on ne doit jamais arriver directement dans le premier jeu).
      var menuModuleNumber = null;
      var menuTitle = null;

      function renderGameMenu(items) {
        gameMenuGrid.className = "game-menu-grid";
        gameMenuGrid.innerHTML = "";
        items.forEach(function (item) {
          var def = GAME_MENU_ITEMS[item.category];
          var card = document.createElement("button");
          card.type = "button";
          card.className = "game-menu-card" + (item.disabled ? " is-disabled" : "");
          card.disabled = item.disabled;
          var icon = document.createElement("span");
          icon.className = "game-menu-icon";
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = def.icon;
          var label = document.createElement("span");
          label.className = "game-menu-label";
          label.textContent = def.title;
          card.appendChild(icon);
          card.appendChild(label);
          if (!item.disabled) {
            card.addEventListener("click", function () { enterGame(item.category); });
          }
          gameMenuGrid.appendChild(card);
        });
      }

      function openGameMenu(moduleNumber, title, items) {
        menuModuleNumber = moduleNumber;
        menuTitle = title;
        gameModalTitle.textContent = title;
        gameMenuHeading.textContent = isEnglish ? "Games — Module " + moduleNumber : "Jeux du Module " + moduleNumber;
        var letterCount = cumulativeLetterCount(moduleNumber);
        gameMenuLevelInfo.textContent = isEnglish
          ? "Letters learned so far: " + letterCount
          : "Lettres apprises : " + letterCount;
        renderGameMenu(items);
        gamePrestartWarning.hidden = true;
        gameBody.hidden = true;
        gameEnd.hidden = true;
        gameMenuScreen.hidden = false;
      }

      function enterGame(category) {
        gameMenuScreen.hidden = true;
        if (category === "sortall") {
          startSortAllGame();
          return;
        }
        startRound(menuModuleNumber, menuTitle, category);
      }

      function startGame(moduleNumber, title) {
        openGameMenu(moduleNumber, title, buildModuleMenuItems(moduleNumber));
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      // Module 13 regroupe les 3 jeux "lettres solaires et lunaires" sous
      // une seule carte : le menu propose "La bonne ecriture", "Solaire ou
      // lunaire ?" (round/score existant) et "Trie toutes les lettres"
      // (activite libre a part, voir startSortAllGame).
      function startSunMoonGame(title) {
        openGameMenu("13", title, SUN_MOON_MENU_ITEMS);
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      // "Trie toutes les lettres" : les 28 lettres en vrac, deux colonnes.
      // Activite libre (pas de round de 10 questions, pas de regle des
      // 80%) : on classe tout le monde une fois, puis score final +
      // Recommencer. Interaction "armer -> poser" (on touche une lettre du
      // pool, puis la colonne ou on pense qu'elle va), meme logique que le
      // jeu Harakat, plus fiable que le drag&drop sur mobile.
      function shuffleArray(list) {
        var arr = list.slice();
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
      }

      var sortAllState = null;

      function showSortAllPanel() {
        gameQuizPanel.hidden = true;
        gameReadPanel.hidden = true;
        gameDicteePanel.hidden = true;
        gameHarakatPanel.hidden = true;
        gameSortPanel.hidden = true;
        gameSortAllPanel.hidden = false;
        gameDictee1Panel.hidden = true;
      }

      function startSortAllGame() {
        gamePrestartWarning.hidden = true;
        gameMenuScreen.hidden = true;
        gameModalTitle.textContent = menuTitle;
        gameLevelInfo.textContent = "";
        gameScoreEl.textContent = "";
        gameBody.hidden = false;
        gameEnd.hidden = true;
        showSortAllPanel();

        sortAllState = { pool: shuffleArray(buildSortPool()), armedId: null, correctCount: 0, total: 0, remaining: 0 };
        sortAllState.total = sortAllState.pool.length;
        sortAllState.remaining = sortAllState.pool.length;

        sortAllSunColumn.innerHTML = "";
        sortAllMoonColumn.innerHTML = "";
        sortAllFeedback.hidden = true;
        sortAllFeedback.className = "game-feedback";
        sortAllFeedback.textContent = "";
        sortAllDoneMessage.hidden = true;
        sortAllReplayBtn.hidden = true;

        renderSortAllPool();
      }

      function renderSortAllPool() {
        sortAllPool.innerHTML = "";
        sortAllState.pool.forEach(function (item) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "letterlab-cell sortall-letter";
          btn.textContent = ALL_LETTERS_BY_ID[item.id].char;
          btn.addEventListener("click", function () { armSortAllLetter(item.id, btn); });
          sortAllPool.appendChild(btn);
        });
      }

      function armSortAllLetter(id, btnEl) {
        if (sortAllState.armedId === id) {
          sortAllState.armedId = null;
          btnEl.classList.remove("is-armed");
          return;
        }
        Array.prototype.forEach.call(sortAllPool.children, function (b) { b.classList.remove("is-armed"); });
        sortAllState.armedId = id;
        btnEl.classList.add("is-armed");
      }

      function placeSortAllLetter(type) {
        if (!sortAllState || !sortAllState.armedId) return;
        var id = sortAllState.armedId;
        var idx = -1;
        for (var i = 0; i < sortAllState.pool.length; i++) {
          if (sortAllState.pool[i].id === id) { idx = i; break; }
        }
        if (idx === -1) return;
        var item = sortAllState.pool[idx];
        sortAllState.pool.splice(idx, 1);
        sortAllState.armedId = null;

        var isCorrect = item.type === type;
        if (isCorrect) { sortAllState.correctCount += 1; }
        sortAllState.remaining -= 1;

        var tile = document.createElement("span");
        tile.className = "sortall-tile " + (isCorrect ? "is-correct" : "is-wrong");
        tile.textContent = ALL_LETTERS_BY_ID[id].char;
        (type === "sun" ? sortAllSunColumn : sortAllMoonColumn).appendChild(tile);

        renderSortAllPool();

        var letterChar = ALL_LETTERS_BY_ID[id].char;
        var explain = item.type === "sun"
          ? (isEnglish ? letterChar + " is a sun letter." : letterChar + " est une lettre solaire.")
          : (isEnglish ? letterChar + " is a moon letter." : letterChar + " est une lettre lunaire.");
        sortAllFeedback.hidden = false;
        sortAllFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        sortAllFeedback.textContent = (isCorrect
          ? (isEnglish ? "Correct! " : "Bravo ! ")
          : (isEnglish ? "Not quite — " : "Ce n'était pas ça — ")) + explain;

        if (sortAllState.remaining === 0) {
          sortAllFeedback.hidden = true;
          sortAllDoneMessage.hidden = false;
          sortAllDoneMessage.textContent = isEnglish
            ? "You correctly classified " + sortAllState.correctCount + " / " + sortAllState.total + " letters!"
            : "Tu as classé " + sortAllState.correctCount + " / " + sortAllState.total + " lettres correctement !";
          sortAllReplayBtn.hidden = false;
        }
      }

      // Dictee (page dediee dictee.html, 5 niveaux) : un seul fichier audio
      // par element (lettre, paire ou phrase - dicte tout d'un coup, pas de
      // decoupage). L'enfant ecoute, ecrit sur une feuille, puis affiche la
      // correction complete avant de passer au suivant. Parcours fixe dans
      // l'ordre du niveau (pas de tirage aleatoire, pas de score : comme
      // "Dictee pure", mais element entier plutot que mot par mot).
      var dictee1Level = null;
      var dictee1State = null;

      function hideAllGamePanels() {
        gameQuizPanel.hidden = true;
        gameReadPanel.hidden = true;
        gameDicteePanel.hidden = true;
        gameHarakatPanel.hidden = true;
        gameSortPanel.hidden = true;
        gameSortAllPanel.hidden = true;
        gameDictee1Panel.hidden = true;
      }

      // Texte d'affichage d'une entree : les lettres (niveaux 1 et 2)
      // utilisent ALL_LETTERS_BY_ID (char + nom complet) ; les paires
      // (niveau 3) leur "label" explicite (pas un spoiler : identifie la
      // paire, pas le contenu dicte) ; les phrases (niveaux 4 et 5) n'ont
      // ni l'un ni l'autre - l'appelant retombe alors sur le numero.
      function dictee1EntryDisplay(entry) {
        var letter = ALL_LETTERS_BY_ID[entry.id];
        if (letter) return { picker: letter.char, header: letter.char + " (" + letter.name + ")" };
        if (entry.label) return { picker: entry.label, header: entry.label };
        return null;
      }

      // Ecran de choix de l'element (reutilise gameMenuScreen/gameMenuGrid,
      // meme mecanique que le menu de jeux d'un module) : interface separee
      // de l'ecran de pratique, l'enfant choisit d'abord l'element plutot
      // que de toujours repartir du debut.
      function openDictee1LetterMenu(levelId, title) {
        dictee1Level = DICTEE_LEVELS_BY_ID[levelId];
        gameModalTitle.textContent = title;
        gameMenuHeading.textContent = (isEnglish ? dictee1Level.titleEn : dictee1Level.titleFr) +
          (isEnglish ? ": choose a " + dictee1Level.unitEn.toLowerCase() : " : choisis une " + dictee1Level.unitFr.toLowerCase());
        gameMenuLevelInfo.textContent = "";
        gameMenuGrid.className = "game-menu-grid dictee1-letters";
        gameMenuGrid.innerHTML = "";
        dictee1Level.entries.forEach(function (entry, idx) {
          var display = dictee1EntryDisplay(entry);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "letterlab-cell";
          btn.textContent = display ? display.picker : String(idx + 1);
          btn.addEventListener("click", function () { enterDictee1Letter(idx); });
          gameMenuGrid.appendChild(btn);
        });
        gamePrestartWarning.hidden = true;
        gameBody.hidden = true;
        gameEnd.hidden = true;
        gameMenuScreen.hidden = false;

        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      function enterDictee1Letter(index) {
        gameMenuScreen.hidden = true;
        gameBody.hidden = false;
        gameEnd.hidden = true;
        hideAllGamePanels();
        gameDictee1Panel.hidden = false;

        dictee1State = { index: index, current: null };
        renderDictee1Letter();
      }

      function renderDictee1Letter() {
        var entries = dictee1Level.entries;
        var entry = entries[dictee1State.index];
        var display = dictee1EntryDisplay(entry);
        dictee1State.current = entry;

        var unit = isEnglish ? dictee1Level.unitEn : dictee1Level.unitFr;
        gameLevelInfo.textContent = unit + " " + (dictee1State.index + 1) + " / " + entries.length +
          (display ? " — " + display.header : "");
        gameScoreEl.textContent = "";

        gameDictee1Words.innerHTML = "";
        gameDictee1Words.hidden = true;
        gameDictee1ListenBtn.textContent = isEnglish ? "🔊 Listen" : "🔊 Écouter";
        gameDictee1RevealBtn.hidden = false;
        gameDictee1NextBtn.textContent = dictee1State.index + 1 < entries.length
          ? (isEnglish ? "Next " + unit.toLowerCase() + " →" : unit + " suivante →")
          : (isEnglish ? "Restart from the beginning →" : "Recommencer au début →");
      }

      function showDictee1Words() {
        var entry = dictee1State.current;
        gameDictee1Words.innerHTML = "";
        entry.items.forEach(function (word) {
          var span = document.createElement("span");
          span.className = "dictee1-word";
          renderArabicText(span, stretchArabic(word));
          gameDictee1Words.appendChild(span);
        });
        gameDictee1Words.hidden = false;
      }

      function closeGame() {
        gameModal.classList.remove("is-open");
        document.body.style.overflow = "";
        gamePrestartWarning.hidden = true;
        if (gameAudio) { gameAudio.pause(); }
      }

      // Rappel non bloquant : si le module precedent n'a pas encore ete
      // maitrise a 80%, on le rappelle avant d'ouvrir directement un module
      // depuis la liste - mais l'acces reste toujours possible via
      // "Acceder quand meme", qui memorise ce choix (etat "override") pour
      // ne plus reafficher le rappel sur ce module. Ne s'applique qu'a
      // l'ouverture directe, pas au passage au module suivant depuis
      // l'ecran de fin (deja informe a ce moment-la, et compte lui aussi
      // comme un override explicite).
      var pendingModuleNumber = null;
      var pendingModuleTitle = null;
      function openPrestartWarning(moduleNumber, title) {
        pendingModuleNumber = moduleNumber;
        pendingModuleTitle = title;
        var prevModule = Number(moduleNumber) - 1;
        var prevPct = getModuleBestPct(prevModule);
        var prevBtn = document.querySelector('.js-open-game[data-module="' + prevModule + '"]');
        gamePrestartMessage.textContent = isEnglish
          ? "You haven't yet reached the 80% recommended on Module " + prevModule + " (your best score so far: " + prevPct + "%). We suggest practicing it a bit more to really master it before continuing."
          : "Tu n'as pas encore atteint les 80% recommandés sur le Module " + prevModule + " (ton meilleur score jusqu'ici : " + prevPct + "%). Nous te conseillons de t'entraîner encore un peu pour bien le maîtriser avant de continuer.";
        gamePrestartBackBtn.textContent = isEnglish ? "← Back to Module " + prevModule : "← Retour au Module " + prevModule;
        gamePrestartBackBtn.disabled = !prevBtn;
        gamePrestartContinueBtn.textContent = isEnglish
          ? "Continue anyway to Module " + moduleNumber + " →"
          : "Accéder quand même au Module " + moduleNumber + " →";
        gameModalTitle.textContent = title;
        gameBody.hidden = true;
        gameEnd.hidden = true;
        gamePrestartWarning.hidden = false;
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }
      gamePrestartBackBtn.addEventListener("click", function () {
        var prevModule = Number(pendingModuleNumber) - 1;
        var prevBtn = document.querySelector('.js-open-game[data-module="' + prevModule + '"]');
        if (!prevBtn) { closeGame(); return; }
        startGame(String(prevModule), prevBtn.getAttribute("data-title"));
      });
      gamePrestartContinueBtn.addEventListener("click", function () {
        saveModuleOverride(pendingModuleNumber);
        refreshModuleBadges();
        startGame(pendingModuleNumber, pendingModuleTitle);
      });

      gameBtns.forEach(function (btn) {
        var moduleNumber = btn.getAttribute("data-module");
        if (!GAMES_READY[moduleNumber]) return;
        btn.addEventListener("click", function () {
          var title = btn.getAttribute("data-title");
          var state = moduleUnlockState(moduleNumber);
          if (state === "locked") {
            openPrestartWarning(moduleNumber, title);
            return;
          }
          startGame(moduleNumber, title);
        });
      });
      refreshModuleBadges();
      document.querySelectorAll(".js-open-sunmoon-game").forEach(function (btn) {
        btn.addEventListener("click", function () {
          startSunMoonGame(btn.getAttribute("data-title"));
        });
      });
      document.querySelectorAll(".js-open-dictee-level").forEach(function (btn) {
        btn.addEventListener("click", function () {
          openDictee1LetterMenu(btn.getAttribute("data-level"), btn.getAttribute("data-title"));
        });
      });
      sortAllSunZone.addEventListener("click", function () { placeSortAllLetter("sun"); });
      sortAllMoonZone.addEventListener("click", function () { placeSortAllLetter("moon"); });
      sortAllReplayBtn.addEventListener("click", startSortAllGame);
      // "Retour" revient a l'ecran de menu partage (choix de categorie pour
      // un module, choix de lettre pour Dictee - Niveau 1 - voir
      // openDictee1LetterMenu), jamais directement a la grille des jeux.
      gameBackToMenuBtn.addEventListener("click", function () {
        gameBody.hidden = true;
        gameMenuScreen.hidden = false;
      });
      gameEndBackToMenuBtn.addEventListener("click", function () {
        gameEnd.hidden = true;
        gameMenuScreen.hidden = false;
      });
      gameDictee1ListenBtn.addEventListener("click", function () {
        if (!dictee1State || !dictee1State.current) return;
        playSound({ audioBase: ROOT_BASE + "assets/audio/" + dictee1Level.audioFolder + "/", audioId: dictee1State.current.id });
        gameDictee1ListenBtn.textContent = isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
      });
      gameDictee1RevealBtn.addEventListener("click", function () {
        if (!dictee1State || !dictee1State.current) return;
        showDictee1Words();
        gameDictee1RevealBtn.hidden = true;
      });
      // Boucle sur les 28 lettres (recommence a l'alif apres yaa) plutot
      // que de forcer un ecran de fin : avec le choix libre de la lettre
      // (voir openDictee1LetterMenu), il n'y a plus de "fin" naturelle de
      // parcours a imposer.
      gameDictee1NextBtn.addEventListener("click", function () {
        if (!dictee1State) return;
        dictee1State.index = (dictee1State.index + 1) % dictee1Level.entries.length;
        renderDictee1Letter();
      });
      gamePlayBtn.addEventListener("click", function () {
        if (gameState && gameState.category !== "script" && gameState.current) playSound(gameState.current.correct);
      });
      gameNextBtn.addEventListener("click", nextQuestion);
      gameSortSunBtn.addEventListener("click", function () {
        if (!gameState || gameState.category !== "sort") return;
        onSortAnswer("sun", gameSortSunBtn);
      });
      gameSortMoonBtn.addEventListener("click", function () {
        if (!gameState || gameState.category !== "sort") return;
        onSortAnswer("moon", gameSortMoonBtn);
      });
      gameSortNextBtn.addEventListener("click", nextQuestion);
      gameReadListenBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current) return;
        playSound(gameState.current.correct);
        gameState.current.listened = true;
        gameReadListenBtn.textContent = isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
        gameReadNextBtn.hidden = false;
      });
      gameReadNextBtn.addEventListener("click", nextQuestion);
      gameDicteeListenBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current) return;
        playSound(gameState.current.correct);
        gameDicteeListenBtn.textContent = isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
      });
      gameDicteeRevealBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current) return;
        gameDicteeWord.hidden = false;
        gameDicteeRevealBtn.hidden = true;
        gameDicteeNextBtn.hidden = false;
      });
      gameDicteeNextBtn.addEventListener("click", nextQuestion);
      gameHarakatListenBtn.addEventListener("click", function () {
        if (gameState && gameState.current) playSound(gameState.current.correct);
      });
      gameHarakatCheckBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current || gameState.current.checked) return;
        gameState.current.checked = true;
        var allCorrect = true;
        gameState.current.slots.forEach(function (slot, idx) {
          var isRight = slot.filled === unitForm(slot.unitId);
          if (!isRight) allCorrect = false;
          harakatSlots.children[idx].classList.add(isRight ? "is-correct" : "is-wrong");
        });
        if (allCorrect) { gameState.score += 1; }

        Array.prototype.forEach.call(harakatPicker.children, function (b) { b.disabled = true; });
        gameHarakatCheckBtn.hidden = true;
        gameHarakatFeedback.hidden = false;
        gameHarakatFeedback.className = "game-feedback " + (allCorrect ? "is-correct" : "is-wrong");
        gameHarakatFeedback.textContent = allCorrect
          ? (isEnglish ? "Correct!" : "Bravo, c'est la bonne réponse !")
          : (isEnglish ? "Not quite — here is the right answer." : "Ce n'était pas ça — voici la bonne réponse.");
        gameHarakatCorrect.hidden = false;
        renderArabicText(gameHarakatCorrect, stretchArabic(gameState.current.correct.arabic));
        gameHarakatNextBtn.hidden = false;
        renderScore();
      });
      gameHarakatNextBtn.addEventListener("click", nextQuestion);
      gameReplayBtn.addEventListener("click", function () {
        startRound(gameState.moduleNumber, gameState.title, gameState.category);
      });
      gameContinueBtn.addEventListener("click", function () {
        var nextModule = String(Number(gameState.moduleNumber) + 1);
        var nextBtn = document.querySelector('.js-open-game[data-module="' + nextModule + '"]');
        if (!nextBtn) return;
        // Continuer depuis l'ecran de fin equivaut a "Acceder quand meme" :
        // l'enfant vient de voir sa recommandation et choisit d'avancer,
        // donc le module suivant ne redemandera plus ce rappel ensuite.
        saveModuleOverride(nextModule);
        refreshModuleBadges();
        openGameMenu(nextModule, nextBtn.getAttribute("data-title"), buildModuleMenuItems(nextModule));
      });
      gameModalClose.addEventListener("click", closeGame);
      document.addEventListener("keydown", function (e) {
        if (gameModal.classList.contains("is-open") && e.key === "Escape") closeGame();
      });
    }
  }
})();
