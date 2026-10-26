// Espace entrainement : dictees, atelier de concentration, defis de concentration, lecture.
// Donnees : js/concentration-data.js (textes SANS harakat + audios), js/book-data.js (livre AVEC harakat + images).
(function () {
  "use strict";

  var SCRIPT_SRC = document.currentScript ? document.currentScript.src : "";
  var ROOT_BASE = SCRIPT_SRC.replace(/js\/entrainement\.js.*$/, "");
  var LANG = (document.documentElement.lang || "fr").slice(0, 2);
  var root = document.getElementById("trainApp");
  if (!root) return;

  var TXT = {
    fr: {
      eyebrow: "Espace entraînement", h2: "Ton espace d’entraînement",
      lead: "Dictées, écoute, concentration et lecture : tout pour t’entraîner à ton rythme.",
      dict: "Dictées", dictSub: "Les 5 niveaux", dictBtn: "Ouvrir",
      atelier: "Atelier de concentration", atelierSub: "Écouter : lettres et mots proches, les différents mots", atelierBtn: "Entrer",
      defi: "Défis de concentration", defiSub: "Écoute et ajoute les harakāt", defiBtn: "Entrer",
      lecture: "Lecture", lectureSub: "Mots des fascicules, livre, mots à lire", lectureBtn: "Entrer",
      back: "Retour", close: "Fermer", group: "Groupe", free: "Gratuit", locked: "🔒 Payant",
      pairs: "Lettres proches", words: "Mots proches", legend: "✅ juste · ❌ faux", seriesAudio: "Les différents mots (à écouter)", seriesRead: "Les différents mots (à lire)",
      set: "Série", listen: "Écouter", listenHint: "Écoute chaque série.",
      defiIntro: "Écoute le texte et écris-le sur ton cahier en ajoutant les harakāt. Vérifie ensuite avec la correction.",
      chooseGroup: "Choisis un groupe de lettres", showCorr: "Voir la correction", hideCorr: "Cacher la correction",
      letter: "La lettre", text: "Le texte", aLetter: "Audio de la lettre", aText: "Audio du texte",
      fasc: "Mots après chaque fascicule", book: "Le livre de l’alphabet (avec harakāt)", wordsRead: "Les différents mots (à lire)", soon: "Bientôt disponible",
      bookHint: "Lis chaque texte en suivant les harakāt, puis écoute l’audio."
    },
    en: {
      eyebrow: "Training space", h2: "Your training space",
      lead: "Dictations, listening, concentration and reading: everything to practise at your own pace.",
      dict: "Dictations", dictSub: "The 5 levels", dictBtn: "Open",
      atelier: "Concentration workshop", atelierSub: "Listen: similar letters and words, the different words", atelierBtn: "Enter",
      defi: "Concentration challenges", defiSub: "Listen and add the harakāt", defiBtn: "Enter",
      lecture: "Reading", lectureSub: "Booklet words, book, words to read", lectureBtn: "Enter",
      back: "Back", close: "Close", group: "Group", free: "Free", locked: "🔒 Premium",
      pairs: "Similar letters", words: "Similar words", legend: "✅ correct · ❌ wrong", seriesAudio: "The different words (to listen to)", seriesRead: "The different words (to read)",
      set: "Set", listen: "Listen", listenHint: "Listen to each set.",
      defiIntro: "Listen to the text and write it in your notebook, adding the harakāt. Then check with the correction.",
      chooseGroup: "Choose a group of letters", showCorr: "Show the correction", hideCorr: "Hide the correction",
      letter: "The letter", text: "The text", aLetter: "Letter audio", aText: "Text audio",
      fasc: "Words after each booklet", book: "The alphabet book (with harakāt)", wordsRead: "The different words (to read)", soon: "Coming soon",
      bookHint: "Read each text following the harakāt, then listen to the audio."
    },
    ru: {
      eyebrow: "Тренировочный зал", h2: "Твой тренировочный зал",
      lead: "Диктанты, аудирование, концентрация и чтение: всё, чтобы тренироваться в своём темпе.",
      dict: "Диктанты", dictSub: "5 уровней", dictBtn: "Открыть",
      atelier: "Мастерская концентрации", atelierSub: "Слушать: похожие буквы и слова, разные слова", atelierBtn: "Войти",
      defi: "Задания на концентрацию", defiSub: "Слушай и добавляй огласовки", defiBtn: "Войти",
      lecture: "Чтение", lectureSub: "Слова из брошюр, книга, слова для чтения", lectureBtn: "Войти",
      back: "Назад", close: "Закрыть", group: "Группа", free: "Бесплатно", locked: "🔒 Платно",
      pairs: "Похожие буквы", words: "Похожие слова", legend: "✅ верно · ❌ неверно", seriesAudio: "Разные слова (для прослушивания)", seriesRead: "Разные слова (для чтения)",
      set: "Серия", listen: "Слушать", listenHint: "Слушай каждую серию.",
      defiIntro: "Слушай текст и пиши его в тетради, добавляя огласовки. Затем сверься с исправленным вариантом.",
      chooseGroup: "Выбери группу букв", showCorr: "Показать исправленный вариант", hideCorr: "Скрыть исправленный вариант",
      letter: "Буква", text: "Текст", aLetter: "Аудио буквы", aText: "Аудио текста",
      fasc: "Слова после каждой брошюры", book: "Книга алфавита (с огласовками)", wordsRead: "Разные слова (для чтения)", soon: "Скоро будет доступно",
      bookHint: "Читай каждый текст по огласовкам, затем послушай аудио."
    },
    de: {
      eyebrow: "Trainingsbereich", h2: "Dein Trainingsbereich",
      lead: "Diktate, Hören, Konzentration und Lesen: alles, um in deinem Tempo zu üben.",
      dict: "Diktate", dictSub: "Die 5 Stufen", dictBtn: "Öffnen",
      atelier: "Konzentrationswerkstatt", atelierSub: "Hören: ähnliche Buchstaben und Wörter, verschiedene Wörter", atelierBtn: "Eintreten",
      defi: "Konzentrationsaufgaben", defiSub: "Hören und die Harakāt ergänzen", defiBtn: "Eintreten",
      lecture: "Lesen", lectureSub: "Wörter der Hefte, Buch, Wörter zum Lesen", lectureBtn: "Eintreten",
      back: "Zurück", close: "Schließen", group: "Gruppe", free: "Kostenlos", locked: "🔒 Premium",
      pairs: "Ähnliche Buchstaben", words: "Ähnliche Wörter", legend: "✅ richtig · ❌ falsch", seriesAudio: "Die verschiedenen Wörter (zum Hören)", seriesRead: "Die verschiedenen Wörter (zum Lesen)",
      set: "Serie", listen: "Anhören", listenHint: "Höre jede Serie.",
      defiIntro: "Höre den Text und schreibe ihn in dein Heft, indem du die Harakāt ergänzt. Prüfe danach mit der Korrektur.",
      chooseGroup: "Wähle eine Buchstabengruppe", showCorr: "Korrektur anzeigen", hideCorr: "Korrektur ausblenden",
      letter: "Der Buchstabe", text: "Der Text", aLetter: "Audio des Buchstabens", aText: "Audio des Textes",
      fasc: "Wörter nach jedem Heft", book: "Das Alphabet-Buch (mit Harakāt)", wordsRead: "Die verschiedenen Wörter (zum Lesen)", soon: "Demnächst verfügbar",
      bookHint: "Lies jeden Text anhand der Harakāt und höre dann das Audio."
    },
    ar: {
      eyebrow: "فضاء التدريب", h2: "فضاء التدريب الخاص بك",
      lead: "الإملاء والاستماع والتركيز والقراءة: كل ما تحتاجه للتدرب بوتيرتك.",
      dict: "الإملاء", dictSub: "المستويات الخمسة", dictBtn: "افتح",
      atelier: "ورشة التركيز", atelierSub: "استماع: حروف وكلمات متقاربة، كلمات مختلفة", atelierBtn: "ادخل",
      defi: "تحديات التركيز", defiSub: "استمع وأضف الحركات", defiBtn: "ادخل",
      lecture: "القراءة", lectureSub: "كلمات الكراسات، الكتاب، كلمات للقراءة", lectureBtn: "ادخل",
      back: "رجوع", close: "إغلاق", group: "المجموعة", free: "مجاني", locked: "🔒 مدفوع",
      pairs: "حروف متقاربة", words: "كلمات متقاربة", legend: "✅ صحيح · ❌ خطأ", seriesAudio: "الكلمات المختلفة (للاستماع)", seriesRead: "الكلمات المختلفة (للقراءة)",
      set: "المجموعة", listen: "استماع", listenHint: "استمع إلى كل مجموعة.",
      defiIntro: "استمع إلى النص واكتبه في دفترك مع إضافة الحركات، ثم تحقق بالتصحيح.",
      chooseGroup: "اختر مجموعة حروف", showCorr: "عرض التصحيح", hideCorr: "إخفاء التصحيح",
      letter: "الحرف", text: "النص", aLetter: "صوت الحرف", aText: "صوت النص",
      fasc: "كلمات بعد كل كراسة", book: "كتاب الحروف (بالحركات)", wordsRead: "الكلمات المختلفة (للقراءة)", soon: "قريبًا",
      bookHint: "اقرأ كل نص متتبعًا الحركات ثم استمع إلى الصوت."
    }
  };
  var T = TXT[LANG] || TXT.fr;

  // Groupes de 12, comme les modules.
  var GROUPS = [
    { n: 1, ids: ["alif"] }, { n: 2, ids: ["baa", "taa", "thaa"] }, { n: 3, ids: ["jim", "haa", "khaa"] },
    { n: 4, ids: ["dal", "thal"] }, { n: 5, ids: ["reh", "zain"] }, { n: 6, ids: ["seen", "sheen"] },
    { n: 7, ids: ["sad", "dad"] }, { n: 8, ids: ["tah", "zah"] }, { n: 9, ids: ["ain", "ghain"] },
    { n: 10, ids: ["feh", "qaf", "kaf"] }, { n: 11, ids: ["lam", "meem", "noon"] }, { n: 12, ids: ["heh", "waw", "yeh"] }
  ];
  var CH = {
    alif: "أ", baa: "ب", taa: "ت", thaa: "ث", jim: "ج", haa: "ح", khaa: "خ", dal: "د", thal: "ذ", reh: "ر", zain: "ز",
    seen: "س", sheen: "ش", sad: "ص", dad: "ض", tah: "ط", zah: "ظ", ain: "ع", ghain: "غ", feh: "ف", qaf: "ق", kaf: "ك",
    lam: "ل", meem: "م", noon: "ن", heh: "ه", waw: "و", yeh: "ي"
  };
  function groupLetters(g) { return g.ids.map(function (id) { return CH[id]; }).join(" "); }

  var AUDIO_CONC = ROOT_BASE + "assets/audio/concentration/";
  var AUDIO_READ = ROOT_BASE + "assets/audio/reading/";
  var IMG_BOOK = ROOT_BASE + "assets/img/livre/";

  // ---- Donnees (paires proches, mots proches, series de mots) ----
    var PAIRS = [
      { au: "pair-taa-tah", rows: ["تَ / طَ", "تُ / طُ", "تِ / طِ"] },
      { au: "pair-dal-dad", rows: ["دَ / ضَ", "دُ / ضُ", "دِ / ضِ"] },
      { au: "pair-seen-sad", rows: ["سَ / صَ", "سُ / صُ", "سِ / صِ"] },
      { au: "pair-khaa-ghain", rows: ["خَ / غَ", "خُ / غُ", "خِ / غِ"] },
      { au: "pair-qaf-kaf", rows: ["قَ / كَ", "قُ / كُ", "قِ / كِ"] },
      { au: "pair-thal-zah", rows: ["ذَ / ظَ", "ذُ / ظُ", "ذِ / ظِ"] },
      { au: "pair-zain-thal", rows: ["زَ / ذَ", "زُ / ذُ", "زِ / ذِ"] },
      { au: "pair-thaa-seen", rows: ["ثَ / سَ", "ثُ / سُ", "ثِ / سِ"] },
      { au: "pair-haa-heh", rows: ["حَ / هَ", "حُ / هُ", "حِ / هِ"] },
      { au: "pair-reh-ghain", rows: ["رَ / غَ", "رُ / غُ", "رِ / غِ"] },
      { au: "pair-feh-thaa", rows: ["فَ / ثَ", "فُ / ثُ", "فِ / ثِ"] }
    ];
    var WORDS = [
      ["طارِقًا", 1, "=", "تارِقًا", 0, "word-1-tariqa"],
      ["دَجاجٌ", 1, "=", "ضَجَاج", 0, "word-2-dajaj"],
      ["صَـبْـرٌ", 1, "/", "ثَـبْـرٌ", 0, "word-3-sabr"],
      ["كَرِيمٌ", 1, "=", "قَرِيمٌ", 0, ""],
      ["كَـلْـبٌ", 1, "/", "قَـلْـبٌ", 1, "word-4-kalb"],
      ["كُلْ", 1, "/", "قُلْ", 1, ""],
      ["صَـبْـرٌ", 1, "/", "سَـبْـرٌ", 0, ""],
      ["كَـلْـبٌ", 1, "=", "قَـلْـبٌ", 0, "word-4-kalb"],
      ["ذَهَبٌ", 1, "/", "ظَـهَـبٌ", 0, "word-5-dhahab"],
      ["فِـيـلٍ", 1, "/", "ثِـيـلٍ", 0, "word-6-feel"],
      ["قَـلِـيـلٌ", 1, "/", "كَـلِـيـلٌ", 1, ""],
      ["خُـبْـزًا", 1, "/", "غُـبْـزًا", 0, "word-7-khubza"],
      ["رَبِّـي", 1, "/", "غَـبِّـي", 0, "word-8-rabbi"],
      ["حَـلَالٌ", 1, "/", "هَـلَالٌ", 0, "word-9-halal"],
      ["زَادَ", 1, "/", "ذَادَ", 0, "word-10-zad"],
      ["سُـورَةٌ", 1, "/", "ثُـورَةٌ", 0, "word-11-surah"],
      ["زَيْـتُـونٌ", 1, "/", "ذَيْـتُـونٌ", 0, "word-12-zaytun"],
      ["سَـبِـيـلِ اللَّهِ", 1, "/", "صَـبِـيـلِ اللهِ", 0, "word-13-sabil"]
    ];
        var SERIES = [
        { au: "list-1", words: ["حَرَمَ", "دِيكٌ", "شَعَرَ", "تاجِرٌ", "تَعِبَ", "صَادَ", "حَضَرَ", "مَلَكَ", "ذَكَرَ", "جِبالٍ", "طابَ"] },
        { au: "list-2", words: ["سُبُوتٍ", "دارَ", "حُبُوبًا", "تَاجٌ", "طَرَدَ", "ضَرَبَ", "آبَ", "صَبَرَ", "جَابَ", "خَطَبَ"] },
        { au: "list-3", words: ["تَـبِـيـعَ", "غَـدَرَ", "طَافَ", "فُـجُورًا", "عَبَدَ", "ضَفِيرًا"] },
        { au: "list-4", words: ["بَـاءَ", "جَـاءَا", "ثَـبَـتَـا", "أُجِـيـبَ", "ثَـابَ", "تُـثَـابُ", "أَجِـيءُ"] },
        { au: "list-5", words: ["حَـشِـيـشٌ", "أَسَـدًا", "آبَـتَـا", "خَـطَـبَ", "طَـارَ", "تَـاجِـرٍ", "حِـجَـابًـا"] },
        { au: "list-6", words: ["أَبَـتِ", "زَادَ", "ضَـجِـرَ", "تَـابَ", "حَـبَـسَ", "ثَـبَـتَ", "خَـسِـرَ", "سُـبُوتٌ", "شَـطَـطًـا", "زَجـرَ", "أَزِيـدَ", "زَبـادِي"] },
        { au: "list-7", words: ["ضُـرِبَ", "حَـسَـبَ", "دَأَبَ", "جَـسُـوسٌ", "شَـرِسًـا"] },
        { au: "list-8", words: ["دَجَـاجًـا", "تَذُوبَ", "صَـادَ", "صَـاحَـبَ", "سَـحَـبَ", "أَزِيـدُ", "ظَـابَ", "شَـجَرَ", "أَذَابَ", "تُـذِيبُ"] },
        { au: "list-9", title: { ar: "كلمات مع الشدة", fr: "Mots avec la shadda", en: "Words with the shadda", ru: "Слова с шаддой", de: "Wörter mit Schadda" },
          words: ["جَـهَّـزَ", "قَـتَّـلَ", "رَبِّـي", "بَوَّابٌ", "بَـدَّلَـتْ", "كَـذَّبَ", "دَرَّسَ", "بَـطٌّ", "لَـفَّ", "مَـلَّـكَ"] },
        { au: "list-10", words: ["عَـيَّـنَ", "مَـنَّ", "فَـكَّـتْ", "صَـبَّـرَهُ", "غَـفَّـارٌ", "جَـبَّـارٌ", "فُـسَّـاقٍ", "كَـلَّـتْ", "عَـدَّ", "ثَـيِّـبٌ", "قَـتَّـالٍ", "جَـزَّارٌ", "قَـصَّ", "نَوَّرَ", "مُدَرِّسٌ", "مُـعَـلِّـمٌ", "شَـطَّـبَ"] },
        { au: "list-11", words: ["أَخْـرَجَ", "تُـدْخِـلُ", "أَبْـوَابٍ", "جِسْرٌ", "أَبْـشِـرْ", "بَلْ", "أَمْوَالٍ", "اِهْدِنَـا", "بِعْ", "أَنْـوَارٌ", "نَخْلَةً", "أَفْـكَـارًا", "لَـحْـمٍ", "غَـيْـرِ", "مُـصْـطَـفَـى", "أَجْـدَرُ", "نَـكْـتُـبُ", "يَـقْـلَـقُ", "أَوْلَادًا", "أَتْـبَـاعُ", "أَهْـلُ", "يَزْدَادَ", "تَـبْدُو", "بِـسْـمِ اللَّهِ", "أَذْكُـرُ", "تَـشْـبَـعُ", "خِـنْـزِيـرٌ"] },
        { au: "list-12", words: ["غَرِيبٌ", "عَرَبَ", "خَرَجَ", "غَفُورٍ", "فَتَحَ", "غَادَرَ", "غَفَرَ", "فُـجُورًا", "بَاغٍ", "عَجِيبًا", "غَرَسَ", "عَتِيدٌ", "عَبَدَ", "عَبَدَ", "عَدِيدٍ", "تَعِبَ", "تَفِتَ", "صَعُبَ", "بَعَثَ", "ضَفِيرًا", "تَعِسَ", "عَبِيدًا"] }
      ];
  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function arNum(n) { return String(n).replace(/\d/g, function (d) { return AR_DIGITS.charAt(Number(d)); }); }

  // ---- Outils DOM ----
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function arText(cls, text) {
    var e = el("span", cls, text);
    e.lang = "ar";
    e.dir = "rtl";
    return e;
  }

  // ---- Audio : un seul son a la fois ----
  var playing = null, playingBtn = null;
  function stopClip() {
    if (playing) { playing.pause(); playing = null; }
    if (playingBtn) { playingBtn.classList.remove("is-playing"); playingBtn = null; }
  }
  function playBtn(url) {
    var b = el("button", "reading-play", "🔊");
    b.type = "button";
    b.setAttribute("aria-label", T.listen);
    b.addEventListener("click", function () {
      var same = playingBtn === b;
      stopClip();
      if (same) return;
      var a = new Audio(url);
      playing = a;
      playingBtn = b;
      b.classList.add("is-playing");
      a.addEventListener("ended", function () { if (playing === a) stopClip(); });
      a.addEventListener("error", function () { if (playing === a) stopClip(); });
      a.play().catch(function () { if (playing === a) stopClip(); });
    });
    return b;
  }
  function audioPlayer(file, label) {
    var wrap = el("div", "conc-audio");
    wrap.appendChild(el("span", "conc-audio-label", "🎧 " + label));
    var a = document.createElement("audio");
    a.controls = true;
    a.preload = "none";
    a.src = AUDIO_CONC + file;
    a.setAttribute("aria-label", label);
    wrap.appendChild(a);
    return wrap;
  }
  function pauseAll(container) {
    stopClip();
    Array.prototype.forEach.call((container || document).querySelectorAll("audio"), function (a) { a.pause(); });
  }

  // ---- Texte sans harakat : un seul noeud texte, couleurs par Highlight API ----
  var HL = window.CSS && CSS.highlights && typeof Highlight !== "undefined";
  function clearHighlights() {
    if (HL) ["tr-r", "tr-f", "tr-vr", "tr-vf"].forEach(function (n) { CSS.highlights.delete(n); });
  }
  function addRange(name, node, from, to) {
    var rg = document.createRange();
    rg.setStart(node, from);
    rg.setEnd(node, to);
    var h = CSS.highlights.get(name);
    if (!h) { h = new Highlight(); CSS.highlights.set(name, h); }
    h.add(rg);
  }
  function parseMarkup(markup) {
    var plain = "", ranges = [], re = /\{(r|f)\}([\s\S]*?)\{\/\}/g, last = 0, m;
    while ((m = re.exec(markup))) {
      plain += markup.slice(last, m.index);
      ranges.push({ from: plain.length, to: plain.length + m[2].length, kind: m[1] });
      plain += m[2];
      last = m.index + m[0].length;
    }
    plain += markup.slice(last);
    return { plain: plain, ranges: ranges };
  }
  function fillColored(container, plain, ranges, prefix) {
    container.textContent = "";
    var node = document.createTextNode(plain);
    container.appendChild(node);
    if (!ranges.length) return;
    if (HL) {
      ranges.forEach(function (r) { addRange(prefix + r.kind, node, r.from, r.to); });
    } else {
      container.textContent = "";
      var pos = 0;
      ranges.forEach(function (r) {
        if (r.from > pos) container.appendChild(document.createTextNode(plain.slice(pos, r.from)));
        container.appendChild(el("span", "tr-c-" + r.kind, plain.slice(r.from, r.to)));
        pos = r.to;
      });
      if (pos < plain.length) container.appendChild(document.createTextNode(plain.slice(pos)));
    }
  }
  function renderPlain(container, markup) {
    var p = parseMarkup(markup);
    fillColored(container, p.plain, p.ranges, "tr-");
  }

  // ---- Texte AVEC harakat : couche A = tout en rouge, couche B = lettres seules par-dessus ----
  var MARKS = /[ً-ْٰ]/g;
  function renderVowel(container, markup) {
    var p = parseMarkup(markup);
    // couleurs : les plages portent sur le texte SANS harakat
    var base = "", map = [];
    for (var i = 0; i < p.plain.length; i++) {
      var ch = p.plain.charAt(i);
      map.push(base.length);
      if (!/[ً-ْٰ]/.test(ch)) base += ch;
    }
    map.push(base.length);
    var ranges = p.ranges.map(function (r) {
      return { from: map[r.from], to: map[r.to], kind: r.kind === "r" ? "vr" : "vf" };
    }).filter(function (r) { return r.to > r.from; });
    container.textContent = "";
    var a = el("span", "vt-a");
    a.appendChild(document.createTextNode(p.plain));
    var b = el("span", "vt-b");
    b.setAttribute("aria-hidden", "true");
    container.appendChild(a);
    container.appendChild(b);
    fillColored(b, base, ranges, "tr-");
  }

  // ---- Blocs de texte ----
  function textBlock(page, kind, vowel) {
    var box = el("div", "conc-block conc-block-" + kind + (vowel ? " conc-block-vowel" : ""));
    var draw = vowel ? renderVowel : renderPlain;
    if (page.t) {
      var t = el("h3", "conc-title conc-title-" + kind);
      t.lang = "ar";
      t.dir = "rtl";
      var tl = el("span", "vt");
      draw(tl, page.t);
      t.appendChild(tl);
      box.appendChild(t);
    }
    page.p.forEach(function (para) {
      var p = el("p", "conc-para");
      p.lang = "ar";
      p.dir = "rtl";
      para.forEach(function (line) {
        var ln = el("span", "conc-line vt");
        draw(ln, line);
        p.appendChild(ln);
      });
      box.appendChild(p);
    });
    return box;
  }
  // Page du livre avec images (colonne gauche) et texte avec harakat (colonne droite)
  function bookPage(page, kind) {
    var box = el("div", "conc-block conc-block-" + kind + " conc-block-vowel book-page");
    if (page.t) {
      var t = el("h3", "conc-title conc-title-" + kind);
      t.lang = "ar";
      t.dir = "rtl";
      var tl = el("span", "vt");
      renderVowel(tl, page.t);
      t.appendChild(tl);
      box.appendChild(t);
    }
    function imgEl(im) {
      var i = document.createElement("img");
      i.className = "book-img";
      i.src = IMG_BOOK + im.f;
      i.alt = "";
      i.loading = "lazy";
      i.style.setProperty("--w", im.w);
      i.width = im.w;
      i.height = im.h;
      return i;
    }
    if (page.lead && page.lead.length) {
      var lead = el("div", "book-lead");
      page.lead.forEach(function (im) { lead.appendChild(imgEl(im)); });
      box.appendChild(lead);
    }
    page.p.forEach(function (para, i) {
      var row = el("div", "book-row");
      var cell = el("div", "book-imgs");
      ((page.im && page.im[i]) || []).forEach(function (im) { cell.appendChild(imgEl(im)); });
      row.appendChild(cell);
      var p = el("p", "conc-para book-txt");
      p.lang = "ar";
      p.dir = "rtl";
      para.forEach(function (line) {
        var ln = el("span", "conc-line vt");
        renderVowel(ln, line);
        p.appendChild(ln);
      });
      row.appendChild(p);
      box.appendChild(row);
    });
    return box;
  }

  // ---- Fenetre (reader) a vues empilees ----
  var lab = null, labBar, labTitle, labBack, labBody, labPanel, stack = [];
  function ensureLab() {
    if (lab) return;
    lab = el("div", "reader tr-lab");
    lab.setAttribute("role", "dialog");
    lab.setAttribute("aria-modal", "true");
    labBar = el("div", "reader-bar");
    labBack = el("button", "reader-back", "‹");
    labBack.type = "button";
    labBack.setAttribute("aria-label", T.back);
    labBack.addEventListener("click", function () { if (stack.length > 1) { stack.pop(); showTop(); } });
    labTitle = el("span", "reader-title", "");
    var x = el("button", "reader-close", "×");
    x.type = "button";
    x.setAttribute("aria-label", T.close);
    x.addEventListener("click", closeLab);
    labBar.appendChild(labBack);
    labBar.appendChild(labTitle);
    labBar.appendChild(x);
    labBody = el("div", "reader-body");
    labPanel = el("div", "formlab-panel conc-panel tr-panel");
    labBody.appendChild(labPanel);
    lab.appendChild(labBar);
    lab.appendChild(labBody);
    document.body.appendChild(lab);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lab.classList.contains("is-open")) closeLab();
    });
  }
  function showTop() {
    var v = stack[stack.length - 1];
    pauseAll(labPanel);
    clearHighlights();
    labPanel.textContent = "";
    labTitle.textContent = v.title;
    labBack.hidden = stack.length < 2;
    v.render(labPanel);
    lab.classList.add("is-open");
    document.body.style.overflow = "hidden";
    labBody.scrollTop = 0;
  }
  function openView(v) { ensureLab(); stack = [v]; showTop(); }
  function pushView(v) { stack.push(v); showTop(); }
  function closeLab() {
    if (!lab) return;
    pauseAll(labPanel);
    lab.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // ---- Groupes (avec cadenas) ----
  function accessKey(kind, g) { return kind + "-" + g.n; }
  function isOpen(kind, g) {
    return !window.ahlAccess || !window.ahlAccess.hasGroup || window.ahlAccess.hasGroup(accessKey(kind, g));
  }
  function groupName(kind, g) {
    return (kind === "defi" ? T.defi : T.lecture) + " · " + T.group + " " + g.n + " (" + groupLetters(g) + ")";
  }
  function groupList(panel, kind, openGroup) {
    panel.appendChild(el("p", "conc-instruction", T.chooseGroup));
    var grid = el("div", "tr-groups");
    GROUPS.forEach(function (g) {
      var open = isOpen(kind, g);
      var b = el("button", "tr-group" + (open ? "" : " is-locked"));
      b.type = "button";
      b.appendChild(el("span", "tr-group-num", T.group + " " + g.n));
      b.appendChild(arText("tr-group-letters", groupLetters(g)));
      b.appendChild(el("span", "tr-group-state", open ? (g.n === 1 ? T.free : "") : T.locked));
      b.addEventListener("click", function () {
        if (isOpen(kind, g)) openGroup(g);
        else if (window.ahlOpenPaywall) window.ahlOpenPaywall(groupName(kind, g), b);
      });
      grid.appendChild(b);
    });
    panel.appendChild(grid);
  }
  function letterTabs(container, ids, current, onPick) {
    var tabs = el("div", "write-tabs conc-tabs");
    ids.forEach(function (id) {
      var b = el("button", "write-tab" + (id === current ? " is-active" : ""));
      b.appendChild(el("span", "write-tab-glyph", CH[id]));
      b.type = "button";
      b.lang = "ar";
      b.addEventListener("click", function () { onPick(id); });
      tabs.appendChild(b);
    });
    tabs.hidden = ids.length < 2;
    container.appendChild(tabs);
  }

  // ---- Atelier de concentration (ecoute) ----
  function viewAtelier() {
    return {
      title: T.atelier,
      render: function (panel) {
        panel.appendChild(el("h3", "reading-heading", T.pairs));
        var pg = el("div", "reading-pairs");
        PAIRS.forEach(function (pr) {
          var c = el("div", "reading-pair");
          pr.rows.forEach(function (r) { c.appendChild(arText("reading-pair-row", r)); });
          c.appendChild(playBtn(AUDIO_READ + pr.au + ".m4a"));
          pg.appendChild(c);
        });
        panel.appendChild(pg);

        panel.appendChild(el("h3", "reading-heading reading-heading-2", T.words));
        panel.appendChild(el("p", "reading-legend", T.legend));
        var list = el("div", "reading-words");
        WORDS.forEach(function (w) {
          var row = el("div", "reading-word-row");
          var pair = el("div", "reading-word-pair");
          pair.lang = "ar";
          pair.dir = "rtl";
          pair.appendChild(el("span", "reading-mark", w[1] ? "✅" : "❌"));
          pair.appendChild(arText("reading-word", w[0]));
          pair.appendChild(el("span", "reading-sep", w[2]));
          pair.appendChild(arText("reading-word", w[3]));
          pair.appendChild(el("span", "reading-mark", w[4] ? "✅" : "❌"));
          row.appendChild(pair);
          if (w[5]) row.appendChild(playBtn(AUDIO_READ + w[5] + ".m4a"));
          list.appendChild(row);
        });
        panel.appendChild(list);

        // Les differents mots : a ECOUTER seulement (les mots ne sont pas affiches)
        panel.appendChild(el("h3", "reading-heading reading-heading-2", T.seriesAudio));
        panel.appendChild(el("p", "reading-legend", T.listenHint));
        var sets = el("div", "tr-sets");
        SERIES.forEach(function (ls, i) {
          var c = el("div", "tr-set");
          c.appendChild(el("span", "tr-set-name", T.set + " " + (i + 1)));
          if (ls.title) {
            var sub = el("span", "tr-set-sub");
            sub.textContent = ls.title[LANG] || ls.title.fr;
            c.appendChild(sub);
          }
          c.appendChild(playBtn(AUDIO_READ + ls.au + ".m4a"));
          sets.appendChild(c);
        });
        panel.appendChild(sets);
      }
    };
  }

  // ---- Series de mots a lire (Lecture) ----
  function renderSeriesRead(panel) {
    SERIES.forEach(function (ls, li) {
      var box = el("div", "reading-set");
      var head = el("div", "reading-set-head");
      var ttl = el("span", "reading-set-title", T.set + " " + (li + 1));
      if (ls.title) {
        var sub = el("span", "reading-set-sub");
        sub.appendChild(document.createTextNode(ls.title[LANG] || ls.title.fr));
        if (LANG !== "ar") {
          var arT = el("span", "reading-set-sub-ar", ls.title.ar);
          arT.lang = "ar";
          arT.dir = "rtl";
          sub.appendChild(document.createTextNode(" · "));
          sub.appendChild(arT);
        }
        ttl.appendChild(sub);
      }
      head.appendChild(ttl);
      head.appendChild(playBtn(AUDIO_READ + ls.au + ".m4a"));
      box.appendChild(head);
      var ws = el("ol", "reading-set-words");
      ws.lang = "ar";
      ws.dir = "rtl";
      ls.words.forEach(function (w, i) {
        var item = el("li", "reading-set-item");
        item.appendChild(el("span", "reading-set-num", arNum(i + 1) + "-"));
        item.appendChild(el("span", "reading-set-word", w));
        ws.appendChild(item);
      });
      box.appendChild(ws);
      panel.appendChild(box);
    });
  }

  // ---- Defis de concentration : textes sans harakat + correction ----
  function viewDefiGroup(g) {
    return {
      title: groupName("defi", g),
      render: function (panel) {
        var DATA = window.AHL_CONC || {}, BOOK = window.AHL_BOOK || {};
        var ids = g.ids.filter(function (id) { return DATA[id]; });
        var letter = ids[0];
        panel.appendChild(el("p", "conc-instruction", T.defiIntro));
        var holder = el("div", "tr-letter-holder");
        panel.appendChild(holder);
        function correction(box, page) {
          if (!page) return box;
          var wrap = el("div", "tr-corr");
          var btn = el("button", "btn btn-outline btn-sm tr-corr-btn", T.showCorr);
          btn.type = "button";
          var out = el("div", "tr-corr-out");
          out.hidden = true;
          var built = false;
          btn.addEventListener("click", function () {
            if (!built) { out.appendChild(textBlock(page, box.className.indexOf("letter") !== -1 ? "letter" : "story", true)); built = true; }
            out.hidden = !out.hidden;
            btn.textContent = out.hidden ? T.showCorr : T.hideCorr;
          });
          wrap.appendChild(btn);
          wrap.appendChild(out);
          var holderBox = el("div", "tr-block-with-corr");
          holderBox.appendChild(box);
          holderBox.appendChild(wrap);
          return holderBox;
        }
        function renderLetter() {
          pauseAll(holder);
          clearHighlights();
          holder.textContent = "";
          letterTabs(holder, ids, letter, function (id) { letter = id; renderLetter(); });
          var d = DATA[letter], au = d.a || {}, bk = BOOK[letter] || {};
          var s1 = el("section", "conc-section");
          s1.appendChild(el("p", "conc-section-title", T.letter));
          if (au.l) s1.appendChild(audioPlayer(au.l, T.aLetter));
          s1.appendChild(correction(textBlock(d.l, "letter", false), bk.l));
          holder.appendChild(s1);
          if (d.x && d.x.length) {
            var s2 = el("section", "conc-section");
            s2.appendChild(el("p", "conc-section-title", T.text));
            var xs = Array.isArray(au.x) ? au.x : (au.x ? [au.x] : []);
            d.x.forEach(function (pg, i) {
              if (xs[i]) s2.appendChild(audioPlayer(xs[i], d.x.length > 1 ? T.aText + " " + (i + 1) : T.aText));
              s2.appendChild(correction(textBlock(pg, "story", false), bk.x && bk.x[i]));
            });
            holder.appendChild(s2);
          }
        }
        renderLetter();
      }
    };
  }
  function viewDefi() {
    return {
      title: T.defi,
      render: function (panel) {
        groupList(panel, "defi", function (g) { pushView(viewDefiGroup(g)); });
      }
    };
  }

  // ---- Lecture ----
  function viewBookGroup(g) {
    return {
      title: groupName("lecture", g),
      render: function (panel) {
        var BOOK = window.AHL_BOOK || {}, DATA = window.AHL_CONC || {};
        var ids = g.ids.filter(function (id) { return BOOK[id]; });
        var letter = ids[0];
        panel.appendChild(el("p", "conc-instruction", T.bookHint));
        var holder = el("div", "tr-letter-holder");
        panel.appendChild(holder);
        function renderLetter() {
          pauseAll(holder);
          clearHighlights();
          holder.textContent = "";
          letterTabs(holder, ids, letter, function (id) { letter = id; renderLetter(); });
          var d = BOOK[letter], au = (DATA[letter] && DATA[letter].a) || {};
          var s1 = el("section", "conc-section");
          s1.appendChild(el("p", "conc-section-title", T.letter));
          if (au.l) s1.appendChild(audioPlayer(au.l, T.aLetter));
          s1.appendChild(bookPage(d.l, "letter"));
          holder.appendChild(s1);
          if (d.x && d.x.length) {
            var s2 = el("section", "conc-section");
            s2.appendChild(el("p", "conc-section-title", T.text));
            var xs = Array.isArray(au.x) ? au.x : (au.x ? [au.x] : []);
            d.x.forEach(function (pg, i) {
              if (xs[i]) s2.appendChild(audioPlayer(xs[i], d.x.length > 1 ? T.aText + " " + (i + 1) : T.aText));
              s2.appendChild(bookPage(pg, "story"));
            });
            holder.appendChild(s2);
          }
        }
        renderLetter();
      }
    };
  }
  function viewBook() {
    return {
      title: T.book,
      render: function (panel) {
        groupList(panel, "lecture", function (g) { pushView(viewBookGroup(g)); });
      }
    };
  }
  function viewLecture() {
    return {
      title: T.lecture,
      render: function (panel) {
        var menu = el("div", "tr-menu");
        function item(label, onClick, soon) {
          var b = el("button", "tr-menu-item" + (soon ? " is-soon" : ""));
          b.type = "button";
          b.appendChild(el("span", "tr-menu-label", label));
          if (soon) b.appendChild(el("span", "tr-menu-soon", T.soon));
          b.addEventListener("click", onClick);
          menu.appendChild(b);
        }
        item("1. " + T.fasc, function () { /* contenu a venir */ }, true);
        item("2. " + T.book, function () { pushView(viewBook()); });
        item("3. " + T.wordsRead, function () {
          pushView({ title: T.wordsRead, render: function (p) { renderSeriesRead(p); } });
        });
        panel.appendChild(menu);
      }
    };
  }

  // ---- Page : quatre cartes ----
  var intro = el("div", "section-head");
  intro.appendChild(el("p", "eyebrow eyebrow-center", T.eyebrow));
  intro.appendChild(el("h2", "", T.h2));
  intro.appendChild(el("p", "section-lead", T.lead));
  root.appendChild(intro);
  var grid = el("div", "module-grid tr-cards");
  function card(name, sub, btnText, icon, onOpen, href) {
    var c = el("article", "module-card module-card-intro tr-card");
    c.appendChild(el("span", "module-number", name));
    c.appendChild(el("p", "module-letters", icon));
    c.appendChild(el("p", "module-progress", sub));
    var b;
    if (href) {
      b = el("a", "btn btn-outline btn-sm module-listen", btnText);
      b.href = href;
    } else {
      b = el("button", "btn btn-outline btn-sm module-listen", btnText);
      b.type = "button";
      b.addEventListener("click", onOpen);
    }
    c.appendChild(b);
    grid.appendChild(c);
  }
  card(T.dict, T.dictSub, T.dictBtn, "✍️", null, "dictee.html");
  card(T.atelier, T.atelierSub, T.atelierBtn, "🎧", function () { openView(viewAtelier()); });
  card(T.defi, T.defiSub, T.defiBtn, "🧠", function () { openView(viewDefi()); });
  card(T.lecture, T.lectureSub, T.lectureBtn, "📖", function () { openView(viewLecture()); });
  root.appendChild(grid);
})();
