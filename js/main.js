(function () {
  "use strict";

  // Site root relative to this script's own location, so pages nested in
  // subfolders (e.g. /en/) still resolve assets correctly.
  var SCRIPT_SRC = document.currentScript ? document.currentScript.src : "";
  var ROOT_BASE = SCRIPT_SRC.replace(/js\/main\.js.*$/, "");

  // ---- Acces payant : les modules 1 et 2 sont gratuits, le reste est verrouille ----
  // Le site est statique : il ne peut pas verifier un paiement tout seul. Tout
  // passe par hasModuleAccess(n), alimente pour l'instant par un reglage local
  // (localStorage "ahl_access_v1") que l'on active a la main pour tester :
  //   ahlAccess.grantAll()            -> tout debloquer (abonnement / acces a vie)
  //   ahlAccess.grantModules([3, 5])  -> debloquer des modules precis
  //   ahlAccess.reset()               -> retour a l'etat gratuit
  // Le vrai deblocage apres paiement Stripe viendra se brancher a cet endroit.
  (function () {
    var LANG = (document.documentElement.lang || "fr").slice(0, 2);
    var FREE_MAX = 2;
    var ACCESS_KEY = "ahl_access_v1";
    var GATED = ".js-open-game, .js-open-module, .js-open-formlab, .js-open-shadda, .js-open-sunmoon, " +
      ".js-open-sunmoon-game, .js-open-order-game, .js-open-sound-game, .js-open-puzzle-game, .js-open-write, .js-open-conc";

    function readAccess() {
      try {
        var a = JSON.parse(localStorage.getItem(ACCESS_KEY) || "{}");
        return a && typeof a === "object" ? a : {};
      } catch (e) { return {}; }
    }
    function writeAccess(a) {
      try { localStorage.setItem(ACCESS_KEY, JSON.stringify(a)); } catch (e) { /* stockage indisponible */ }
      refreshLocks();
    }
    function hasModuleAccess(n) {
      n = Number(n);
      if (!n || n <= FREE_MAX) return true;
      var a = readAccess();
      return !!a.all || (Array.isArray(a.modules) && a.modules.indexOf(n) !== -1);
    }
    // Groupes de l'Espace entrainement : cle "defi-N" ou "lecture-N" (N = numero du groupe,
    // comme les modules). Le groupe 1 (alif) est gratuit.
    function hasGroupAccess(key) {
      var m = String(key).match(/(\d+)$/);
      if (m && Number(m[1]) <= 1) return true;
      var a = readAccess();
      return !!a.all || (Array.isArray(a.groups) && a.groups.indexOf(String(key)) !== -1);
    }
    window.ahlAccess = {
      grantAll: function () { writeAccess({ all: true }); },
      grantModules: function (list) { writeAccess({ modules: (list || []).map(Number) }); },
      grantGroups: function (list) { var a = readAccess(); a.groups = (list || []).map(String); writeAccess(a); },
      reset: function () { writeAccess({}); },
      has: hasModuleAccess,
      hasGroup: hasGroupAccess
    };

    // Numero de module d'un bouton : lu sur sa carte ("Module 7", "Модуль 7"...).
    function moduleOf(el) {
      var card = el.closest ? el.closest(".module-card") : null;
      var num = card && card.querySelector(".module-number");
      var m = num && num.textContent.match(/\d+/);
      if (m) return Number(m[0]);
      var d = el.getAttribute && el.getAttribute("data-module");
      return d ? Number(d) : 0;
    }

    var TXT = {
      fr: {
        codeLink: "J’ai un code d’accès", codePlaceholder: "Code d’accès", codeSubmit: "Valider", codeWrong: "Code incorrect.",
        groupTitle: "{name} : accès payant", groupSub: "Le premier groupe (alif) est gratuit. Choisis une formule pour débloquer ce groupe.",
        badge: "🔒 Payant", title: "Module {n} : accès payant",
        sub: "Les modules 1 et 2 sont gratuits. Choisis une formule pour débloquer ce module.",
        single: "Ce module seul", singleDesc: "Module {n}, accès à vie",
        subscribe: "Abonnement", base: "Formule de base", baseDesc: "Accès aux modules",
        all: "Tout inclus", allDesc: "Modules + dictées, lecture et concentration",
        month: "/ mois", year: "/ an", lifetime: "Accès à vie", lifetimeDesc: "Achat unique, tout est débloqué : dictées, lecture et concentration comprises.",
        seeAll: "Voir toutes les formules", close: "Fermer"
      },
      en: {
        codeLink: "I have an access code", codePlaceholder: "Access code", codeSubmit: "Unlock", codeWrong: "Incorrect code.",
        groupTitle: "{name}: paid access", groupSub: "The first group (alif) is free. Choose a plan to unlock this group.",
        badge: "🔒 Premium", title: "Module {n}: paid access",
        sub: "Modules 1 and 2 are free. Choose a plan to unlock this module.",
        single: "This module only", singleDesc: "Module {n}, lifetime access",
        subscribe: "Subscription", base: "Basic plan", baseDesc: "Access to the modules",
        all: "All-inclusive", allDesc: "Modules + dictations, reading and concentration",
        month: "/ month", year: "/ year", lifetime: "Lifetime access", lifetimeDesc: "One-time purchase, everything unlocked: dictations, reading and concentration included.",
        seeAll: "See all plans", close: "Close"
      },
      ru: {
        codeLink: "У меня есть код доступа", codePlaceholder: "Код доступа", codeSubmit: "Открыть", codeWrong: "Неверный код.",
        groupTitle: "{name}: платный доступ", groupSub: "Первая группа (алиф) бесплатна. Выбери тариф, чтобы открыть эту группу.",
        badge: "🔒 Платно", title: "Модуль {n}: платный доступ",
        sub: "Модули 1 и 2 бесплатны. Выбери тариф, чтобы открыть этот модуль.",
        single: "Только этот модуль", singleDesc: "Модуль {n}, доступ навсегда",
        subscribe: "Подписка", base: "Базовый тариф", baseDesc: "Доступ к модулям",
        all: "Всё включено", allDesc: "Модули + диктанты, чтение и концентрация",
        month: "/ мес.", year: "/ год", lifetime: "Доступ навсегда", lifetimeDesc: "Разовая покупка, всё открыто, включая диктанты, чтение и концентрацию.",
        seeAll: "Все тарифы", close: "Закрыть"
      },
      de: {
        codeLink: "Ich habe einen Zugangscode", codePlaceholder: "Zugangscode", codeSubmit: "Freischalten", codeWrong: "Falscher Code.",
        groupTitle: "{name}: kostenpflichtiger Zugang", groupSub: "Die erste Gruppe (Alif) ist kostenlos. Wähle ein Angebot, um diese Gruppe freizuschalten.",
        badge: "🔒 Kostenpflichtig", title: "Modul {n}: kostenpflichtiger Zugang",
        sub: "Die Module 1 und 2 sind kostenlos. Wähle ein Angebot, um dieses Modul freizuschalten.",
        single: "Nur dieses Modul", singleDesc: "Modul {n}, lebenslanger Zugang",
        subscribe: "Abonnement", base: "Basis-Angebot", baseDesc: "Zugang zu den Modulen",
        all: "Alles inklusive", allDesc: "Module + Diktate, Lesen und Konzentration",
        month: "/ Monat", year: "/ Jahr", lifetime: "Lebenslanger Zugang", lifetimeDesc: "Einmaliger Kauf, alles freigeschaltet, einschließlich Diktaten, Lesen und Konzentration.",
        seeAll: "Alle Angebote ansehen", close: "Schließen"
      },
      ar: {
        codeLink: "لدي رمز وصول", codePlaceholder: "رمز الوصول", codeSubmit: "فتح", codeWrong: "الرمز غير صحيح.",
        groupTitle: "{name}: وصول مدفوع", groupSub: "المجموعة الأولى (الألف) مجانية. اختر باقة لفتح هذه المجموعة.",
        badge: "🔒 مدفوع", title: "الوحدة {n}: وصول مدفوع",
        sub: "الوحدتان 1 و2 مجانيتان. اختر باقة لفتح هذه الوحدة.",
        single: "هذه الوحدة فقط", singleDesc: "الوحدة {n}، وصول دائم",
        subscribe: "اشتراك", base: "الباقة الأساسية", baseDesc: "الوصول إلى الوحدات",
        all: "كل شيء مشمول", allDesc: "الوحدات + الإملاء والقراءة والتركيز",
        month: "/ شهريًا", year: "/ سنويًا", lifetime: "وصول مدى الحياة", lifetimeDesc: "دفعة واحدة، كل شيء مفتوح بما في ذلك الإملاء والقراءة والتركيز.",
        seeAll: "عرض كل الباقات", close: "إغلاق"
      }
    };
    var T = TXT[LANG] || TXT.fr;

    // ---- Cadenas sur les cartes ----
    function refreshLocks() {
      document.querySelectorAll(".module-card").forEach(function (card) {
        var n = moduleOf(card);
        var locked = !!n && !hasModuleAccess(n);
        card.classList.toggle("module-card-locked", locked);
        var badge = card.querySelector(".module-paywall");
        if (locked && !badge) {
          badge = document.createElement("p");
          badge.className = "module-paywall";
          badge.textContent = T.badge;
          var firstBtn = card.querySelector("button");
          card.insertBefore(badge, firstBtn || null);
        } else if (!locked && badge) {
          badge.remove();
        }
        card.querySelectorAll(GATED).forEach(function (b) { b.classList.toggle("is-paywalled", locked); });
      });
    }

    // ---- Fenetre "debloquer ce module" ----
    var paywallEl = null;
    var paywallPrevFocus = null;
    var paywallTrigger = null;

    // Code d'acces provisoire (en attendant le deblocage apres paiement) :
    // seule l'empreinte SHA-256 est stockee ici, jamais le code en clair.
    var ACCESS_CODE_HASH = "1e14e1797eb4e258ebe2c720a8104e3c9b934210d905f78481d989ceb2d870f8";
    function sha256Hex(text) {
      if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) return Promise.resolve("");
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      });
    }

    function checkoutHref(key, ref) {
      var links = window.AHL_CHECKOUT_LINKS || {};
      var base = links[key];
      if (typeof base === "string" && /^https:\/\//.test(base)) {
        try {
          var u = new URL(base);
          if (ref) u.searchParams.set("client_reference_id", ref);
          return u.toString();
        } catch (e) { /* lien invalide : repli ci-dessous */ }
      }
      return ROOT_BASE + "formules.html#formules";
    }

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function option(href, labelText, descText, priceText, cls) {
      var a = el("a", "paywall-opt" + (cls ? " " + cls : ""));
      a.href = href;
      var left = el("span", "paywall-opt-left");
      left.appendChild(el("span", "paywall-opt-label", labelText));
      if (descText) left.appendChild(el("span", "paywall-opt-desc", descText));
      a.appendChild(left);
      a.appendChild(el("span", "paywall-opt-price", priceText));
      return a;
    }
    function priceCard(title, desc, monthKey, yearKey, monthPrice, yearPrice) {
      var c = el("div", "paywall-plan");
      c.appendChild(el("p", "paywall-plan-title", title));
      c.appendChild(el("p", "paywall-plan-desc", desc));
      c.appendChild(option(checkoutHref(monthKey), monthPrice + " " + T.month, "", "", "paywall-opt-small"));
      c.appendChild(option(checkoutHref(yearKey), yearPrice + " " + T.year, "", "", "paywall-opt-small"));
      return c;
    }

    function closePaywall() {
      if (!paywallEl) return;
      paywallEl.hidden = true;
      if (!document.querySelector(".game-modal.is-open, .letterlab-modal.is-open, .is-open[role='dialog']")) {
        document.body.style.overflow = "";
      }
      if (paywallPrevFocus && paywallPrevFocus.focus) paywallPrevFocus.focus();
    }

    function openPaywall(n, trigger, opts) {
      opts = opts || {};
      paywallTrigger = trigger || null;
      if (!paywallEl) {
        paywallEl = el("div", "paywall");
        paywallEl.id = "paywall";
        paywallEl.setAttribute("role", "dialog");
        paywallEl.setAttribute("aria-modal", "true");
        paywallEl.addEventListener("click", function (e) { if (e.target === paywallEl) closePaywall(); });
        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && paywallEl && !paywallEl.hidden) closePaywall();
        });
      }
      paywallPrevFocus = document.activeElement;
      paywallEl.textContent = "";
      var box = el("div", "paywall-box");
      var close = el("button", "paywall-close", "×");
      close.type = "button";
      close.setAttribute("aria-label", T.close);
      close.addEventListener("click", closePaywall);
      box.appendChild(close);
      var title = el("h2", "paywall-title", opts.name ? T.groupTitle.replace("{name}", opts.name) : T.title.replace("{n}", n));
      title.id = "paywallTitle";
      paywallEl.setAttribute("aria-labelledby", "paywallTitle");
      box.appendChild(title);
      box.appendChild(el("p", "paywall-sub", opts.name ? T.groupSub : T.sub));

      // Achat du module seul : possible pour les modules 3 a 12 (les jeux
      // bonus 13 a 16 se debloquent avec un abonnement ou l'acces a vie).
      if (!opts.name && n >= 3 && n <= 12) {
        box.appendChild(option(checkoutHref("module-1", "modules-" + n), T.single, T.singleDesc.replace("{n}", n), "3,99 €"));
      }
      box.appendChild(el("p", "paywall-group", T.subscribe));
      var plans = el("div", "paywall-plans");
      plans.appendChild(priceCard(T.base, T.baseDesc, "base-month", "base-year", "7,99 €", "43,99 €"));
      plans.appendChild(priceCard(T.all, T.allDesc, "all-month", "all-year", "8,99 €", "49,99 €"));
      box.appendChild(plans);
      box.appendChild(option(checkoutHref("lifetime"), T.lifetime, T.lifetimeDesc, "79,99 €", "paywall-opt-dark"));
      var all = el("a", "paywall-all", T.seeAll + " →");
      all.href = ROOT_BASE + "formules.html";
      box.appendChild(all);

      // Code d'acces : champ replie derriere un lien discret.
      var codeWrap = el("div", "paywall-code");
      var codeToggle = el("button", "paywall-code-toggle", T.codeLink);
      codeToggle.type = "button";
      var codeForm = el("form", "paywall-code-form");
      codeForm.hidden = true;
      var codeInput = el("input", "paywall-code-input");
      codeInput.type = "password";
      codeInput.placeholder = T.codePlaceholder;
      codeInput.autocomplete = "off";
      codeInput.setAttribute("autocapitalize", "none");
      codeInput.setAttribute("aria-label", T.codePlaceholder);
      var codeBtn = el("button", "paywall-code-submit", T.codeSubmit);
      codeBtn.type = "submit";
      var codeMsg = el("p", "paywall-code-msg");
      codeMsg.setAttribute("aria-live", "polite");
      codeForm.appendChild(codeInput);
      codeForm.appendChild(codeBtn);
      codeToggle.addEventListener("click", function () {
        codeForm.hidden = !codeForm.hidden;
        if (!codeForm.hidden) codeInput.focus();
      });
      codeForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        sha256Hex(codeInput.value.trim().toLowerCase()).then(function (h) {
          if (h && h === ACCESS_CODE_HASH) {
            writeAccess({ all: true });
            var trigger = paywallTrigger;
            closePaywall();
            if (trigger && document.body.contains(trigger)) trigger.click();
          } else {
            codeMsg.textContent = T.codeWrong;
            codeInput.select();
          }
        });
      });
      codeWrap.appendChild(codeToggle);
      codeWrap.appendChild(codeForm);
      codeWrap.appendChild(codeMsg);
      box.appendChild(codeWrap);

      paywallEl.appendChild(box);
      if (!paywallEl.parentNode) document.body.appendChild(paywallEl);
      paywallEl.hidden = false;
      document.body.style.overflow = "hidden";
      close.focus();
    }

    // Capture : intercepte tout bouton de module verrouille avant les autres
    // gestionnaires (y compris les clics programmes "module suivant").
    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(GATED) : null;
      if (!btn) return;
      var n = moduleOf(btn);
      if (hasModuleAccess(n)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openPaywall(n, btn);
    }, true);

    // Ouvre la fenetre de paiement pour un groupe de l'Espace entrainement.
    window.ahlOpenPaywall = function (name, trigger) { openPaywall(0, trigger || null, { name: name }); };

    refreshLocks();
  })();

  // ---- Module "Introduction" : l'ordre de l'alphabet (page Modules) ----
  // Carte placee avant le Module 1, gratuite ; ouvre une fenetre qui presente
  // les 28 lettres dans leur ordre habituel, lettres solaires en couleur.
  (function () {
    var grid = document.querySelector(".module-grid");
    if (!grid || !document.querySelector(".js-open-module")) return;
    var LANG = (document.documentElement.lang || "fr").slice(0, 2);
    var TXT = {
      fr: {
        name: "Introduction", sub: "L’ordre de l’alphabet", open: "Découvrir", close: "Fermer",
        heading: "Bienvenue dans le Module « Introduction »",
        p1: "Dans ce module, vous allez découvrir les 28 lettres de l’alphabet arabe, présentées dans leur ordre habituel.",
        p2: "L’objectif ici est simplement de connaître l’ordre des lettres.",
        p3: "Dans les 12 modules suivants, nous étudierons ces lettres progressivement, groupe par groupe.",
        note: "Voici le premier des quatre ordres les plus connus pour classer les lettres de l’alphabet arabe. C’est l’ordre le plus utilisé et le plus simple."
      },
      en: {
        name: "Introduction", sub: "The order of the alphabet", open: "Discover", close: "Close",
        heading: "Welcome to the “Introduction” module",
        p1: "In this module, you will discover the 28 letters of the Arabic alphabet, presented in their usual order.",
        p2: "The goal here is simply to know the order of the letters.",
        p3: "In the 12 following modules, we will study these letters progressively, group by group.",
        note: "This is the first of the four best-known orders for arranging the letters of the Arabic alphabet. It is the most widely used and the simplest order."
      },
      ru: {
        name: "Введение", sub: "Порядок алфавита", open: "Открыть", close: "Закрыть",
        heading: "Добро пожаловать в модуль «Введение»",
        p1: "В этом модуле вы познакомитесь с 28 буквами арабского алфавита, представленными в их привычном порядке.",
        p2: "Цель здесь проста — узнать порядок букв.",
        p3: "В следующих 12 модулях мы будем изучать эти буквы постепенно, группа за группой.",
        note: "Это первый из четырёх самых известных порядков расположения букв арабского алфавита. Это самый распространённый и самый простой порядок."
      },
      de: {
        name: "Einführung", sub: "Die Reihenfolge des Alphabets", open: "Entdecken", close: "Schließen",
        heading: "Willkommen im Modul „Einführung“",
        p1: "In diesem Modul entdecken Sie die 28 Buchstaben des arabischen Alphabets in ihrer gewohnten Reihenfolge.",
        p2: "Das Ziel ist hier einfach, die Reihenfolge der Buchstaben zu kennen.",
        p3: "In den 12 folgenden Modulen lernen wir diese Buchstaben schrittweise, Gruppe für Gruppe.",
        note: "Dies ist die erste der vier bekanntesten Reihenfolgen, um die Buchstaben des arabischen Alphabets zu ordnen. Es ist die am häufigsten verwendete und einfachste Reihenfolge."
      },
      ar: {
        name: "المقدمة", sub: "ترتيب الحروف", open: "اكتشف", close: "إغلاق",
        heading: "مرحبًا بكم في وحدة «المقدمة»",
        p1: "في هذه الوحدة ستتعرفون على الحروف الثمانية والعشرين للأبجدية العربية، مرتبةً بترتيبها المعتاد.",
        p2: "الهدف هنا ببساطة هو معرفة ترتيب الحروف.",
        p3: "في الوحدات الاثنتي عشرة التالية سندرس هذه الحروف تدريجيًا، مجموعةً بعد مجموعة.",
        note: "هذا هو أول أشهر أربعة ترتيبات لحروف الهجاء العربية، وهو الأكثر استعمالًا والأبسط."
      }
    };
    var T = TXT[LANG] || TXT.fr;
    var ALPHABET = "أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي".split(" ");
    var SUN = "ت ث د ذ ر ز س ش ص ض ط ظ ل ن".split(" ");

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    // ---- Carte ----
    var card = el("article", "module-card module-card-intro");
    card.appendChild(el("span", "module-number", T.name));
    var lettersP = el("p", "module-letters", "أ ب ت … ي");
    lettersP.setAttribute("lang", "ar");
    lettersP.setAttribute("dir", "rtl");
    card.appendChild(lettersP);
    card.appendChild(el("p", "module-progress", T.sub));
    var openBtn = el("button", "btn btn-outline btn-sm module-listen js-open-intro", T.open);
    openBtn.type = "button";
    card.appendChild(openBtn);
    grid.insertBefore(card, grid.firstChild);

    // ---- Fenetre ----
    var modal = null;
    function close() {
      if (!modal) return;
      modal.classList.remove("is-open");
      if (!document.querySelector(".reader.is-open, .game-modal.is-open")) document.body.style.overflow = "";
    }
    function build() {
      modal = el("div", "reader");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", T.name);
      var bar = el("div", "reader-bar");
      bar.appendChild(el("span", "reader-title", T.name));
      var x = el("button", "reader-close", "×");
      x.type = "button";
      x.setAttribute("aria-label", T.close);
      x.addEventListener("click", close);
      bar.appendChild(x);
      var body = el("div", "reader-body");
      var panel = el("div", "formlab-panel intro-panel");
      panel.appendChild(el("h3", "intro-heading", T.heading));
      panel.appendChild(el("p", "intro-text", T.p1));
      panel.appendChild(el("p", "intro-text", T.p2));
      panel.appendChild(el("p", "intro-text", T.p3));
      var alpha = el("div", "intro-alphabet");
      alpha.setAttribute("lang", "ar");
      alpha.setAttribute("dir", "rtl");
      ALPHABET.forEach(function (ch) {
        var tile = el("span", "intro-letter" + (SUN.indexOf(ch) !== -1 ? " is-sun" : ""), ch);
        alpha.appendChild(tile);
      });
      panel.appendChild(alpha);
      panel.appendChild(el("p", "intro-note", T.note));
      body.appendChild(panel);
      modal.appendChild(bar);
      modal.appendChild(body);
      modal.addEventListener("click", function (e) { if (e.target === modal || e.target === body) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
      document.body.appendChild(modal);
    }
    openBtn.addEventListener("click", function () {
      if (!modal) build();
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  })();

  // ---- Carte "Attention" : les 6 lettres qui ne s'attachent pas (a gauche) ----
  // Placee apres le module 5, sans numero (comme l'Introduction), gratuite.
  (function () {
    var grid = document.querySelector(".module-grid");
    if (!grid || !document.querySelector(".js-open-module")) return;
    var LANG = (document.documentElement.lang || "fr").slice(0, 2);
    var TXT = {
      fr: { name: "Attention", sub: "Les 6 lettres qui ne s’attachent pas", open: "Découvrir", close: "Fermer", six: "Les 6 lettres qui ne s’attachent pas (à gauche)" },
      en: { name: "Attention", sub: "The 6 letters that do not connect", open: "Discover", close: "Close", six: "The 6 letters that do not connect (to the left)" },
      ru: { name: "Внимание", sub: "6 букв, которые не соединяются", open: "Открыть", close: "Закрыть", six: "6 букв, которые не соединяются (слева)" },
      de: { name: "Achtung", sub: "Die 6 Buchstaben, die sich nicht verbinden", open: "Entdecken", close: "Schließen", six: "Die 6 Buchstaben, die sich nicht (nach links) verbinden" },
      ar: { name: "انتبه", sub: "الحروف الستة التي لا تتصل", open: "اكتشف", close: "إغلاق", six: "" }
    };
    var T = TXT[LANG] || TXT.fr;
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    // Les 6 lettres qui ne se lient pas a gauche (d'apres la fiche de l'auteur).
    // {x} = lettre en vert. Un seul noeud texte par mot (liaison correcte sur
    // iPhone) ; couleur via la CSS Custom Highlight API, repli sur des <span>.
    var SIX_HEAD = "الْحُرُوفُ السِّتَّةُ الَّتِي لَا تَتَّصِلُ بِشَيْءٍ بَعْدَهَا:";
    var SIX = [
      ["ـد", "يَـ{دُ}هُ"],
      ["ـذ", "بَـ{ذْ}رٌ"],
      ["ـر", "صَـ{رَ}فَ"],
      ["ـز", "يَـ{زِ}نُ"],
      ["ـو", "يَـ{وْ}مٌ"],
      ["ـأ", "سَـ{أَ}لَ"]
    ];
    function greenWord(container, markup) {
      var m = markup.match(/^(.*)\{(.*)\}(.*)$/);
      container.textContent = "";
      if (!m) { container.textContent = markup; return; }
      var plain = m[1] + m[2] + m[3];
      var node = document.createTextNode(plain);
      container.appendChild(node);
      if (window.CSS && CSS.highlights && typeof Highlight !== "undefined") {
        var rg = document.createRange();
        rg.setStart(node, m[1].length);
        rg.setEnd(node, m[1].length + m[2].length);
        var h = CSS.highlights.get("intro-green");
        if (!h) { h = new Highlight(); CSS.highlights.set("intro-green", h); }
        h.add(rg);
      } else {
        container.textContent = "";
        container.appendChild(document.createTextNode(m[1]));
        container.appendChild(el("span", "intro-green", m[2]));
        container.appendChild(document.createTextNode(m[3]));
      }
    }


    // ---- Carte (apres le Module 5) ----
    var card = el("article", "module-card module-card-intro module-card-attention");
    card.appendChild(el("span", "module-number", T.name));
    var lettersP = el("p", "module-letters", "د ذ ر ز و أ");
    lettersP.setAttribute("lang", "ar");
    lettersP.setAttribute("dir", "rtl");
    card.appendChild(lettersP);
    card.appendChild(el("p", "module-progress", T.sub));
    var openBtn = el("button", "btn btn-outline btn-sm module-listen js-open-attention", T.open);
    openBtn.type = "button";
    card.appendChild(openBtn);
    var after = null;
    Array.prototype.forEach.call(grid.querySelectorAll(".module-card"), function (c) {
      var num = c.querySelector(".module-number");
      var m = num && num.textContent.match(/\d+/);
      if (m && Number(m[0]) === 5) after = c;
    });
    if (after) grid.insertBefore(card, after.nextSibling); else grid.appendChild(card);

    // ---- Fenetre ----
    var modal = null;
    function close() {
      if (!modal) return;
      modal.classList.remove("is-open");
      if (!document.querySelector(".reader.is-open, .game-modal.is-open")) document.body.style.overflow = "";
    }
    function build() {
      modal = el("div", "reader");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", T.name);
      var bar = el("div", "reader-bar");
      bar.appendChild(el("span", "reader-title", T.name));
      var x = el("button", "reader-close", "×");
      x.type = "button";
      x.setAttribute("aria-label", T.close);
      x.addEventListener("click", close);
      bar.appendChild(x);
      var body = el("div", "reader-body");
      var panel = el("div", "formlab-panel intro-panel");
      var six = el("section", "intro-six intro-six-top");
      var sixHead = el("h4", "intro-six-ar", SIX_HEAD);
      sixHead.lang = "ar";
      sixHead.dir = "rtl";
      six.appendChild(sixHead);
      if (T.six) six.appendChild(el("p", "intro-six-tr", T.six));
      var sixTable = el("div", "intro-six-table");
      sixTable.lang = "ar";
      sixTable.dir = "rtl";
      SIX.forEach(function (row) {
        sixTable.appendChild(el("span", "intro-six-form", row[0]));
        var w = el("span", "intro-six-word");
        greenWord(w, row[1]);
        sixTable.appendChild(w);
      });
      six.appendChild(sixTable);
      panel.appendChild(six);
      body.appendChild(panel);
      modal.appendChild(bar);
      modal.appendChild(body);
      modal.addEventListener("click", function (e) { if (e.target === modal || e.target === body) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
      document.body.appendChild(modal);
    }
    openBtn.addEventListener("click", function () {
      if (!modal) build();
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  })();

  // ---- Menu deroulant des langues : se ferme au clic ailleurs / Echap ----
  var langMenu = document.querySelector(".lang-menu");
  if (langMenu) {
    document.addEventListener("click", function (e) {
      if (!langMenu.contains(e.target)) langMenu.removeAttribute("open");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") langMenu.removeAttribute("open");
    });
  }

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
      var rtlDir = document.documentElement.dir === "rtl" ? -1 : 1;
      if (e.key === "ArrowLeft") goToPage(readerPage - rtlDir);
      if (e.key === "ArrowRight") goToPage(readerPage + rtlDir);
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
      { id: "baa", items: ["بَابًا", "بَاتَ", "أَبَتِ"] },
      { id: "taa", items: ["بَاتَ", "أَبَتِ"] },
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
      { id: "ghain", items: ["غَرُبَ", "غَرِبَ"] },
      { id: "feh", items: ["فُتِحَ", "فَسُحَ"] },
      { id: "qaf", items: ["قَادَ", "قَرُبَ"] },
      { id: "kaf", items: ["كُتِبَ", "كَاتِبًا"] },
      { id: "lam", items: ["لَطُفَ", "لَخِصَ"] },
      { id: "meem", items: ["عَظُمَ", "مُلِكَ"] },
      { id: "noon", items: ["نُتِجَ", "نَعُمَ"] },
      { id: "heh", items: ["بُهِتَ", "تَاهَ"] },
      { id: "waw", items: ["وُلِدَ", "وُعِدَ"] },
      { id: "yeh", items: ["يَتُمَ", "بَايَعَ"] }
    ];

    // Niveau 3 : dictee par paires de lettres (et quelques phenomenes -
    // chadda/soukoune sur alif, "entree du al-" - plutot que lettre par
    // lettre). "label" (les deux lettres reunies) sert d'affichage a la
    // fois dans le choix de la lettre et l'entete de l'exercice - ce n'est
    // pas le contenu dicte, donc pas un spoiler. "items" a completer avec
    // l'utilisateur, comme le niveau 1.
    var DICTEE_LEVEL_3_ENTRIES = [
      { id: "alif-baa", label: "أ ب", items: ["أَبٍ", "أَبُو", "أَبٍ"] },
      { id: "taa-thaa", label: "ت ث", items: ["أَتُوبَ", "تَتُوبُ", "ثَبَاتٍ", "ثُبُوتٌ"] },
      { id: "jim-haa", label: "ج ح", items: ["تَاجٍ", "ثَجَاجٍ", "تُتِيحُ", "أَبُوحُ", "حُبُوبٍ"] },
      { id: "khaa-dal", label: "خ د", items: ["أَخُو", "أَخٍ", "بَخٍ", "حَدَثَا"] },
      { id: "thal-reh", label: "ذ ر", items: ["ذُبَابٌ", "حَرُورٌ", "رُوحٍ"] },
      { id: "zain-seen", label: "ز س", items: ["زُجَاجٌ", "يُزُورٍ", "زِيدَ", "سُوسٌ", "أُسُسٍ", "سَادِسٌ"] },
      { id: "sheen-sad", label: "ش ص", items: ["شِيبَ", "شَبَابٍ", "صَبُورًا"] },
      { id: "dad-tah", label: "ض ط", items: ["ضَرَرًا", "طَبَاشِيرِي"] },
      { id: "zah-ain", label: "ظ ع", items: ["حُظِرًا", "عَجِيبٍ", "عَرَبٌ"] },
      { id: "ghain-feh", label: "غ ف", items: ["غُرَابِي", "غُبَارٍ", "ضَفِيرٍ", "حُفِظَ"] },
      { id: "qaf-kaf", label: "ق ك", items: ["طُرُقٌ", "طَرِيقِي", "كَثُرَ", "كَاذِبٍ"] },
      { id: "lam-meem", label: "ل م", items: ["بَلَادٍ", "خَلِيلِي", "قَمِيصِي", "تَلَامِيذِي"] },
      { id: "noon-heh", label: "ن ه", items: ["نَظِيفٍ", "نَحِيفًا", "هُدِيتُ", "صُهِرَ"] },
      { id: "waw-yeh", label: "و ي", items: ["وَادٍ", "وُهِبَ", "يَتِيمٍ", "يَدٍ"] },
      { id: "chadda-alif-sad", label: "شدة الألف + ص", items: ["أَدِّ", "تَبَّتْ", "أَزَّرَ", "تُبَشِّرَ", "مُدَرِّسٍ", "صَحَّحَتْ", "بَذَّ", "تُبَصِّرُ", "أَخَّرَ", "تَحُجُّ", "بَثَّ", "مَسَّ"] },
      { id: "chadda-alif-yeh", label: "شدة الألف + ي", items: ["أَكَّدْتُ", "فَعَّالٌ", "يُبَيِّتُونَ", "أَوَّاهٌ", "مَهِّلْ", "قَطَّعَ", "عَضَّتْكَ", "أَفَّاكٍ", "أَلَّفَ", "يُنَمِّي", "إِنَّ", "حَقَّقَ"] },
      { id: "soukoun-alif-thal", label: "سكون الألف + ذ", items: ["تُثْبِتُ", "إِذْ", "أَخْذٍ", "أَحْبَابٌ", "أَجْدَادٌ", "أَبْحَثُ"] },
      { id: "soukoun-alif-ghain", label: "سكون الألف + غ", items: ["دَحْرَجَ", "أَسْبَابٌ", "أَعْبُدُ", "أَبْرَزَ", "تَطْبَعُ", "أَغْرَبُ", "أَدْرُسْ", "تَزْأَرُ", "أَصْبَحَتْ", "ضَرْبٍ", "بَدْرٌ"] },
      { id: "soukoun-alif-yeh", label: "سكون الألف + ي", items: ["لَمْ", "أَقْطَعُ", "يَفْهَمُ", "نَهْدِي", "أَيْدِيهِمْ", "أَكْتُبَ", "أَنْهَارًا", "أَوْهَمَ", "أَمْثَالٍ", "أَظْلَمُ", "أَضْلَاعٌ", "أَبْوَابًا"] },
      { id: "doukhoul-al", label: "دخول ال", items: ["التَّوَّابِ", "البَابِ", "الخُبْزَ", "العَيْنِ", "الدِّينَ", "الرَّحِيمُ", "القَلَمُ", "الشَّمْسِ", "الظَّالِمُ", "المُسْلِمُ", "الوَلَدَ", "اللَّطِيفُ", "اليَدِ", "النُّورُ"] }
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
      { id: "s01", items: ["تُبْ إِلَى اللهِ تَوْبَةً فَيَغْفِرَ لَكَ ذُنُوبَكَ"] },
      { id: "s02", items: ["تَعَلَّمِ العَرَبِيَّةَ فِي الصِّغَرِ أَوْ مُبَكِّرًا يَسْهُلْ عَلَيْكَ حِفْظَ القُرْآنِ"] },
      { id: "s03", items: ["تَعَلَّمْتَ الحُرُوفَ بِسُهُولَةٍ الآنَ تَسْتَطِيعُ الكِتَابَةَ وَ القِرَاءَةَ"] },
      { id: "s04", items: ["خَرَجَ سَعِيدٌ لِلْمَرْكَزِ وَ رَكَّزَ فِي الدَّرْسِ كَيْ يَفْهَمَهُ"] },
      { id: "s05", items: ["عَبْدُ الكَرِيمِ كَرِيمٌ مَعَ ضُيُوفِهِ"] },
      { id: "s06", items: ["لِتَقْرَإِ القُرْآنَ يَوْمِيًّا وَ لَوْ صَفْحَةً وَاحِدَةً"] },
      { id: "s07", items: ["مَاتَتْ قِطَطُ مَرْيَمَ فَطَأْطَأَتْ رَأْسَهَا ثُمَّ بَكَتْ"] },
      { id: "s08", items: ["يَكْتُبُ المُعَلِّمُ كُلَّ المَعْلُومَاتِ وَ يَكْتُبُ طُلَّابُهُ إِيَّاهَا فِي الدَّفْتَرِ"] }
    ];

    // Les 5 niveaux de "Dictee" (page dediee dictee.html) : chacun garde
    // ses propres audios/contenu, mais partage la meme mecanique de jeu
    // (choix de l'element -> ecoute -> correction -> element suivant).
    // "unitFr/unitEn" nomme l'unite dictee (lettre, paire, phrase) pour les
    // entetes ; un "label" sur une entree sert d'affichage non-spoiler
    // (ex. une paire de lettres) - une entree sans label ni lettre connue
    // (phrases) affiche simplement son numero.
    var DICTEE_LEVELS = [
      { id: "1", titleFr: "Dictée — Niveau 1", titleEn: "Dictation — Level 1", titleRu: "Диктант — уровень 1", titleDe: "Diktat — Stufe 1", titleAr: "الإملاء — المستوى 1",
        subtitleFr: "Niveau 1 — les 28 lettres", subtitleEn: "Level 1 — all 28 letters",
        unitFr: "Lettre", unitEn: "Letter", unitRu: "Буква", unitDe: "Buchstabe", unitAr: "حرف", audioFolder: "dictee-niveau-1", entries: DICTEE_LEVEL_1_ENTRIES },
      { id: "2", titleFr: "Dictée — Niveau 2", titleEn: "Dictation — Level 2", titleRu: "Диктант — уровень 2", titleDe: "Diktat — Stufe 2", titleAr: "الإملاء — المستوى 2",
        subtitleFr: "Niveau 2 — les 28 lettres", subtitleEn: "Level 2 — all 28 letters",
        unitFr: "Lettre", unitEn: "Letter", unitRu: "Буква", unitDe: "Buchstabe", unitAr: "حرف", audioFolder: "dictee-niveau-2", entries: DICTEE_LEVEL_2_ENTRIES },
      { id: "3", titleFr: "Dictée — Niveau 3", titleEn: "Dictation — Level 3", titleRu: "Диктант — уровень 3", titleDe: "Diktat — Stufe 3", titleAr: "الإملاء — المستوى 3",
        subtitleFr: "Niveau 3 — paires de lettres", subtitleEn: "Level 3 — letter pairs",
        unitFr: "Paire", unitEn: "Pair", unitRu: "Пара", unitDe: "Paar", unitAr: "زوج", audioFolder: "dictee-niveau-3", entries: DICTEE_LEVEL_3_ENTRIES },
      { id: "4", titleFr: "Dictée — Niveau 4", titleEn: "Dictation — Level 4", titleRu: "Диктант — уровень 4", titleDe: "Diktat — Stufe 4", titleAr: "الإملاء — المستوى 4",
        subtitleFr: "Niveau 4 — phrases", subtitleEn: "Level 4 — sentences",
        unitFr: "Phrase", unitEn: "Sentence", unitRu: "Фраза", unitDe: "Satz", unitAr: "جملة", audioFolder: "dictee-niveau-4", entries: DICTEE_LEVEL_4_ENTRIES },
      { id: "5", titleFr: "Dictée — Niveau 5", titleEn: "Dictation — Level 5", titleRu: "Диктант — уровень 5", titleDe: "Diktat — Stufe 5", titleAr: "الإملاء — المستوى 5",
        subtitleFr: "Niveau 5 — phrases", subtitleEn: "Level 5 — sentences",
        unitFr: "Phrase", unitEn: "Sentence", unitRu: "Фраза", unitDe: "Satz", unitAr: "جملة", audioFolder: "dictee-niveau-5", entries: DICTEE_LEVEL_5_ENTRIES }
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
    var AUDIO_VERSION = "9";

    function playForm(id, cellEl) {
      if (currentAudio) { currentAudio.pause(); }
      if (currentPlayingCell) { currentPlayingCell.classList.remove("is-playing"); }
      currentAudio = new Audio(currentAudioBase + id + ".m4a?v=" + AUDIO_VERSION);
      currentPlayingCell = cellEl;
      cellEl.classList.add("is-playing");
      currentAudio.addEventListener("ended", function () {
        cellEl.classList.remove("is-playing");
      });
      currentAudio.play().catch(function () {});
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
    // tatwil possible juste apres) : les alif, dal/dhal, reh/zain, waw,
    // et le hamza seul sur la ligne (ء), qui ne se lie jamais ni avant
    // ni apres (ex. "قِرَاءَة" : pas de tatwil entre le ء et le ة).
    var NON_CONNECTING_LETTERS = { "ا": 1, "أ": 1, "إ": 1, "آ": 1, "ٱ": 1, "د": 1, "ذ": 1, "ر": 1, "ز": 1, "و": 1, "ؤ": 1, "ء": 1 };

    // La famille alif : quand elle suit un lam, les deux lettres forment
    // une ligature obligatoire (لا/ﻵ...) que la plupart des polices
    // arabes dessinent comme un seul glyphe compose - y inserer un
    // tatwil casse cette ligature (donne "لـا" au lieu de "لا").
    var ALEF_FAMILY = { "ا": 1, "أ": 1, "إ": 1, "آ": 1, "ٱ": 1 };

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
        var isLamAlef = tokens[j].base === "ل" && next && ALEF_FAMILY[next.base];
        if (tokens[j].base && !NON_CONNECTING_LETTERS[tokens[j].base] && next && next.base && !isLamAlef) {
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
      // Un Text node par caractere (comme avant) casse la liaison
      // cursive arabe sur Safari/WebKit (iOS) : contrairement a
      // Chrome/Firefox, WebKit ne shape pas de maniere fiable un mot a
      // travers plusieurs Text node JS distincts, meme sans element
      // entre eux. On regroupe donc tous les caracteres "normaux" dans
      // un seul Text node contigu, et on ne coupe que pour le cas
      // special du "إ" (qui a besoin de son propre span pour la kasra).
      var buffer = "";
      var i = 0;
      function flush() {
        if (buffer) {
          container.appendChild(document.createTextNode(buffer));
          buffer = "";
        }
      }
      while (i < text.length) {
        if (text.charAt(i) === "إ" && text.charAt(i + 1) === "ِ") {
          buffer += "إ";
          flush();
          var mark = document.createElement("span");
          mark.className = "arabic-kasra-fix";
          mark.textContent = "ِ";
          container.appendChild(mark);
          i += 2;
        } else {
          buffer += text.charAt(i);
          i++;
        }
      }
      flush();
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

      if (trailing) {
        // Lettre de base + marque + lettre de prolongation regroupees en
        // UN SEUL Text node, sans aucun <span> entre elles : verifie que
        // sur Safari/WebKit, meme une marque isolee dans son propre
        // element entre deux vraies lettres (ex. "با", "بو", "بي") suffit
        // a casser leur liaison cursive - contrairement au cas d'une
        // lettre seule (pas de bug la, cf. cas normal plus bas). La
        // coloration rouge de la voyelle+prolongation passe donc par un
        // degrade CSS (text-fill) calcule sur le texte reellement rendu
        // (Range), jamais par un <span> separe qui casserait la liaison.
        // Transition adoucie (pas une coupure nette) : la frontiere entre
        // deux lettres pleinement connectees (ex. "بو") tombe en plein
        // milieu du trait de liaison, un arret net y ferait un effet
        // "moitie bleu moitie rouge" qui ressemble a un bug.
        wrap.textContent = baseChar + diacritic + trailing;
        container.appendChild(wrap);
        requestAnimationFrame(function () { colorizeProlongation(wrap, baseChar.length); });
        return;
      }

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
      container.appendChild(wrap);
    }

    function colorizeProlongation(wrap, navyLen) {
      // Mesure la largeur REELLEMENT rendue de "base+marque" (forme liee,
      // dans son vrai contexte) via Range, plutot qu'une mesure canvas
      // isolee : une lettre mesuree seule prend sa forme isolee (souvent
      // plus large) et fausse completement la proportion.
      var textNode = wrap.firstChild;
      var fullRange = document.createRange();
      fullRange.selectNodeContents(textNode);
      var fullRect = fullRange.getBoundingClientRect();
      if (!fullRect.width) return;
      var navyRange = document.createRange();
      navyRange.setStart(textNode, 0);
      navyRange.setEnd(textNode, navyLen);
      var navyRect = navyRange.getBoundingClientRect();
      var pct = (navyRect.width / fullRect.width) * 100;
      var soft = 18;
      var from = Math.max(0, pct - soft);
      var to = Math.min(100, pct + soft);
      wrap.style.background = "linear-gradient(to left, var(--color-navy) " + from +
        "%, var(--color-harakat-red) " + to + "%)";
      wrap.style.webkitBackgroundClip = "text";
      wrap.style.backgroundClip = "text";
      wrap.style.color = "transparent";
      wrap.style.webkitTextFillColor = "transparent";
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
    var isRussian = document.documentElement.lang === "ru";
    var isGerman = document.documentElement.lang === "de";
    var isArabic = document.documentElement.lang === "ar";

    // Notes de prononciation (position de la langue, comparaison avec un
    // son connu...) fournies par l'utilisateur, lettre par lettre - pas
    // encore de traduction anglaise, donc affichees uniquement en FR.
    // Liste complete telle que voulue : les autres lettres n'ont pas
    // besoin d'aide a la prononciation, elles n'affichent donc pas ce
    // bloc (pas d'oubli).
    var LETTER_PRONUNCIATION_NOTES = {
      thaa: "Sortez légèrement le bout de la langue entre les incisives supérieures et inférieures, sans la mordre. Puis soufflez doucement, sans faire vibrer la gorge. Exemple : le « th » de « think » en anglais.",
      haa: "Comme lorsque l’on souffle sur ses lunettes pour les nettoyer : un souffle fort et sec qui sort du fond de la gorge, sans vibration de la voix.",
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

    // Meme principe en anglais (textes fournis par l'utilisateur) ; les
    // autres lettres n'ont pas besoin d'aide a la prononciation.
    var LETTER_PRONUNCIATION_NOTES_EN = {
      thaa: "Put the tip of your tongue lightly between your teeth and blow air out: th… Examples: think, three, thank.",
      haa: "Breathe out strongly from deep in your throat, without using your voice: ḥ… Only an approximation; ح is deeper and stronger. Example: hat.",
      khaa: "Make a soft, rough kh sound from the back of your mouth, like gently clearing your throat. Example: loch.",
      thal: "Put the tip of your tongue lightly between your teeth and make a voiced sound: dh… Examples: this, that, mother.",
      reh: "Quickly tap the tip of your tongue behind your upper teeth (incisors): r… Do not pull your tongue back, as you would for the English “r”. Spanish: perro.",
      sad: "Say s, but make your tongue heavier and pull it slightly back.",
      dad: "Say d, but make your tongue heavier and pull it slightly back.",
      tah: "Say t, but make your tongue heavier and pull it slightly back.",
      zah: "Say th as in “this”, but make your tongue heavier and pull it slightly back.",
      ain: "Gently tighten your throat, then make a voiced sound through it. There is no exact English sound.",
      ghain: "Make a soft, vibrating gh sound from the back of your throat.",
      qaf: "Make a k sound much deeper in the mouth, near the throat: q…",
      heh: "Breathe out softly, like h in “house”."
    };

    // Russe (textes fournis par l'utilisateur) ; memes lettres qu'en anglais.
    var LETTER_PRONUNCIATION_NOTES_RU = {
      thaa: "Положите кончик языка слегка между зубами и выдохните воздух: ث… Как английское th в слове «think».",
      thal: "Положите кончик языка слегка между зубами и произнесите звук с голосом: ذ… Как английское th в слове «this».",
      haa: "Сильно выдохните из глубины горла, без голоса: ح… Сильный придыхательный «х», как в слове «хлеб».",
      khaa: "Произнесите мягкий, шершавый звук «х» глубоко в горле. Примеры: «хлеб», «хороший».",
      ain: "Слегка напрягите горло и произнесите звук с голосом через это напряжение. Русского эквивалента нет.",
      ghain: "Произнесите мягкий звонкий звук «г»/«х», похожий на французское r. Звонкое «х»/«г»: как в «хлеб», но с голосом.",
      qaf: "Произнесите «к», но гораздо глубже, ближе к горлу: ق… Глубокое «к», как в словах «кот», «класс».",
      sad: "Произнесите «с», но тяжелее и немного глубже. Тяжёлое «с», как в словах «сад», «сок».",
      dad: "Произнесите «д», но тяжелее и немного глубже. Тяжёлое «д», как в словах «дом», «да».",
      tah: "Произнесите «т», но тяжелее и немного глубже. Тяжёлое «т», как в словах «там», «тётя».",
      zah: "Произнесите звонкий звук «з»/«д» с языком между зубами, тяжелее и глубже. Тяжёлое «з»/«д», как в слове «зонт».",
      reh: "Коснитесь кончиком языка за верхними зубами и быстро произнесите «р»: ر… Примеры: «рука», «метро».",
      heh: "Мягко выдохните, как в звуке «х», но легче: هـ… Лёгкое «х», как в слове «хлеб»."
    };

    // Allemand (textes fournis par l'utilisateur) ; memes lettres qu'en anglais.
    var LETTER_PRONUNCIATION_NOTES_DE = {
      thaa: "Englisches th (think, three). Kein echtes deutsches Gegenstück. Die Zungenspitze liegt leicht zwischen den Zähnen.",
      thal: "Englisches th (this, that). Wie ث, aber mit Stimme aus dem Hals.",
      haa: "Kräftiges h (Haus, Hund, Hallo). ح ist tiefer und stärker als das deutsche h.",
      khaa: "ch nach a, o, u (Bach, Buch, acht). Sehr gute Annäherung; خ ist meist etwas tiefer.",
      reh: "Spanisches/italienisches r (perro, rosso). Nicht das deutsche Zäpfchen-r in „rot“ verwenden; mit der Zungenspitze kurz hinter den oberen Zähnen tippen.",
      sad: "Schweres s (Sonne, Satz). Wie deutsches s, aber schwerer und tiefer.",
      dad: "Schweres d (Dach, Tag). Wie deutsches d, aber schwerer und tiefer.",
      tah: "Schweres t (Tisch, Tag). Wie deutsches t, aber schwerer und tiefer.",
      zah: "Schweres englisches th (this). Wie ذ, aber schwerer und tiefer.",
      ain: "Kein deutsches Gegenstück. Die Mitte des Rachens leicht verengen und kurz mit Stimme sprechen; Audio ist wichtig.",
      ghain: "Stimmhaftes ch (Bach + Stimme). Wie das ch in Bach, aber mit Vibration im Hals.",
      qaf: "Tiefes k (Karte, Kind, Kuchen). Wie deutsches k, aber viel weiter hinten im Mund, nahe am Rachen.",
      heh: "h (Haus, Hund, Hallo). Sehr ähnlich; هـ ist ein leichter Atemlaut."
    };

    var GROUP_TITLES = isGerman
      ? {
          harakat: "Vokale (الْحَرَكَات)", moudoud: "Dehnungen (الْمُدُود)", tanwin: "Tanwin (التَّنْوِين)",
          sukun: "Sukun (السُّكُون)", shadda: "Schadda (الشَّدَّة)"
        }
      : isArabic
      ? {
          harakat: "(الْحَرَكَات)", moudoud: "(الْمُدُود)", tanwin: "(التَّنْوِين)",
          sukun: "(السُّكُون)", shadda: "(الشَّدَّة)"
        }
      : isRussian
      ? {
          harakat: "Огласовки (الْحَرَكَات)", moudoud: "Продления (الْمُدُود)", tanwin: "Танвин (التَّنْوِين)",
          sukun: "Сукун (السُّكُون)", shadda: "Шадда (الشَّدَّة)"
        }
      : isEnglish
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
      var note = isEnglish ? LETTER_PRONUNCIATION_NOTES_EN[letter.id] : isRussian ? LETTER_PRONUNCIATION_NOTES_RU[letter.id] : isGerman ? LETTER_PRONUNCIATION_NOTES_DE[letter.id] : (!isArabic && LETTER_PRONUNCIATION_NOTES[letter.id]);
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
        taa: "التِّينُ", thaa: "الثَّوَابُ", dal: "الدِّينُ", thal: "الذُّنُوبُ",
        reh: "الرَّحْمَٰنُ", zain: "الزَّيْتُونُ", seen: "السُّورَةُ", sheen: "الشَّمْسُ",
        sad: "الصَّلَاةُ", dad: "الضَّلَالُ", tah: "الطَّالِبُ", zah: "الظُّلْمُ",
        lam: "اللَّهُ", noon: "النُّورُ"
      };
      var MOON_WORDS = {
        khaa: "الخُبْزُ", ghain: "الغَفَّارُ", qaf: "القَلَمُ", alif: "الْإِمَامُ",
        baa: "الْبَابُ", jim: "الْجَنَّةُ", haa: "الْحَلَالُ", ain: "الْعِيدُ",
        feh: "الْفَلَقُ", kaf: "الْكَافِرُ", meem: "الْمُسْلِمُ", heh: "الْهِجْرَةُ",
        waw: "الْوَلَدُ", yeh: "الْيَدُ"
      };

      // Le meme mot sans l'article "الـ" (origine du mot), affiche a cote :
      // "تِينٌ ... ال+ت = التِّينُ". Pas d'origine pour اللَّهُ.
      var SUN_MOON_BASE = {
        taa: "تِينٌ", thaa: "ثَوَابٌ", dal: "دِينٌ", thal: "ذُنُوبٌ",
        reh: "رَحْمَٰنٌ", zain: "زَيْتُونٌ", seen: "سُورَةٌ", sheen: "شَمْسٌ",
        sad: "صَلَاةٌ", dad: "ضَلَالٌ", tah: "طَالِبٌ", zah: "ظُلْمٌ",
        noon: "نُورٌ",
        khaa: "خُبْزٌ", ghain: "غَفَّارٌ", qaf: "قَلَمٌ", alif: "إِمَامٌ",
        baa: "بَابٌ", jim: "جَنَّةٌ", haa: "حَلَالٌ", ain: "عِيدٌ",
        feh: "فَلَقٌ", kaf: "كَافِرٌ", meem: "مُسْلِمٌ", heh: "هِجْرَةٌ",
        waw: "وَلَدٌ", yeh: "يَدٌ"
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

      var FORM_LABEL = isGerman ? {
        start: "Am Anfang",
        middle: "In der Mitte",
        end: "Am Ende",
        endAlt: "Am Ende (nach einem nicht verbindenden Buchstaben)"
      } : isArabic ? {
        start: "في الأول",
        middle: "في الوسط",
        end: "في الآخر",
        endAlt: "في الآخر (بعد حرف لا يتصل)"
      } : isRussian ? {
        start: "В начале",
        middle: "В середине",
        end: "В конце",
        endAlt: "В конце (после несоединяющейся буквы)"
      } : {
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
          var isLamAlef = flat[j].base === "ل" && next && ALEF_FAMILY[next.base];
          if (flat[j].base && !NON_CONNECTING_LETTERS[flat[j].base] && next && next.base && !isLamAlef) {
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
          ? (isGerman ? "☀️ Sonnenbuchstabe" : isArabic ? "☀️ حرف شمسي" : isRussian ? "☀️ Солнечная буква" : isEnglish ? "☀️ Sun letter" : "☀️ Lettre solaire")
          : (isGerman ? "🌙 Mondbuchstabe" : isArabic ? "🌙 حرف قمري" : isRussian ? "🌙 Лунная буква" : isEnglish ? "🌙 Moon letter" : "🌙 Lettre lunaire");
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
          // "s'accroche" plutot que "se lie" : evite la confusion avec le
          // verbe "lire" a l'oral pour un enfant qui debute.
          var noteText = isGerman
            ? "Dieser Buchstabe verbindet sich nie mit dem folgenden Buchstaben, daher sehen seine Formen „in der Mitte“ und „am Ende“ gleich aus."
            : isArabic
            ? "هذا الحرف لا يتصل أبدًا بالحرف الذي بعده، ولذلك يتشابه شكلاه «في الوسط» و«في الآخر»."
            : isRussian
            ? "Эта буква никогда не соединяется со следующей буквой: поэтому её формы «в середине» и «в конце» выглядят одинаково."
            : isEnglish
            ? "This letter never connects to the one after it, so its “middle” and “end” shapes look the same."
            : "Cette lettre ne s'accroche jamais à la lettre suivante : ses formes « milieu » et « fin » se ressemblent donc.";
          if (id === "alif") {
            noteText += isGerman
              ? " Er nimmt außerdem nie ein Sukun oder eine Schadda an."
              : isArabic
              ? " كما أنه لا يقبل السكون ولا الشدّة أبدًا."
              : isRussian
              ? " Она также никогда не принимает ни сукун, ни шадду."
              : isEnglish
              ? " It also never takes a sukoon or a shadda."
              : " Elle ne prend jamais non plus de soukoune ni de chadda.";
          }
          note.textContent = noteText;
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
      // Les mots solaires / lunaires ont de vrais fichiers audio
      // (assets/audio/sunmoon/, generes avec une voix arabe) : ils sonnent
      // sur tous les appareils. La synthese vocale du navigateur ne sert
      // plus que de secours si le fichier ne se charge pas (beaucoup
      // d'iPhone n'ont aucune voix arabe installee et restent muets).
      var sunMoonAudio = null;
      function playSunMoonWord(type, id, text) {
        if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
        if (sunMoonAudio) { sunMoonAudio.pause(); }
        var audio = new Audio(ROOT_BASE + "assets/audio/sunmoon/" + type + "-" + id + ".m4a?v=2");
        sunMoonAudio = audio;
        var fellBack = false;
        function fallback() {
          if (fellBack || sunMoonAudio !== audio) return;
          fellBack = true;
          speakArabicWord(text);
        }
        audio.addEventListener("error", fallback);
        audio.play().catch(fallback);
      }

      function speakArabicWord(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar-SA";
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }

      // Colore le "الـ" d'un mot sans le couper en plusieurs noeuds texte.
      function addAlHighlight(type, range) {
        if (!window.CSS || !CSS.highlights || typeof Highlight === "undefined") return false;
        var h = CSS.highlights.get("sm-al-" + type);
        if (!h) { h = new Highlight(); CSS.highlights.set("sm-al-" + type, h); }
        h.add(range);
        return true;
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
        if (window.CSS && CSS.highlights) { CSS.highlights.delete("sm-al-sun"); CSS.highlights.delete("sm-al-moon"); }
        sunMoonPanel.innerHTML = "";
        sunMoonPanel.classList.add("sunmoon-panel");
        // Ecran large : le tableau a gauche, les mots avec leur audio a droite.
        var smSplit = document.createElement("div");
        smSplit.className = "sm-split";
        var smLeft = document.createElement("div");
        smLeft.className = "sm-left";
        var smRight = document.createElement("div");
        smRight.className = "sm-right";
        smSplit.appendChild(smLeft);
        smSplit.appendChild(smRight);

        // Tableau de reference clair, avant les exemples en situation :
        // deux colonnes (solaires a droite, lunaires a gauche, comme sur le
        // schema de reference), les lettres dans l'ordre de l'alphabet
        // regroupees par series avec leur nombre.
        var SM_GROUPS = { sun: [2, 10, 2], moon: [2, 3, 2, 3, 4] };
        var SM_TITLE_AR = { sun: "الحُرُوفُ الشَّمْسِيَّةُ", moon: "الحُرُوفُ القَمَرِيَّةُ" };
        var SM_TITLE_LOCAL = {
          sun: isGerman ? "Sonnenbuchstaben" : isRussian ? "Солнечные буквы" : isEnglish ? "Sun letters" : "Les lettres solaires",
          moon: isGerman ? "Mondbuchstaben" : isRussian ? "Лунные буквы" : isEnglish ? "Moon letters" : "Les lettres lunaires"
        };
        var table = document.createElement("div");
        table.className = "sunmoon-schema";
        [["sun", allSunIds], ["moon", allMoonIds]].forEach(function (pair) {
          var type = pair[0], ids = pair[1];
          var col = document.createElement("div");
          col.className = "sm-col sm-col-" + type;
          var icon = document.createElement("div");
          icon.className = "sm-icon";
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = type === "sun" ? "☀️" : "🌙";
          var titleAr = document.createElement("h4");
          titleAr.className = "sm-title-ar";
          titleAr.lang = "ar";
          titleAr.dir = "rtl";
          titleAr.textContent = SM_TITLE_AR[type];
          col.appendChild(icon);
          col.appendChild(titleAr);
          if (!isArabic) {
            var titleLocal = document.createElement("p");
            titleLocal.className = "sm-title-local";
            titleLocal.textContent = SM_TITLE_LOCAL[type];
            col.appendChild(titleLocal);
          }
          var badge = document.createElement("p");
          badge.className = "sm-badge";
          badge.lang = "ar";
          badge.dir = "rtl";
          badge.textContent = ids.length + " حَرْفًا";
          col.appendChild(badge);
          var list = document.createElement("div");
          list.className = "sm-list";
          var at = 0;
          SM_GROUPS[type].forEach(function (size) {
            var row = document.createElement("div");
            row.className = "sm-row";
            var letters = document.createElement("div");
            letters.className = "sm-letters";
            ids.slice(at, at + size).forEach(function (id) {
              var l = document.createElement("span");
              l.textContent = ALL_LETTERS_BY_ID[id] ? ALL_LETTERS_BY_ID[id].char : id;
              letters.appendChild(l);
            });
            at += size;
            var bracket = document.createElement("div");
            bracket.className = "sm-bracket";
            var count = document.createElement("div");
            count.className = "sm-count";
            count.textContent = String(size);
            row.appendChild(letters);
            row.appendChild(bracket);
            row.appendChild(count);
            list.appendChild(row);
          });
          col.appendChild(list);
          table.appendChild(col);
        });
        smLeft.appendChild(table);

        var intro = document.createElement("p");
        intro.className = "sunmoon-intro";
        intro.textContent = isGerman
          ? "Wenn man الـ (den Artikel „der/die/das“) vor ein Wort setzt, entscheidet sein erster Buchstabe, was mit dem « ل » geschieht:"
          : isArabic
          ? "عندما نضيف الـ (أداة التعريف) قبل كلمة، يحدد حرفها الأول ما يحدث للام « ل »:"
          : isRussian
          ? "Когда перед словом добавляют الـ (артикль «the»), его первая буква решает, что происходит с « ل »:"
          : isEnglish
          ? "When you add الـ (\"the\") before a word, its first letter decides what happens to the ل:"
          : "Quand on ajoute الـ (« le / la / l’ ») devant un mot, sa première lettre décide ce qui arrive au « ل » :";
        smRight.appendChild(intro);

        function addSection(type, ids, wordsMap) {
          if (!ids.length) return;
          var h3 = document.createElement("h3");
          h3.className = "sunmoon-section-title sunmoon-section-" + type;
          h3.textContent = type === "sun"
            ? (isGerman ? "☀️ Sonne — der Buchstabe nach dem « ل » trägt eine Schadda" : isArabic ? "☀️ شمسي — الحرف بعد « ل » تلحقه شدّة" : isRussian ? "☀️ Солнечная — буква после « ل » принимает шадду" : isEnglish ? "☀️ Sun — the ل is silent, the letter takes a Shadda" : "☀️ Solaire — la lettre après le « ل » porte une Shadda")
            : (isGerman ? "🌙 Mond — das « ل » wird ausgesprochen" : isArabic ? "🌙 قمري — تُنطق « ل »" : isRussian ? "🌙 Лунная — « ل » произносится" : isEnglish ? "🌙 Moon — the ل is pronounced" : "🌙 Lunaire — le « ل » s'entend");
          smRight.appendChild(h3);
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
            // Mot complet : l'article "الـ" colore (rouge = solaire, bleu = lunaire),
            // puis, dessous, l'origine du mot sans article.
            var stretched = stretchArabic(wordsMap[id]);
            var al = stretched.match(/^ا[\u064B-\u0652]*ل[\u064B-\u0652]*ـ?/);
            var word = document.createElement("p");
            word.className = "formlab-word";
            // Le mot reste dans UN SEUL noeud texte (sinon Safari/iPhone laisse un
            // petit vide apres le "ال") ; la couleur est appliquee par la
            // CSS Custom Highlight API. Sans elle, repli : deux morceaux colores.
            renderArabicText(word, stretched);
            if (al) {
              var firstNode = word.firstChild;
              var done = false;
              if (firstNode && firstNode.nodeType === 3 && firstNode.length >= al[0].length) {
                var alRange = document.createRange();
                alRange.setStart(firstNode, 0);
                alRange.setEnd(firstNode, al[0].length);
                done = addAlHighlight(type, alRange);
              }
              if (!done) {
                word.textContent = "";
                var alSpan = document.createElement("span");
                alSpan.className = "sm-al sm-al-" + type;
                renderArabicText(alSpan, al[0]);
                word.appendChild(alSpan);
                var rest = document.createElement("span");
                renderArabicText(rest, stretched.slice(al[0].length));
                word.appendChild(rest);
              }
            }
            var origin = document.createElement("p");
            origin.className = "sunmoon-origin";
            origin.lang = "ar";
            origin.dir = "rtl";
            var letterChar = ALL_LETTERS_BY_ID[id] ? ALL_LETTERS_BY_ID[id].char : "";
            // الْإِمَامُ commence par un alif avec hamza EN DESSOUS (إ), pas au-dessus.
            if (id === "alif") { letterChar = "إ"; label.textContent = "إ"; }
            if (SUN_MOON_BASE[id]) {
              var baseSpan = document.createElement("span");
              baseSpan.className = "sm-origin-base";
              renderArabicText(baseSpan, stretchArabic(SUN_MOON_BASE[id]));
              origin.appendChild(baseSpan);
              origin.appendChild(document.createTextNode(" … "));
            }
            var formula = document.createElement("span");
            formula.className = "sm-origin-formula";
            var alMini = document.createElement("span");
            alMini.className = "sm-al sm-al-" + type;
            alMini.textContent = "ال";
            formula.appendChild(alMini);
            formula.appendChild(document.createTextNode("+" + letterChar));
            origin.appendChild(formula);
            var wordBox = document.createElement("div");
            wordBox.className = "sunmoon-word-box";
            wordBox.appendChild(word);
            wordBox.appendChild(origin);
            var play = document.createElement("span");
            play.className = "sunmoon-word-play";
            play.textContent = "🔊";
            card.appendChild(label);
            card.appendChild(wordBox);
            card.appendChild(play);
            card.addEventListener("click", function () { playSunMoonWord(type, id, wordsMap[id]); });
            grid.appendChild(card);
          });
          smRight.appendChild(grid);
        }

        addSection("sun", sunIds, SUN_WORDS);
        addSection("moon", moonIds, MOON_WORDS);
        sunMoonPanel.appendChild(smSplit);

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

      // ---- Ecriture des lettres : tracer au doigt en suivant un guide ----
      // Pour chaque lettre (et chaque forme : isolee, debut, milieu, fin), un
      // modele de trace (traits dans l'ordre + points). L'eleve trace avec le
      // doigt ; le site compare avec le modele (sens, forme, debut et fin du
      // trait) et valide trait par trait. Repere 320 x 220, ligne d'ecriture
      // a y = 135 ; l'ecriture va de la droite vers la gauche.
      var WRITE_BASE = 135;
      var WRITE_DATA = (function () {
        function S(pts) { return { pts: pts, sharp: false }; }   // courbe lissee
        function P(pts) { return { pts: pts, sharp: true }; }    // trait droit / angle
        function R(st) { return { pts: st.pts.slice().reverse(), sharp: st.sharp }; }   // meme trait, sens inverse
        function F(strokes, dots) { return { strokes: strokes, dots: dots || [] }; }
        var D = {};

        // ---- Alif ----
        // Alif porteur d'une hamza (أ) : la hampe est un peu raccourcie pour laisser la place
        // a la hamza, tracee en dernier au-dessus de la hampe.
        function hamza(cx, cy) {
          return S([[cx + 16, cy - 14], [cx + 4, cy - 16], [cx - 9, cy - 12], [cx - 12, cy - 4], [cx - 3, cy], [cx + 10, cy + 3], [cx + 15, cy + 9], [cx + 7, cy + 14], [cx - 6, cy + 15], [cx - 15, cy + 12]]);
        }
        D.alif = {
          isolated: F([P([[160, 76], [160, 134]]), hamza(160, 37)]),
          final: F([P([[262, 134], [166, 134], [166, 76]]), hamza(166, 37)])
        };

        // ---- Famille du baa (ب ت ث ن ي) : tracés dessinés par l'auteur du site ----
        var BAA_ISO = S([[270, 100], [267, 118], [257, 129], [218, 132], [166, 134], [125, 134], [105, 130], [100, 118], [100, 105], [105, 92], [117, 83], [130, 81]]);
        var BAA_INIT = S([[255, 84], [257, 108], [252, 124], [240, 133], [200, 134], [133, 133]]);
        var BAA_MED_LINE = S([[278, 130], [240, 130], [222, 131], [177, 133], [100, 134]]);
        var BAA_MED_TOOTH = P([[234, 130], [232, 90]]);
        var BAA_FIN_TAIL = S([[298, 110], [268, 112], [238, 114], [230, 110], [229, 94], [229, 78]]);
        // meme fin que le baa isole : trait plat sur la ligne puis crochet a gauche
        var BAA_FIN_BOWL = S([[233, 118], [218, 131], [180, 134], [148, 134], [125, 134], [105, 130], [100, 118], [100, 105], [105, 92], [117, 83], [130, 81]]);
        // Un seul mouvement : la dent monte puis redescend, et le trait continue vers la gauche.
        var BAA_MED_ONE = S([[278, 130], [245, 130], [236, 128], [233, 108], [232, 90], [230, 108], [228, 126], [221, 131], [177, 133], [100, 134]]);
        var BAA_FIN_ONE = S([[298, 110], [268, 112], [240, 114], [232, 108], [230, 92], [229, 78], [227, 94], [227, 108], [226, 120], [216, 130], [180, 134], [148, 134], [125, 134], [105, 130], [100, 118], [100, 105], [105, 92], [117, 83], [130, 81]]);
        function baaFamily(iso, init, med, fin) {
          return {
            isolated: F([BAA_ISO], iso), initial: F([BAA_INIT], init),
            medial: F([BAA_MED_ONE], med), final: F([BAA_FIN_ONE], fin)
          };
        }
        D.baa = baaFamily([[189, 160]], [[258, 168]], [[229, 158]], [[174, 158]]);
        D.taa = baaFamily([[150, 108], [190, 108]], [[200, 112], [232, 112]], [[222, 68], [246, 68]], [[160, 100], [194, 104]]);
        D.thaa = baaFamily([[150, 110], [190, 110], [170, 86]], [[200, 114], [232, 114], [216, 90]], [[222, 70], [246, 70], [234, 48]], [[150, 102], [190, 106], [170, 80]]);

        // ---- Famille du jim (ج ح خ) : tracés dessinés par l'auteur du site ----
        function jimFamily(dots) {
          return {
            isolated: F([
              R(S([[262, 56], [234, 57], [204, 59], [184, 55], [172, 49], [162, 49], [149, 57]])),
              S([[204, 59], [184, 66], [164, 84], [150, 108], [145, 132], [146, 156], [158, 174], [182, 180], [214, 180], [247, 173]])
            ], dots[0]),
            initial: F([
              R(S([[262, 120], [238, 119], [216, 119], [202, 114], [192, 106], [184, 105], [176, 108], [172, 114]])),
              S([[212, 120], [198, 126], [178, 131], [158, 133], [138, 134], [122, 134]])
            ], dots[1]),
            medial: F([
              R(S([[298, 92], [262, 99], [226, 101], [202, 98], [181, 92], [166, 90], [148, 93], [133, 100]])),
              S([[214, 103], [190, 111], [169, 117], [151, 124], [130, 131], [112, 133], [69, 134], [58, 136]]),
              S([[295, 135], [256, 134], [239, 126], [233, 114], [232, 100]])
            ], dots[2]),
            final: F([
              R(S([[260, 35], [250, 44], [228, 49], [200, 49], [168, 49], [152, 50], [140, 57]])),
              S([[195, 52], [177, 62], [165, 78], [148, 92], [143, 114], [145, 138], [159, 161], [183, 175], [212, 180], [240, 180], [264, 174]]),
              S([[298, 76], [274, 82], [252, 82], [233, 76], [220, 66], [216, 52]])
            ], dots[3])
          };
        }
        D.jim = jimFamily([[[218, 138]], [[219, 144]], [[188, 146]], [[210, 128]]]);
        D.haa = jimFamily([[], [], [], []]);
        D.khaa = jimFamily([[[214, 30]], [[200, 84]], [[200, 68]], [[200, 22]]]);

        // ---- Dal / Thal : tracés dessinés par l'auteur du site ----
        var DAL_ISO = S([[224, 94], [228, 82], [235, 80], [242, 82], [248, 90], [258, 104], [260, 114], [258, 124], [253, 129], [234, 133], [218, 134], [206, 133], [201, 128], [200, 121]]);
        var DAL_FIN_STEM = S([[297, 126], [284, 129], [272, 128], [264, 123], [258, 116], [254, 103], [250, 87], [248, 66]]);
        var DAL_FIN_BAR = S([[259, 120], [254, 126], [247, 134], [229, 134], [206, 134], [199, 135], [193, 130], [193, 116]]);
        D.dal = { isolated: F([DAL_ISO]), final: F([DAL_FIN_STEM, DAL_FIN_BAR]) };
        D.thal = { isolated: F([DAL_ISO], [[236, 58]]), final: F([DAL_FIN_STEM, DAL_FIN_BAR], [[248, 46]]) };

        // ---- Reh / Zain : tracés dessinés par l'auteur du site ----
        var REH_ISO = S([[248, 110], [255, 122], [260, 130], [260, 140], [252, 152], [240, 164], [229, 176], [222, 184], [214, 185], [207, 181], [206, 178]]);
        var REH_FIN_JOIN = S([[297, 127], [285, 131], [273, 133], [262, 131], [256, 129]]);
        var REH_FIN_BODY = S([[242, 116], [249, 122], [255, 128], [257, 140], [255, 158], [247, 175], [237, 187], [226, 195], [216, 195], [207, 191]]);
        D.reh = { isolated: F([REH_ISO]), final: F([REH_FIN_JOIN, REH_FIN_BODY]) };
        D.zain = { isolated: F([REH_ISO], [[246, 86]]), final: F([REH_FIN_JOIN, REH_FIN_BODY], [[250, 96]]) };

        // ---- Seen / Sheen : tracés dessinés par l'auteur du site ----
        var SEEN_ISO = S([[270, 54], [265, 74], [256, 81], [250, 62], [243, 80], [232, 88], [221, 72], [225, 98], [222, 120], [205, 140], [180, 145], [160, 134], [152, 105], [158, 81], [163, 79]]);
        var SEEN_INIT = S([[270, 99], [268, 120], [261, 130], [251, 106], [244, 128], [234, 134], [222, 112], [214, 122], [196, 130], [169, 134]]);
        var SEEN_MED = S([[297, 126], [270, 126], [255, 111], [246, 128], [235, 111], [226, 134], [211, 109], [202, 124], [180, 133], [160, 134]]);
        var SEEN_FIN = S([[298, 100], [272, 105], [251, 84], [240, 108], [232, 86], [212, 107], [199, 89], [202, 115], [192, 142], [160, 155], [132, 145], [127, 129], [133, 99], [139, 94]]);
        // Agrandit un trace autour de son bord droit (x = ox) et de la ligne (y = 134), puis le descend de dy.
        function grow(pts, ox, k, dy) {
          return pts.map(function (p) { return [Math.round(ox - (ox - p[0]) * k), Math.round(134 - (134 - p[1]) * k + (dy || 0))]; });
        }
        function seenFamily(dots) {
          var K = 1.25;
          return {
            isolated: F([S(grow(SEEN_ISO.pts, 270, K, 14))], grow(dots[0], 270, K, 14)),
            initial: F([S(grow(SEEN_INIT.pts, 270, K, 0))], grow(dots[1], 270, K, 0)),
            medial: F([S(grow(SEEN_MED.pts, 297, K, 0))], grow(dots[2], 297, K, 0)),
            final: F([S(grow(SEEN_FIN.pts, 298, K, 14))], grow(dots[3], 298, K, 14))
          };
        }
        D.seen = seenFamily([[], [], [], []]);
        D.sheen = seenFamily([
          [[258, 46], [230, 46], [244, 30]], [[258, 82], [238, 82], [248, 62]],
          [[246, 86], [222, 86], [234, 66]], [[240, 66], [214, 66], [227, 48]]
        ]);

        // ---- Sad / Dad : tracés dessinés par l'auteur du site ----
        function sadFamily(dots) {
          return {
            isolated: F([
              S([[209, 93], [224, 77], [242, 64], [260, 56], [269, 59], [270, 68], [263, 82], [251, 89], [233, 93], [215, 95], [209, 93]]),
              S([[190, 72], [195, 82], [200, 92], [198, 106], [194, 121], [185, 132], [173, 136], [155, 138], [137, 138], [128, 132], [125, 118], [127, 100], [130, 85], [138, 78], [140, 74]])
            ], dots[0]),
            initial: F([
              S([[208, 135], [216, 121], [228, 108], [243, 102], [259, 100], [268, 105], [270, 113], [264, 125], [252, 134], [234, 139], [219, 140], [211, 138], [208, 142], [205, 145]]),
              S([[208, 135], [204, 130], [200, 120], [197, 113], [196, 111], [194, 117], [190, 125], [181, 131], [168, 133], [153, 134]])
            ], dots[1]),
            medial: F([
              S([[202, 136], [211, 122], [224, 108], [240, 97], [257, 91], [263, 96], [263, 109], [257, 120], [249, 125], [241, 131], [224, 136], [211, 138], [202, 138], [199, 141], [197, 146]]),
              S([[201, 136], [197, 130], [192, 120], [188, 113], [187, 113], [185, 118], [178, 126], [164, 133], [137, 134]]),
              S([[298, 131], [276, 130], [259, 127], [249, 122]])
            ], dots[2]),
            final: F([
              S([[193, 93], [205, 82], [219, 70], [235, 61], [251, 57], [258, 63], [258, 75], [252, 86], [246, 93], [235, 96], [215, 98], [199, 97], [193, 94]]),
              S([[179, 74], [181, 84], [184, 96], [185, 108], [183, 120], [175, 132], [161, 138], [145, 140], [127, 137], [117, 126], [115, 110], [117, 94], [123, 85], [129, 84], [131, 89]]),
              S([[298, 97], [275, 97], [259, 96], [248, 93]])
            ], dots[3])
          };
        }
        D.sad = sadFamily([[], [], [], []]);
        D.dad = sadFamily([[[250, 34]], [[250, 76]], [[245, 68]], [[238, 32]]]);

        // ---- Tah / Zah : tracés dessinés par l'auteur du site ----
        function tahFamily(dots) {
          return {
            isolated: F([
              S([[201, 31], [201, 52], [202, 82], [203, 126]]),
              S([[201, 127], [210, 120], [228, 104], [243, 96], [255, 97], [262, 104], [262, 114], [254, 120], [240, 126], [222, 130], [203, 132], [195, 134], [185, 134], [173, 133], [165, 129], [162, 125]])
            ], dots[0]),
            initial: F([
              S([[209, 21], [209, 44], [209, 81], [210, 116]]),
              S([[201, 129], [211, 118], [226, 104], [244, 93], [256, 90], [262, 96], [262, 110], [255, 119], [240, 126], [222, 131], [203, 133], [180, 134], [159, 135]])
            ], dots[1]),
            medial: F([
              S([[298, 130], [270, 130], [242, 130]]),
              S([[200, 28], [202, 48], [204, 78], [204, 111]]),
              S([[191, 133], [206, 114], [221, 101], [233, 94], [247, 94], [253, 99], [252, 111], [247, 121], [236, 127], [221, 131], [206, 133], [191, 133], [176, 134], [156, 136]])
            ], dots[2]),
            final: F([
              S([[298, 130], [272, 130], [239, 131]]),
              S([[210, 22], [210, 50], [210, 78], [210, 107]]),
              S([[191, 133], [201, 122], [215, 108], [227, 99], [242, 92], [255, 88], [260, 92], [259, 101], [254, 114], [246, 124], [236, 128], [219, 131], [203, 132], [192, 133], [182, 132], [173, 128], [167, 122], [162, 119]])
            ], dots[3])
          };
        }
        // ط / ظ : d'abord le corps (de la jonction, par le haut de la boucle, jusqu'a la queue),
        // puis la tige verticale du bas vers le haut ; la liaison (milieu / fin) en dernier.
        function tahOrder(fam) {
          var iso = fam.isolated.strokes;
          fam.isolated.strokes = [iso[1], R(iso[0])];
          var ini = fam.initial.strokes;
          fam.initial.strokes = [ini[1], R(ini[0])];
          ["medial", "final"].forEach(function (f) {
            var st = fam[f].strokes;
            fam[f].strokes = [st[2], R(st[1]), st[0]];
          });
          return fam;
        }
        D.tah = tahOrder(tahFamily([[], [], [], []]));
        D.zah = tahOrder(tahFamily([[[224, 48]], [[232, 38]], [[224, 40]], [[234, 38]]]));

        // ---- Ain / Ghain : tracés dessinés par l'auteur du site ----
        function ainFamily(dots) {
          return {
            isolated: F([
              S([[215, 51], [200, 50], [190, 53], [183, 62], [185, 73], [193, 80], [203, 82], [215, 76], [224, 70], [232, 66]]),
              S([[206, 83], [194, 91], [185, 100], [180, 112], [178, 127], [178, 142], [182, 154], [193, 163], [206, 168], [223, 170], [242, 170], [256, 167], [264, 160], [270, 155]])
            ], dots[0]),
            initial: F([
              S([[249, 99], [241, 90], [231, 87], [219, 89], [210, 97], [207, 109], [210, 119], [219, 124]]),
              S([[262, 105], [253, 114], [238, 121], [223, 129], [205, 132], [189, 134], [168, 134], [148, 134]])
            ], dots[1]),
            medial: F([
              S([[298, 133], [281, 134], [264, 134], [254, 133], [249, 127], [245, 122]]),
              S([[216, 113], [222, 110], [233, 103], [243, 97], [254, 96], [260, 100], [261, 109], [254, 117], [245, 122], [236, 126], [222, 129], [206, 131], [191, 133], [172, 134], [152, 134]])
            ], dots[2]),
            final: F([
              S([[288, 86], [277, 88], [262, 89], [248, 88], [239, 84], [234, 81]]),
              S([[212, 73], [220, 62], [230, 54], [244, 52], [253, 57], [255, 67], [248, 75], [234, 81]]),
              S([[233, 81], [221, 89], [210, 98], [205, 112], [204, 130], [207, 145], [216, 157], [231, 165], [248, 169], [269, 170], [286, 166], [296, 162], [300, 159]])
            ], dots[3])
          };
        }
        D.ain = ainFamily([[], [], [], []]);
        D.ghain = ainFamily([[[206, 30]], [[230, 66]], [[240, 74]], [[240, 30]]]);

        // ---- Feh / Qaf : tracés dessinés par l'auteur du site ----
        D.feh = {
          // boucle dans le sens des aiguilles d'une montre (depart en bas a gauche, comme sur le PDF), puis la queue
          isolated: F([
            S([[233, 104], [228, 92], [231, 80], [240, 74], [251, 77], [257, 87], [259, 97], [255, 105], [246, 108], [237, 107], [233, 104]]),
            S([[259, 98], [261, 106], [262, 112], [257, 121], [241, 129], [217, 135], [187, 139], [166, 140], [154, 137], [145, 128], [141, 116], [142, 106], [143, 101]])
          ], [[218, 55]]),
          initial: F([
            S([[226, 107], [222, 96], [225, 86], [232, 81], [240, 82], [247, 88], [251, 96], [250, 104], [244, 109], [235, 111], [227, 109], [226, 107]]),
            S([[252, 100], [260, 108], [262, 118], [256, 127], [242, 132], [219, 134], [194, 134], [171, 135]])
          ], [[236, 54]]),
          medial: F([S([[298, 130], [280, 130], [265, 128], [253, 123], [245, 118], [236, 111], [232, 102], [234, 93], [241, 88], [250, 88], [257, 93], [258, 103], [253, 112], [245, 118], [231, 124], [216, 129], [201, 132], [186, 134], [171, 134]])], [[245, 54]]),
          final: F([S([[298, 120], [273, 121], [255, 122], [245, 121], [239, 117], [234, 107], [232, 96], [237, 85], [246, 80], [254, 83], [257, 93], [255, 104], [249, 113], [242, 120], [234, 126], [221, 133], [204, 138], [183, 140], [162, 140], [149, 137], [140, 129], [137, 119], [138, 108], [143, 101], [147, 98]])], [[225, 59]])
        };
        D.qaf = {
          isolated: F([
            S([[238, 100], [235, 89], [239, 80], [247, 76], [255, 80], [260, 89], [260, 99], [254, 105], [245, 106], [239, 103], [238, 100]]),
            S([[260, 100], [262, 110], [255, 121], [243, 131], [230, 138], [216, 140], [206, 137], [200, 125], [196, 112], [194, 101], [198, 92], [202, 89], [207, 92]])
          ], [[239, 48], [259, 48]]),
          initial: F([
            S([[233, 94], [230, 84], [233, 77], [240, 73], [248, 75], [253, 82], [254, 90], [250, 96], [243, 98], [236, 97], [233, 94]]),
            S([[254, 92], [259, 96], [262, 103], [260, 112], [253, 119], [240, 124], [217, 129], [189, 134]])
          ], [[233, 53], [260, 40]]),
          medial: F([S([[298, 126], [279, 125], [264, 124], [251, 119], [240, 116], [233, 110], [231, 100], [233, 89], [239, 83], [248, 82], [255, 88], [255, 100], [252, 110], [240, 118], [227, 124], [212, 128], [197, 132], [182, 134], [171, 134]])], [[234, 44], [255, 46]]),
          final: F([S([[298, 95], [285, 95], [270, 97], [261, 98], [250, 99], [243, 95], [242, 86], [244, 76], [252, 71], [260, 71], [263, 79], [261, 91], [260, 101], [255, 113], [246, 124], [235, 135], [225, 140], [210, 140], [198, 138], [190, 130], [185, 117], [183, 103], [183, 89], [187, 81], [192, 79]])], [[238, 46], [261, 42]])
        };

        // ---- Kaf : tracés dessinés par l'auteur du site ----
        D.kaf = {
          isolated: F([
            S([[258, 33], [259, 54], [263, 81], [268, 105], [270, 121], [266, 129], [252, 133], [222, 135], [205, 134], [196, 128], [192, 121], [194, 114], [198, 111]]),
            S([[241, 57], [233, 59], [227, 66], [228, 74], [237, 80], [244, 86], [242, 93], [231, 98], [219, 98], [210, 98]])
          ]),
          initial: F([
            S([[262, 32], [247, 38], [229, 50], [211, 63], [196, 72], [188, 75], [199, 79], [209, 90], [213, 104], [213, 116], [203, 124], [184, 129], [166, 133], [145, 135]])
          ]),
          medial: F([
            S([[298, 140], [289, 134], [273, 129], [253, 117], [232, 106], [213, 96], [196, 87], [184, 80], [180, 70]]),
            S([[248, 25], [232, 34], [215, 46], [200, 54], [185, 60], [180, 70]]),
            S([[215, 102], [220, 111], [221, 120], [211, 126], [196, 130], [178, 133], [154, 134], [142, 135]])
          ]),
          final: F([
            S([[298, 129], [279, 129], [264, 127], [255, 121], [250, 109], [248, 91], [244, 64], [243, 40]]),
            S([[246, 110], [239, 120], [221, 127], [200, 132], [177, 134], [165, 132], [160, 124], [159, 114], [164, 106], [171, 101]]),
            S([[213, 50], [206, 54], [201, 63], [199, 73], [206, 79], [214, 83], [212, 90], [200, 93], [183, 93]])
          ])
        };

        // ---- Lam : tracés dessinés par l'auteur du site ----
        D.lam = {
          isolated: F([S([[269, 25], [269, 45], [270, 69], [270, 99], [270, 120], [268, 129], [260, 133], [239, 135], [221, 134], [213, 128], [212, 116], [215, 105], [219, 94], [223, 90]])]),
          initial: F([S([[257, 25], [258, 45], [261, 69], [262, 96], [262, 116], [258, 127], [251, 132], [236, 133], [218, 134], [215, 135]])]),
          medial: F([
            S([[298, 130], [279, 130], [267, 129], [258, 124], [252, 115], [249, 96], [249, 66], [249, 42], [249, 34]]),
            S([[250, 118], [246, 124], [236, 128], [224, 132], [212, 134], [205, 134]])
          ]),
          final: F([
            S([[298, 86], [285, 90], [271, 92], [261, 91], [255, 84], [251, 74], [248, 58], [245, 38], [243, 19]]),
            S([[250, 86], [249, 100], [245, 114], [237, 127], [225, 135], [211, 140], [201, 138], [192, 131], [186, 119], [186, 108], [190, 98], [198, 92]])
          ])
        };

        // ---- Meem : tracés dessinés par l'auteur du site ----
        D.meem = {
          isolated: F([S([[231, 128], [240, 132], [252, 133], [263, 129], [269, 120], [268, 110], [260, 103], [249, 101], [238, 104], [230, 111], [226, 121], [224, 134], [223, 147], [226, 157], [232, 167], [236, 177], [239, 189], [239, 200]])]),
          initial: F([
            S([[256, 131], [261, 123], [262, 112], [258, 104], [250, 100], [241, 101], [233, 106], [228, 114], [228, 123], [233, 130], [242, 133], [251, 133], [256, 131]]),
            S([[232, 127], [222, 125], [212, 127], [200, 130], [188, 132], [175, 134]])
          ]),
          medial: F([
            S([[298, 126], [281, 129], [266, 127], [252, 118], [242, 108], [236, 100], [232, 99], [224, 114], [218, 126], [209, 132], [191, 134], [167, 134], [160, 130]]),
            S([[228, 106], [227, 118], [230, 129], [239, 136], [250, 136], [256, 134]])
          ]),
          final: F([
            S([[298, 134], [283, 134], [266, 133], [253, 129], [242, 125], [235, 120], [229, 116]]),
            S([[230, 116], [235, 125], [240, 135], [241, 144], [237, 151], [231, 149], [227, 141], [224, 129], [225, 119]]),
            S([[227, 116], [217, 121], [208, 126], [204, 135], [202, 151], [202, 164], [205, 177], [213, 186], [215, 196], [215, 204]])
          ])
        };

        // ---- Noon : tracés dessinés par l'auteur du site ----
        D.noon = {
          isolated: F([S([[249, 67], [254, 78], [259, 88], [262, 100], [262, 111], [257, 121], [249, 130], [242, 138], [233, 140], [215, 140], [205, 137], [199, 129], [198, 117], [199, 104], [203, 96], [210, 91]])], [[230, 60]]),
          initial: F([S([[260, 102], [262, 113], [262, 123], [258, 130], [249, 133], [234, 135], [219, 135], [205, 132]])], [[261, 74]]),
          medial: F([S([[298, 129], [286, 130], [273, 131], [262, 129], [256, 121], [252, 114], [250, 121], [245, 130], [233, 133], [214, 135], [196, 134], [192, 133]])], [[250, 73]]),
          final: F([
            S([[298, 81], [283, 85], [269, 88], [259, 87], [254, 82], [251, 76]]),
            S([[255, 84], [258, 98], [260, 113], [257, 124], [249, 133], [239, 138], [224, 140], [206, 138], [195, 131], [191, 118], [191, 105], [194, 93], [199, 83], [203, 80]])
          ], [[230, 42]])
        };

        // ---- Heh : tracés dessinés par l'auteur du site ----
        D.heh = {
          isolated: F([S([[245, 83], [245, 87], [251, 93], [257, 100], [261, 108], [262, 119], [258, 127], [250, 132], [240, 134], [233, 132], [230, 124], [231, 112], [235, 101], [240, 92], [244, 86]])]),
          initial: F([S([[228, 85], [239, 92], [250, 105], [259, 118], [262, 130], [257, 139], [247, 142], [236, 141], [226, 136], [220, 132], [218, 123], [221, 114], [227, 109], [234, 109], [240, 114], [240, 120], [234, 126], [224, 131], [212, 133], [194, 135], [178, 134]])]),
          medial: F([
            S([[298, 126], [279, 127], [261, 130], [246, 133], [234, 134]]),
            S([[234, 132], [228, 122], [232, 109], [242, 95], [251, 86], [257, 89], [259, 101], [252, 113], [242, 122], [232, 129], [228, 140], [231, 153], [240, 163], [251, 164], [257, 157], [257, 147], [251, 140], [242, 138], [232, 138]]),
            S([[228, 135], [218, 135], [200, 135], [179, 133]])
          ]),
          final: F([
            S([[298, 129], [283, 133], [268, 134], [263, 129], [257, 115], [252, 99], [249, 84], [248, 73]]),
            S([[249, 89], [238, 94], [231, 103], [230, 113], [236, 118], [244, 118], [250, 111], [251, 102]])
          ])
        };

        // ---- Waw : tracés dessinés par l'auteur du site ----
        D.waw = {
          isolated: F([S([[261, 94], [251, 96], [242, 94], [238, 86], [238, 76], [243, 71], [252, 72], [258, 78], [262, 87], [261, 94], [256, 104], [249, 114], [240, 123], [231, 130], [220, 135], [208, 137], [195, 138]])]),
          final: F([S([[298, 92], [280, 93], [265, 93], [253, 94], [246, 92], [243, 84], [245, 75], [251, 70], [260, 70], [265, 76], [265, 84], [264, 93], [262, 102], [253, 113], [241, 125], [229, 133], [217, 138], [208, 136]])])
        };

        // ---- Yeh : tracés dessinés par l'auteur du site ----
        D.yeh = {
          isolated: F([S([[262, 52], [250, 52], [239, 58], [229, 69], [221, 81], [223, 93], [232, 100], [247, 104], [259, 108], [259, 112], [250, 117], [238, 124], [223, 131], [208, 136], [193, 138], [178, 139], [170, 135], [166, 127], [164, 114], [164, 97], [167, 87], [173, 78], [181, 70]])], [[201, 165], [229, 165]]),
          initial: F([S([[253, 89], [259, 97], [262, 108], [260, 118], [252, 126], [237, 130], [222, 133], [207, 134]])], [[246, 159], [273, 159]]),
          medial: F([S([[298, 131], [285, 133], [272, 136], [261, 137], [255, 133], [251, 124], [248, 117], [245, 122], [240, 127], [225, 130], [207, 132], [189, 135]])], [[237, 166], [261, 166]]),
          final: F([S([[298, 75], [281, 78], [263, 80], [248, 82], [242, 88], [248, 94], [263, 97], [272, 101], [272, 111], [262, 121], [245, 128], [230, 135], [215, 139], [201, 139], [194, 134], [189, 122], [189, 107], [191, 93], [198, 82], [204, 76]])], [[221, 158], [244, 158]])
        };

        // Les lettres qui ne se lient pas a la suivante n'ont que 2 formes ; les autres
        // formes reprennent isolee / fin.
        ["alif", "dal", "thal", "reh", "zain", "waw"].forEach(function (id) {
          D[id].initial = D[id].isolated;
          D[id].medial = D[id].final;
        });
        // Lettres posees sur la ligne : la partie "corps" (dents du س ش, boucle du ص ض, liaison)
        // repose sur la ligne d'ecriture et seul le ventre descend dessous, comme sur le modele ;
        // sinon l'eleve ecrirait la lettre trop haut ou trop loin de la ligne.
        (function () {
          function mapForm(fm, fn) {
            fm.strokes = fm.strokes.map(function (st) { return { pts: st.pts.map(fn), sharp: st.sharp }; });
            fm.dots = fm.dots.map(fn);
          }
          function down(id, f, dy) { mapForm(D[id][f], function (q) { return [q[0], q[1] + dy]; }); }
          ["seen", "sheen"].forEach(function (id) { down(id, "isolated", 40); down(id, "final", 22); });
          ["sad", "dad"].forEach(function (id) { down(id, "isolated", 38); down(id, "final", 36); });
          ["ain", "ghain"].forEach(function (id) {
            down(id, "isolated", 12);
            // fin : la liaison part de la ligne (et non de tres haut) ; le ventre est resserre
            mapForm(D[id].final, function (q) { return [q[0], 126 + (q[1] - 86) * 0.8]; });
          });
        })();
        // Lettres dont le "ventre" ou la queue descend SOUS la ligne d'ecriture (ل ن ي ق و) :
        // on les descend pour que la ligne passe a la hauteur de la ligne de base,
        // au lieu qu'elles soient posees dessus.
        (function () {
          var DEPTH = { lam: 20, noon: 22, yeh: 20, qaf: 24, waw: 22 };
          var LINE = WRITE_BASE + 10;
          var seen = [];
          Object.keys(DEPTH).forEach(function (id) {
            ["isolated", "final"].forEach(function (f) {
              var fm = D[id][f];
              if (!fm || seen.indexOf(fm) !== -1) return;
              seen.push(fm);
              var bottom = -1e9;
              fm.strokes.forEach(function (st) { st.pts.forEach(function (p) { if (p[1] > bottom) bottom = p[1]; }); });
              var dy = Math.round(LINE + DEPTH[id] - bottom);
              if (dy <= 0) return;
              fm.strokes = fm.strokes.map(function (st) {
                return { pts: st.pts.map(function (p) { return [p[0], p[1] + dy]; }), sharp: st.sharp };
              });
              fm.dots = fm.dots.map(function (d) { return [d[0], d[1] + dy]; });
            });
          });
          ["isolated", "final"].forEach(function () { /* formes partagees : deja traitees via seen */ });
        })();
        // Points places AU-DESSUS : toujours bien au-dessus du haut du trait (le jim,
        // dont le point est sous la tete, et les points sous la lettre ne bougent pas).
        (function () {
          var seen = [];
          Object.keys(D).forEach(function (id) {
            if (id === "jim") return;
            ["isolated", "initial", "medial", "final"].forEach(function (f) {
              var fm = D[id][f];
              if (!fm || !fm.dots.length || seen.indexOf(fm) !== -1) return;
              seen.push(fm);
              if (!fm.dots.every(function (d) { return d[1] < 140; })) return;
              var minX = Math.min.apply(null, fm.dots.map(function (d) { return d[0]; })) - 28;
              var maxX = Math.max.apply(null, fm.dots.map(function (d) { return d[0]; })) + 28;
              var allTop = 1e9, localTop = 1e9;
              fm.strokes.forEach(function (st) {
                writeDense(st).forEach(function (p) {
                  if (p[1] < allTop) allTop = p[1];
                  if (p[0] >= minX && p[0] <= maxX && p[1] < localTop) localTop = p[1];
                });
              });
              // lettres basses : au-dessus du point le plus haut de la lettre ; lettres a hampe : au-dessus du trait voisin
              var top = allTop >= 55 ? allTop : localTop;
              var lowest = Math.max.apply(null, fm.dots.map(function (d) { return d[1]; }));
              var highest = Math.min.apply(null, fm.dots.map(function (d) { return d[1]; }));
              var need = lowest - (top - 30);
              if (need > 0 && highest - need >= 22) {
                fm.dots = fm.dots.map(function (d) { return [d[0], d[1] - need]; });
              }
            });
          });
        })();
        // Points SOUS la lettre (ب ي) : au moins 26 unites sous le bas du trait voisin.
        (function () {
          var seen = [];
          ["baa", "yeh"].forEach(function (id) {
            ["isolated", "initial", "medial", "final"].forEach(function (f) {
              var fm = D[id][f];
              if (!fm || !fm.dots.length || seen.indexOf(fm) !== -1) return;
              seen.push(fm);
              var minX = Math.min.apply(null, fm.dots.map(function (d) { return d[0]; })) - 28;
              var maxX = Math.max.apply(null, fm.dots.map(function (d) { return d[0]; })) + 28;
              var bottom = -1e9;
              fm.strokes.forEach(function (st) {
                writeDense(st).forEach(function (p) { if (p[0] >= minX && p[0] <= maxX && p[1] > bottom) bottom = p[1]; });
              });
              var top = Math.min.apply(null, fm.dots.map(function (d) { return d[1]; }));
              var low = Math.max.apply(null, fm.dots.map(function (d) { return d[1]; }));
              var need = Math.min((bottom + 26) - top, 198 - low);
              if (need > 0) fm.dots = fm.dots.map(function (d) { return [d[0], d[1] + need]; });
            });
          });
        })();
        return D;
      })();

      var WRITE_FORMS = ["isolated", "initial", "medial", "final"];
      var WRITE_TXT = {
        fr: { extra: "Il y a un point en trop : enlève-le avec la gomme.", wordTitle: "Écris le mot", watch: "Regarde comment le mot s’écrit, puis écris-le à ton tour.", replay: "Revoir", yourTurn: "À toi : suis les pointillés avec ton doigt.", pen: "Crayon", eraser: "Gomme", clear: "Tout effacer", check: "Vérifier", nextBtn: "Suivant →", draw: "Trace d’abord la lettre avec ton doigt.", more: "Il manque encore une partie de la lettre.", finished: "🎉 Tu as écrit toutes les lettres de ce module !", title: "Écriture", pick: "Choisis la lettre", forms: ["Isolée", "Début", "Milieu", "Fin"], how: "Trace la lettre avec ton doigt en suivant les pointillés et la flèche. Commence au point orange.", ok: "✓ Bien écrit !", again: "Recommencer", bad: "Presque : suis bien les pointillés.", dot: "Touche maintenant les points.", next: "Trace le trait suivant.", notebook: "Prends ton cahier ou ton ardoise pour reproduire plusieurs fois.", words: "Des mots pour t’exercer", close: "Fermer", btn: "Écrire les lettres" },
        en: { extra: "There is an extra dot: remove it with the eraser.", wordTitle: "Write the word", watch: "Watch how the word is written, then write it yourself.", replay: "Replay", yourTurn: "Your turn: follow the dots with your finger.", pen: "Pencil", eraser: "Eraser", clear: "Clear all", check: "Check", nextBtn: "Next →", draw: "First trace the letter with your finger.", more: "Part of the letter is still missing.", finished: "🎉 You have written all the letters of this module!", title: "Writing", pick: "Choose the letter", forms: ["Isolated", "Start", "Middle", "End"], how: "Trace the letter with your finger, following the dotted line and the arrow. Start at the orange dot.", ok: "✓ Well written!", again: "Start again", bad: "Almost: follow the dotted line.", dot: "Now tap the dot.", next: "Draw the next stroke.", notebook: "Take your notebook or slate to copy it several times.", words: "Words to practise", close: "Close", btn: "Write the letters" },
        ru: { extra: "Лишняя точка: сотри её ластиком.", wordTitle: "Напиши слово", watch: "Посмотри, как пишется слово, затем напиши его сам.", replay: "Ещё раз", yourTurn: "Теперь ты: веди пальцем по пунктиру.", pen: "Карандаш", eraser: "Ластик", clear: "Стереть всё", check: "Проверить", nextBtn: "Дальше →", draw: "Сначала обведи букву пальцем.", more: "Ещё не хватает части буквы.", finished: "🎉 Ты написал(а) все буквы этого модуля!", title: "Письмо", pick: "Выбери букву", forms: ["Отдельно", "В начале", "В середине", "В конце"], how: "Обведи букву пальцем по пунктиру и стрелке. Начни с оранжевой точки.", ok: "✓ Хорошо написано!", again: "Заново", bad: "Почти: следуй пунктиру.", dot: "Теперь коснись точки.", next: "Проведи следующую линию.", notebook: "Возьми тетрадь или грифельную доску и повтори несколько раз.", words: "Слова для тренировки", close: "Закрыть", btn: "Писать буквы" },
        de: { extra: "Ein Punkt zu viel: entferne ihn mit dem Radierer.", wordTitle: "Schreibe das Wort", watch: "Sieh zu, wie das Wort geschrieben wird, und schreibe es dann selbst.", replay: "Nochmal", yourTurn: "Du bist dran: Fahre die Punkte mit dem Finger nach.", pen: "Stift", eraser: "Radierer", clear: "Alles löschen", check: "Prüfen", nextBtn: "Weiter →", draw: "Fahre zuerst den Buchstaben mit dem Finger nach.", more: "Ein Teil des Buchstabens fehlt noch.", finished: "🎉 Du hast alle Buchstaben dieses Moduls geschrieben!", title: "Schreiben", pick: "Wähle den Buchstaben", forms: ["Einzeln", "Anfang", "Mitte", "Ende"], how: "Fahre den Buchstaben mit dem Finger nach, entlang der gepunkteten Linie und des Pfeils. Beginne beim orangen Punkt.", ok: "✓ Gut geschrieben!", again: "Nochmal", bad: "Fast: folge der gepunkteten Linie.", dot: "Tippe jetzt auf den Punkt.", next: "Zeichne den nächsten Strich.", notebook: "Nimm dein Heft oder deine Tafel und schreibe es mehrmals ab.", words: "Wörter zum Üben", close: "Schließen", btn: "Buchstaben schreiben" },
        ar: { extra: "هناك نقطة زائدة: امسحها بالممحاة.", wordTitle: "اكتب الكلمة", watch: "شاهد كيف تُكتب الكلمة ثم اكتبها بنفسك.", replay: "إعادة", yourTurn: "دورك: اتبع النقاط بإصبعك.", pen: "قلم", eraser: "ممحاة", clear: "مسح الكل", check: "تحقق", nextBtn: "← التالي", draw: "ارسم الحرف أولًا بإصبعك.", more: "ما زال جزء من الحرف ناقصًا.", finished: "🎉 لقد كتبت كل حروف هذه الوحدة!", title: "الكتابة", pick: "اختر الحرف", forms: ["منفصل", "أول الكلمة", "وسط الكلمة", "آخر الكلمة"], how: "ارسم الحرف بإصبعك متبعًا الخط المنقّط والسهم. ابدأ من النقطة البرتقالية.", ok: "✓ أحسنت!", again: "من جديد", bad: "اقتربت: اتبع الخط المنقّط.", dot: "المس النقطة الآن.", next: "ارسم الخط التالي.", notebook: "خذ دفترك أو لوحتك وأعد الكتابة عدة مرات.", words: "كلمات للتمرين", close: "إغلاق", btn: "كتابة الحروف" }
      };
      var WT = isGerman ? WRITE_TXT.de : isArabic ? WRITE_TXT.ar : isRussian ? WRITE_TXT.ru : isEnglish ? WRITE_TXT.en : WRITE_TXT.fr;
      var WRITE_LETTER_FORM_TEXT = function (ch, form) {
        return form === "isolated" ? ch : form === "initial" ? ch + "ـ" : form === "medial" ? "ـ" + ch + "ـ" : "ـ" + ch;
      };
      var WRITE_BASE_CHAR = {
        alif: "أ", baa: "ب", taa: "ت", thaa: "ث", jim: "ج", haa: "ح", khaa: "خ", dal: "د", thal: "ذ", reh: "ر", zain: "ز",
        seen: "س", sheen: "ش", sad: "ص", dad: "ض", tah: "ط", zah: "ظ", ain: "ع", ghain: "غ", feh: "ف", qaf: "ق", kaf: "ك",
        lam: "ل", meem: "م", noon: "ن", heh: "ه", waw: "و", yeh: "ي"
      };
      // Mot d'exemple (avec voyelles) affiche sous les formes de chaque lettre
      var WRITE_WORD_EX = {
        "ب": "بَـاب",
        "ت": "تَـابَ",
        "ث": "ثَـبَـتَ",
        "ج": "جَـابَ",
        "ح": "حُـوب",
        "خ": "خَـبُـثَ",
        "د": "دَأَبَ",
        "ذ": "تَـذُوبُ",
        "ر": "رَجَـب",
        "ز": "أَزِيـدُ",
        "س": "تَـسُـودُ",
        "ش": "شَـرِبَ",
        "ص": "صَـبَـرَ",
        "ض": "ضَـرَبَ",
        "ط": "طَـبِـيـب",
        "ظ": "حَـظَـرَ",
        "ع": "عَـصَـرَ",
        "غ": "غَـطَـسَ",
        "ف": "فَـتَـحَ",
        "ق": "قِـيـلَ",
        "ك": "كَـتَـبَ",
        "ل": "لَـطَـخَ",
        "م": "تَـمُـوتُ",
        "ن": "نَـتَـجَ",
        "ه": "هُـرُوب",
        "و": "وَلَـدَ",
        "ي": "يَـلِـدُ"
      };
      var WRITE_NO_JOIN = { alif: true, dal: true, thal: true, reh: true, zain: true, waw: true };

      // Courbe de Catmull-Rom -> polyligne dense (les traits "sharp" restent droits).
      function writeDense(stroke) {
        var pts = stroke.pts, out = [];
        if (stroke.sharp) {
          for (var i = 0; i < pts.length - 1; i++) {
            var a = pts[i], b = pts[i + 1];
            var n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
            for (var k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
          }
          out.push(pts[pts.length - 1]);
          return out;
        }
        for (var j = 0; j < pts.length - 1; j++) {
          var p0 = pts[Math.max(0, j - 1)], p1 = pts[j], p2 = pts[j + 1], p3 = pts[Math.min(pts.length - 1, j + 2)];
          for (var t = 0; t < 10; t++) {
            var u = t / 10, u2 = u * u, u3 = u2 * u;
            out.push([
              0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
              0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)
            ]);
          }
        }
        out.push(pts[pts.length - 1]);
        return out;
      }
      function writeResample(pts, n) {
        var d = [0];
        for (var i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        var total = d[d.length - 1], out = [];
        if (!total) { for (var z = 0; z < n; z++) out.push(pts[0].slice()); return out; }
        var seg = 1;
        for (var k = 0; k < n; k++) {
          var target = total * k / (n - 1);
          while (seg < d.length - 1 && d[seg] < target) seg++;
          var span = d[seg] - d[seg - 1] || 1, f = (target - d[seg - 1]) / span;
          out.push([pts[seg - 1][0] + (pts[seg][0] - pts[seg - 1][0]) * f, pts[seg - 1][1] + (pts[seg][1] - pts[seg - 1][1]) * f]);
        }
        return out;
      }
      function writePathLen(pts) {
        var l = 0;
        for (var i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        return l;
      }
      // Le trace de l'eleve correspond-il au trait attendu ? (sens compris)
      function writeMatches(user, expected) {
        if (user.length < 3) return false;
        var lu = writePathLen(user), le = writePathLen(expected);
        if (lu < le * 0.55 || lu > le * 1.8) return false;
        var a = writeResample(user, 32), b = writeResample(expected, 32), sum = 0;
        for (var i = 0; i < 32; i++) sum += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]);
        var avg = sum / 32;
        var ds = Math.hypot(a[0][0] - b[0][0], a[0][1] - b[0][1]);
        var de = Math.hypot(a[31][0] - b[31][0], a[31][1] - b[31][1]);
        return avg <= 26 && ds <= 55 && de <= 55;
      }

      var writeLab = null;
      function writeEl(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
      }
      function svgEl(tag, attrs) {
        var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
      }

      function openWriteLab(moduleNumber) {
        var mod = MODULES.filter(function (m) { return String(m.number) === String(moduleNumber); })[0];
        if (!mod) return;
        var ids = mod.letterIds.filter(function (id) { return WRITE_DATA[id]; });
        if (!ids.length) return;
        var cumulative = [];
        MODULES.forEach(function (m) { if (m.number <= mod.number) cumulative = cumulative.concat(m.letterIds); });
        var state = { letter: ids[0], form: "isolated", drawing: null, done: false, tool: "pen", user: [], erasing: false };

        if (!writeLab) {
          writeLab = writeEl("div", "reader write-lab");
          writeLab.setAttribute("role", "dialog");
          writeLab.setAttribute("aria-modal", "true");
          document.body.appendChild(writeLab);
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && writeLab.classList.contains("is-open")) closeWriteLab();
          });
        }
        writeLab.textContent = "";
        var bar = writeEl("div", "reader-bar");
        bar.appendChild(writeEl("span", "reader-title", WT.title + " — " + (isArabic ? "الوحدة " : isRussian ? "Модуль " : isGerman ? "Modul " : "Module ") + mod.number));
        var x = writeEl("button", "reader-close", "×");
        x.type = "button";
        x.setAttribute("aria-label", WT.close);
        x.addEventListener("click", closeWriteLab);
        bar.appendChild(x);
        var body = writeEl("div", "reader-body");
        var panel = writeEl("div", "formlab-panel write-panel");
        var tabs = writeEl("div", "write-tabs");
        var formsRow = writeEl("div", "write-forms");
        var how = writeEl("p", "write-how", WT.how);
        var board = svgEl("svg", { viewBox: "40 8 285 200", class: "write-board", role: "img" });
        var status = writeEl("p", "write-status");
        status.setAttribute("aria-live", "polite");
        var WICON = {
          pen: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 0l0 0a2 2 0 0 1 0 3L8 19l-4 1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14.5 6.5l3 3" stroke="currentColor" stroke-width="1.8"/></svg>',
          eraser: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 20h11M5.5 14.5l8-8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 20H8l-2.5-2.5a2 2 0 0 1 0-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 10l5 5" stroke="currentColor" stroke-width="1.8"/></svg>'
        };
        var tools = writeEl("div", "write-tools");
        var penBtn = writeEl("button", "write-tool is-active");
        penBtn.type = "button";
        penBtn.innerHTML = WICON.pen + '<span>' + WT.pen + '</span>';
        penBtn.setAttribute("aria-label", WT.pen);
        var eraserBtn = writeEl("button", "write-tool");
        eraserBtn.type = "button";
        eraserBtn.innerHTML = WICON.eraser + '<span>' + WT.eraser + '</span>';
        eraserBtn.setAttribute("aria-label", WT.eraser);
        tools.appendChild(penBtn);
        tools.appendChild(eraserBtn);
        var actions = writeEl("div", "write-actions");
        var clearBtn = writeEl("button", "btn btn-outline btn-sm write-clear", WT.clear);
        clearBtn.type = "button";
        var checkBtn = writeEl("button", "btn btn-primary btn-sm write-check", WT.check);
        checkBtn.type = "button";
        var nextBtn = writeEl("button", "btn btn-primary btn-sm write-next", WT.nextBtn);
        nextBtn.type = "button";
        nextBtn.hidden = true;
        actions.appendChild(clearBtn);
        actions.appendChild(checkBtn);
        actions.appendChild(nextBtn);
        // ---- Le mot : on regarde comment il s'ecrit, puis on l'ecrit sur les pointillés ----
        var wordCard = writeEl("div", "write-wordcard");
        wordCard.appendChild(writeEl("p", "write-words-title", WT.wordTitle));
        wordCard.appendChild(writeEl("p", "write-ww-hint", WT.watch));
        var watch = writeEl("div", "write-wordwatch");
        var watchInner = writeEl("span", "write-ww-inner");
        var watchText = writeEl("span", "write-ww-text");
        watchText.lang = "ar";
        watchText.dir = "rtl";
        var watchPen = writeEl("span", "write-ww-pen");
        watchInner.appendChild(watchText);
        watchInner.appendChild(watchPen);
        watch.appendChild(watchInner);
        var replayBtn = writeEl("button", "btn btn-outline btn-sm write-ww-replay", "↻ " + WT.replay);
        replayBtn.type = "button";
        var pad = svgEl("svg", { viewBox: "0 0 300 130", class: "write-wordpad", role: "img" });
        var padLine = svgEl("line", { x1: 8, y1: 92, x2: 292, y2: 92, class: "write-line" });
        var padText = svgEl("text", { x: 150, y: 92, "text-anchor": "middle", class: "write-wp-text" });
        padText.setAttribute("direction", "rtl");
        var padInk = svgEl("g", {});
        pad.appendChild(padLine);
        pad.appendChild(padText);
        pad.appendChild(padInk);
        var padClear = writeEl("button", "btn btn-outline btn-sm write-wp-clear", WT.clear);
        padClear.type = "button";
        var notebook = writeEl("p", "write-notebook");
        notebook.appendChild(writeEl("span", "write-notebook-ico", "📒"));
        notebook.appendChild(document.createTextNode(" " + WT.notebook));
        wordCard.appendChild(watch);
        wordCard.appendChild(replayBtn);
        wordCard.appendChild(writeEl("p", "write-ww-hint", WT.yourTurn));
        wordCard.appendChild(pad);
        var padActions = writeEl("div", "write-actions");
        padActions.appendChild(padClear);
        wordCard.appendChild(padActions);
        wordCard.appendChild(notebook);
        var wordsBox = writeEl("div", "write-words");
        panel.appendChild(tabs);
        panel.appendChild(formsRow);
        panel.appendChild(how);
        panel.appendChild(board);
        panel.appendChild(tools);
        panel.appendChild(status);
        panel.appendChild(actions);
        panel.appendChild(wordCard);
        panel.appendChild(wordsBox);
        body.appendChild(panel);
        writeLab.appendChild(bar);
        writeLab.appendChild(body);
        writeLab.classList.add("is-open");
        document.body.style.overflow = "hidden";

        function current() { return WRITE_DATA[state.letter][state.form]; }

        // Centre l'encre reelle de la lettre dans sa case (les jambes descendantes ne la decalent plus)
        var inkCanvas = document.createElement("canvas").getContext("2d");
        function centerInk(el) {
          if (!el || !inkCanvas || !el.isConnected) return;
          var cs = window.getComputedStyle(el), size = parseFloat(cs.fontSize);
          if (!size) return;
          inkCanvas.font = cs.fontWeight + " " + size + "px " + cs.fontFamily;
          inkCanvas.textAlign = "center";
          inkCanvas.direction = "rtl";
          var m = inkCanvas.measureText(el.textContent);
          if (!m || m.actualBoundingBoxAscent === undefined) return;
          var boxH = el.clientHeight || size, lineH = size;
          var baseline = boxH / 2 - lineH / 2 + (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
          var inkCy = baseline - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
          var dy = boxH / 2 - inkCy, dx = -(m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
          el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
        }
        function centerAllInk() {
          Array.prototype.forEach.call(tabs.querySelectorAll(".write-tab-glyph"), centerInk);
          Array.prototype.forEach.call(formsRow.querySelectorAll(".write-form-glyph"), centerInk);
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { centerAllInk(); });
        function renderTabs() {
          tabs.textContent = "";
          ids.forEach(function (id) {
            var b = writeEl("button", "write-tab" + (id === state.letter ? " is-active" : ""));
            b.appendChild(writeEl("span", "write-tab-glyph", ALL_LETTERS_BY_ID[id] ? ALL_LETTERS_BY_ID[id].char : id));
            b.type = "button";
            b.lang = "ar";
            b.addEventListener("click", function () { state.letter = id; state.form = "isolated"; reset(); renderTabs(); renderForms(); renderWords(); });
            tabs.appendChild(b);
          });
          tabs.hidden = ids.length < 2;
          centerAllInk();
        }
        function renderForms() {
          formsRow.textContent = "";
          WRITE_FORMS.forEach(function (f, i) {
            if (WRITE_NO_JOIN[state.letter] && (f === "initial" || f === "medial")) return;
            var b = writeEl("button", "write-form" + (f === state.form ? " is-active" : ""));
            b.type = "button";
            var glyph = writeEl("span", "write-form-glyph", WRITE_LETTER_FORM_TEXT(WRITE_BASE_CHAR[state.letter] || "", f));
            glyph.lang = "ar";
            glyph.dir = "rtl";
            b.appendChild(glyph);
            b.appendChild(writeEl("span", "write-form-name", WT.forms[i]));
            b.addEventListener("click", function () { state.form = f; reset(); renderForms(); });
            formsRow.appendChild(b);
          });
          centerAllInk();
        }
        // Mot : animation d'ecriture (revele de droite a gauche, lettre travaillee en rouge)
        function setWord(word, baseChar) {
          watchText.textContent = word;
          var node = watchText.firstChild;
          if (window.CSS && CSS.highlights && typeof Highlight !== "undefined") {
            CSS.highlights.delete("wr-letter");
            var h = new Highlight();
            var targets = baseChar === "ا" ? ["ا", "أ", "إ", "آ"] : [baseChar];
            for (var i = 0; i < word.length; i++) {
              if (targets.indexOf(word.charAt(i)) !== -1) {
                var rg = document.createRange();
                rg.setStart(node, i);
                rg.setEnd(node, i + 1);
                h.add(rg);
              }
            }
            CSS.highlights.set("wr-letter", h);
          }
          padText.textContent = word;
          fitPad();
          playWatch(word);
        }
        function fitPad() {
          padText.style.fontSize = "74px";
          try {
            var w = padText.getBBox().width;
            if (w > 270) padText.style.fontSize = Math.floor(74 * 270 / w) + "px";
          } catch (e) { /* non affiche */ }
        }
        var watchTimer = null;
        function playWatch(word) {
          var w = word || watchText.textContent;
          var dur = Math.min(6, Math.max(2.4, w.replace(/[\u064B-\u0652\u0640 ]/g, "").length * 0.55));
          watchText.style.transition = "none";
          watchText.style.clipPath = "inset(0 0 0 100%)";
          watchPen.style.transition = "none";
          watchPen.style.left = "100%";
          watchPen.style.opacity = "1";
          void watchText.offsetWidth;
          if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            watchText.style.clipPath = "inset(0 0 0 0)";
            watchPen.style.opacity = "0";
            return;
          }
          watchText.style.transition = "clip-path " + dur + "s linear";
          watchText.style.clipPath = "inset(0 0 0 0)";
          watchPen.style.transition = "left " + dur + "s linear, opacity .3s ease " + dur + "s";
          watchPen.style.left = "0%";
          watchPen.style.opacity = "0";
        }
        replayBtn.addEventListener("click", function () { playWatch(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPad);
        // Tracé libre sur le mot en pointillés
        var padDrawing = null;
        function padPoint(e) {
          var pt = pad.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          var m = pad.getScreenCTM();
          var q = m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
          return [q.x, q.y];
        }
        pad.addEventListener("pointerdown", function (e) {
          e.preventDefault();
          try { pad.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          var p = padPoint(e);
          padDrawing = { pts: [p], el: svgEl("path", { class: "write-wp-ink", d: "M" + p[0].toFixed(1) + " " + p[1].toFixed(1) }) };
          padInk.appendChild(padDrawing.el);
        });
        pad.addEventListener("pointermove", function (e) {
          if (!padDrawing) return;
          e.preventDefault();
          padDrawing.pts.push(padPoint(e));
          padDrawing.el.setAttribute("d", "M" + padDrawing.pts.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L"));
        });
        function padEnd() { padDrawing = null; }
        pad.addEventListener("pointerup", padEnd);
        pad.addEventListener("pointercancel", padEnd);
        padClear.addEventListener("click", function () { padInk.textContent = ""; });

        function renderWords() {
          var ex = WRITE_WORD_EX[WRITE_BASE_CHAR[state.letter]];
          wordCard.hidden = !ex;
          if (ex) setWord(ex, WRITE_BASE_CHAR[state.letter]);
          wordsBox.textContent = "";
          var base = WRITE_BASE_CHAR[state.letter];
          var list = WORDS.filter(function (w) {
            if (!w.letters.every(function (l) { return cumulative.indexOf(l) !== -1; })) return false;
            var bare = w.arabic.replace(/[ً-ْٰ]/g, "");
            return state.letter === "alif" ? bare.indexOf("ا") !== -1 : w.letters.indexOf(state.letter) !== -1;
          }).slice(0, 4);
          if (!list.length) { wordsBox.hidden = true; return; }
          wordsBox.hidden = false;
          wordsBox.appendChild(writeEl("p", "write-words-title", WT.words));
          var row = writeEl("div", "write-words-row");
          list.forEach(function (w) {
            var s = writeEl("span", "write-word");
            s.lang = "ar";
            s.dir = "rtl";
            renderArabicText(s, stretchArabic(w.arabic));
            row.appendChild(s);
          });
          wordsBox.appendChild(row);
        }

        // ---- Planche de trace ----
        // Pas d'etapes : l'eleve trace comme il veut (continu ou non, dans l'ordre
        // et le sens qu'il veut), peut effacer avec la gomme, puis appuie sur
        // "Verifier". Si la lettre est bien faite, "Suivant" passe a la suite.
        var layers = {};
        function reset() {
          state.done = false; state.drawing = null; state.user = []; state.erasing = false;
          board.textContent = "";
          var form = current();
          layers.guide = svgEl("g", {});
          layers.ink = svgEl("g", {});
          board.appendChild(svgEl("line", { x1: 10, y1: WRITE_BASE + 10, x2: 310, y2: WRITE_BASE + 10, class: "write-line" }));
          form.strokes.forEach(function (st, i) {
            var dense = writeDense(st);
            st._dense = dense;
            var d = "M" + dense.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L");
            layers.guide.appendChild(svgEl("path", { d: d, class: "write-body", "data-i": i }));
            layers.guide.appendChild(svgEl("path", { d: d, class: "write-dotted", "data-i": i }));
            var len = writePathLen(dense), acc = 0, nextAt = 40;
            for (var k = 1; k < dense.length; k++) {
              acc += Math.hypot(dense[k][0] - dense[k - 1][0], dense[k][1] - dense[k - 1][1]);
              if (acc >= nextAt && acc < len - 18) {
                var ang = Math.atan2(dense[k][1] - dense[k - 1][1], dense[k][0] - dense[k - 1][0]) * 180 / Math.PI;
                layers.guide.appendChild(svgEl("path", { d: "M-6 -5 L6 0 L-6 5 Z", class: "write-arrow", transform: "translate(" + dense[k][0].toFixed(1) + " " + dense[k][1].toFixed(1) + ") rotate(" + ang.toFixed(1) + ")" }));
                nextAt += 55;
              }
            }
          });
          var p0 = form.strokes[0]._dense[0];
          var startG = svgEl("g", { class: "write-start is-active", transform: "translate(" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + ")" });
          startG.appendChild(svgEl("circle", { r: 9 }));
          layers.guide.appendChild(startG);
          form.dots.forEach(function (p, i) {
            layers.guide.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: 12, class: "write-dot is-active", "data-d": i }));
          });
          board.appendChild(layers.guide);
          board.appendChild(layers.ink);
          status.textContent = "";
          status.className = "write-status";
          nextBtn.hidden = true;
          checkBtn.hidden = false;
          setTool("pen");
        }
        function setTool(t) {
          state.tool = t;
          penBtn.classList.toggle("is-active", t === "pen");
          eraserBtn.classList.toggle("is-active", t === "eraser");
          board.classList.toggle("is-erasing", t === "eraser");
        }
        penBtn.addEventListener("click", function () { setTool("pen"); });
        eraserBtn.addEventListener("click", function () { setTool("eraser"); });
        function toBoard(e) {
          var pt = board.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          var q = pt.matrixTransform(board.getScreenCTM().inverse());
          return [q.x, q.y];
        }
        function spaced(pts, step) {
          var len = writePathLen(pts);
          if (!len) return [pts[0]];
          return writeResample(pts, Math.max(2, Math.round(len / step) + 1));
        }
        function nearAny(p, list, r) {
          for (var i = 0; i < list.length; i++) {
            if (Math.hypot(p[0] - list[i][0], p[1] - list[i][1]) <= r) return true;
          }
          return false;
        }
        function centroid(u) {
          var cx = 0, cy = 0;
          u.forEach(function (p) { cx += p[0]; cy += p[1]; });
          return [cx / u.length, cy / u.length];
        }
        function isTap(pts) { return writePathLen(pts) < 70; }
        function tapOnDot(u) {
          var c = centroid(u);
          return current().dots.some(function (d) { return Math.hypot(c[0] - d[0], c[1] - d[1]) < 32; });
        }
        // Chaque appui valide au plus un point (le plus proche encore libre) ;
        // un appui qui ne correspond a aucun point libre est un appui en trop.
        function matchTaps() {
          var dots = current().dots, hit = dots.map(function () { return false; }), strays = [];
          state.user.forEach(function (e) {
            if (!e.tap) return;
            var c = centroid(e.pts), best = -1, bd = 32, near = false;
            dots.forEach(function (d, k) {
              var dist = Math.hypot(c[0] - d[0], c[1] - d[1]);
              if (dist < 32) near = true;
              if (!hit[k] && dist < bd) { bd = dist; best = k; }
            });
            if (best >= 0) hit[best] = true; else strays.push({ entry: e, nearDot: near });
          });
          return { hit: hit, strays: strays };
        }
        function dotsHit() { return matchTaps().hit; }
        function refreshDots() {
          var hit = dotsHit();
          Array.prototype.forEach.call(board.querySelectorAll(".write-dot"), function (c) {
            c.classList.toggle("is-done", !!hit[Number(c.getAttribute("data-d"))]);
          });
          return hit;
        }
        // Evalue l'ensemble du trace : couverture du modele, precision, points,
        // et longueur totale (un double trait ou des traits en trop sont refuses).
        function smoothPts(pts) {
          return pts.map(function (q, i) {
            var a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
            return [(a[0] + q[0] + b[0]) / 3, (a[1] + q[1] + b[1]) / 3];
          });
        }
        function evaluate() {
          var f = current();
          var ref = [], refLen = 0;
          f.strokes.forEach(function (st) { ref = ref.concat(spaced(st._dense, 5)); refLen += writePathLen(st._dense); });
          var hit = dotsHit(), ink = [], inkLen = 0;
          state.user.forEach(function (e) {
            if (e.tap && tapOnDot(e.pts)) return;
            var sp = spaced(e.pts, 4);
            ink = ink.concat(sp);
            inkLen += writePathLen(smoothPts(sp));
          });
          // points en trop : appui loin de la lettre, ou appui supplementaire sur un point deja fait
          var extra = 0;
          matchTaps().strays.forEach(function (st) {
            if (st.nearDot || st.entry.pts.some(function (q) { return !nearAny(q, ref, 12); })) extra++;
          });
          var covered = 0, precise = 0;
          ref.forEach(function (r) { if (nearAny(r, ink, 14)) covered++; });
          ink.forEach(function (q) { if (nearAny(q, ref, 12)) precise++; });
          var onDot = f.dots.some(function (d) { return nearAny(d, ink, 11); });
          return {
            coverage: ref.length ? covered / ref.length : 0,
            precision: ink.length ? precise / ink.length : 1,
            ratio: refLen ? inkLen / refLen : 1, extra: extra,
            onDot: onDot, hasInk: ink.length > 0, dotsOk: hit.every(Boolean)
          };
        }
        function markDone() {
          state.done = true;
          Array.prototype.forEach.call(board.querySelectorAll(".write-body, .write-dotted"), function (el) { el.classList.add("is-done"); });
          status.textContent = WT.ok;
          status.className = "write-status is-ok";
          checkBtn.hidden = true;
          nextBtn.hidden = false;
        }
        checkBtn.addEventListener("click", function () {
          if (state.done) return;
          var ev = evaluate();
          try { board.setAttribute("data-eval", JSON.stringify(ev)); } catch (err) { /* ignore */ }
          var shapeOk = ev.hasInk && ev.coverage >= 0.85 && ev.precision >= 0.85 && ev.ratio <= 1.35 && !ev.onDot && !ev.extra;
          if (shapeOk && ev.dotsOk) { markDone(); return; }
          status.className = "write-status is-bad";
          if (!ev.hasInk && !state.user.length) { status.textContent = WT.draw; status.className = "write-status"; }
          else if (!ev.hasInk || ev.coverage < 0.85) status.textContent = WT.more;
          else if (ev.extra) status.textContent = WT.extra;
          else if (shapeOk) { status.textContent = WT.dot; status.className = "write-status"; }
          else status.textContent = WT.bad;
        });
        // Gomme : n'enleve que la partie touchee du trait (le reste est conserve)
        var ERASE_R = 9;
        function inkD(pts) {
          return "M" + pts.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L");
        }
        function eraseAt(p) {
          var removed = false, next = [];
          state.user.forEach(function (e) {
            if (e.tap) {
              var c = centroid(e.pts);
              if (Math.hypot(p[0] - c[0], p[1] - c[1]) <= ERASE_R + 6) {
                if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el);
                removed = true;
              } else next.push(e);
              return;
            }
            var dense = e.pts.length > 1 ? spaced(e.pts, 2) : e.pts;
            var touched = dense.some(function (q) { return Math.hypot(p[0] - q[0], p[1] - q[1]) <= ERASE_R; });
            if (!touched) { next.push(e); return; }
            removed = true;
            var pieces = [], cur = [];
            dense.forEach(function (q) {
              if (Math.hypot(p[0] - q[0], p[1] - q[1]) <= ERASE_R) {
                if (cur.length) pieces.push(cur);
                cur = [];
              } else cur.push(q);
            });
            if (cur.length) pieces.push(cur);
            var host = e.el && e.el.parentNode;
            if (host) host.removeChild(e.el);
            pieces.forEach(function (pc) {
              if (pc.length < 3) return;
              var el = svgEl("path", { class: "write-ink", d: inkD(pc) });
              if (host) host.appendChild(el);
              next.push({ pts: pc, tap: false, el: el });
            });
          });
          state.user = next;
          if (removed) { refreshDots(); status.textContent = ""; status.className = "write-status"; }
        }
        board.addEventListener("pointerdown", function (e) {
          if (state.done) return;
          e.preventDefault();
          try { board.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          var pt = toBoard(e);
          if (state.tool === "eraser") { state.erasing = true; state.lastErase = pt; eraseAt(pt); return; }
          state.drawing = [pt];
          state.ink = svgEl("path", { class: "write-ink", d: "" });
          layers.ink.appendChild(state.ink);
          var st0 = board.querySelector(".write-start");
          if (st0) st0.classList.add("is-hidden");
        });
        board.addEventListener("pointermove", function (e) {
          if (state.erasing) {
            e.preventDefault();
            var q = toBoard(e), a = state.lastErase || q, n = Math.max(1, Math.ceil(Math.hypot(q[0] - a[0], q[1] - a[1]) / 4));
            for (var i = 1; i <= n; i++) eraseAt([a[0] + (q[0] - a[0]) * i / n, a[1] + (q[1] - a[1]) * i / n]);
            state.lastErase = q;
            return;
          }
          if (!state.drawing) return;
          e.preventDefault();
          state.drawing.push(toBoard(e));
          state.ink.setAttribute("d", "M" + state.drawing.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L"));
        });
        function endDraw() {
          state.erasing = false;
          if (!state.drawing) return;
          var pts = state.drawing, path = state.ink;
          state.drawing = null;
          var tap = isTap(pts);
          var entry = { pts: pts, tap: tap, el: path };
          if (tap) {
            // un appui : une petite marque ronde (un point)
            path.parentNode && path.parentNode.removeChild(path);
            var c = centroid(pts);
            entry.el = svgEl("circle", { cx: c[0].toFixed(1), cy: c[1].toFixed(1), r: 6, class: "write-tapmark" });
            layers.ink.appendChild(entry.el);
          }
          state.user.push(entry);
          refreshDots();
          status.textContent = "";
          status.className = "write-status";
        }
        board.addEventListener("pointerup", endDraw);
        board.addEventListener("pointercancel", endDraw);
        clearBtn.addEventListener("click", reset);
        // Suivant : forme suivante, puis lettre suivante du module
        function sequence() {
          var out = [];
          ids.forEach(function (id) {
            WRITE_FORMS.forEach(function (f) {
              if (WRITE_NO_JOIN[id] && (f === "initial" || f === "medial")) return;
              out.push([id, f]);
            });
          });
          return out;
        }
        nextBtn.addEventListener("click", function () {
          var seq = sequence(), at = -1;
          seq.forEach(function (it, i) { if (it[0] === state.letter && it[1] === state.form) at = i; });
          if (at < 0 || at + 1 >= seq.length) {
            status.textContent = WT.finished;
            status.className = "write-status is-ok";
            nextBtn.hidden = true;
            return;
          }
          state.letter = seq[at + 1][0];
          state.form = seq[at + 1][1];
          reset(); renderTabs(); renderForms(); renderWords();
        });

        renderTabs();
        renderForms();
        renderWords();
        reset();
      }
      function closeWriteLab() {
        if (!writeLab) return;
        writeLab.classList.remove("is-open");
        document.body.style.overflow = "";
      }

      // Bouton "Ecrire les lettres" ajoute aux cartes de la page Modules ayant des modeles de trace.
      document.querySelectorAll(".module-card").forEach(function (card) {
        var num = card.querySelector(".module-number");
        var m = num && num.textContent.match(/\d+/);
        if (!m || !card.querySelector(".js-open-module")) return;
        var n = Number(m[0]);
        var mod = MODULES.filter(function (mm) { return mm.number === n; })[0];
        if (!mod || !mod.letterIds.some(function (id) { return WRITE_DATA[id]; })) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn btn-outline btn-sm module-write js-open-write";
        b.setAttribute("data-module", String(n));
        b.textContent = "✍️ " + WT.btn;
        b.addEventListener("click", function () { openWriteLab(n); });
        card.appendChild(b);
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

      // Mots reels ajoutes avec un enregistrement audio humain complet
      // (dossier "Mot reels", locuteur natif) - joue tel quel, jamais
      // assemble a partir des lettres. Contrairement a WORDS, ce ne sont
      // pas que des verbes : noms, adjectifs, particules... et le soukoun/
      // la chadda/le tanwin y sont autorises (voir HARAKAT_OPEN_FORMS et
      // UNIT_TEXT plus haut) puisque l'audio n'a plus besoin d'etre
      // isolable lettre par lettre.
      var WORDS_REAL = [
        { id: "iinsaanin", arabic: "إِنْسَانٍ", letters: ["alif", "noon", "seen"], audioId: "iinsaanin", units: ["alif-kasra", "noon-sukoon", "seen-madd-fatha", "noon-tanwin-kasra"] },
        { id: "fattaakin", arabic: "فَتَّاكٍ", letters: ["feh", "taa", "kaf"], audioId: "fattaakin", units: ["feh-fatha", "taa-madd-shadda-fatha", "kaf-tanwin-kasra"] },
        { id: "yawjala", arabic: "يَوْجَلَ", letters: ["yeh", "waw", "jim", "lam"], audioId: "yawjala", units: ["yeh-fatha", "waw-sukoon", "jim-fatha", "lam-fatha"] },
        { id: "nahbitu", arabic: "نَهْبِطُ", letters: ["noon", "heh", "baa", "tah"], audioId: "nahbitu", units: ["noon-fatha", "heh-sukoon", "baa-kasra", "tah-damma"] },
        { id: "ghuraabin", arabic: "غُرَابٍ", letters: ["ghain", "reh", "baa"], audioId: "ghuraabin", units: ["ghain-damma", "reh-madd-fatha", "baa-tanwin-kasra"] },
        { id: "aasiyraatin", arabic: "أَسِيرَاتٍ", letters: ["alif", "seen", "reh", "taa"], audioId: "aasiyraatin", units: ["alif-fatha", "seen-madd-kasra", "reh-madd-fatha", "taa-tanwin-kasra"] },
        { id: "tuthbitu", arabic: "تُثْبِتُ", letters: ["taa", "thaa", "baa"], audioId: "tuthbitu", units: ["taa-damma", "thaa-sukoon", "baa-kasra", "taa-damma"] },
        { id: "aalmuzu", arabic: "أَلْمُزُ", letters: ["alif", "lam", "meem", "zain"], audioId: "aalmuzu", units: ["alif-fatha", "lam-sukoon", "meem-damma", "zain-damma"] },
        { id: "sabarti", arabic: "صَبَرْتِ", letters: ["sad", "baa", "reh", "taa"], audioId: "sabarti", units: ["sad-fatha", "baa-fatha", "reh-sukoon", "taa-kasra"] },
        { id: "tatuwba", arabic: "تَتُوبَ", letters: ["taa", "baa"], audioId: "tatuwba", units: ["taa-fatha", "taa-madd-damma", "baa-fatha"] },
        { id: "raqiyqun", arabic: "رَقِيقٌ", letters: ["reh", "qaf"], audioId: "raqiyqun", units: ["reh-fatha", "qaf-madd-kasra", "qaf-tanwin-damma"] },
        { id: "tantuju", arabic: "تَنْتُجُ", letters: ["taa", "noon", "jim"], audioId: "tantuju", units: ["taa-fatha", "noon-sukoon", "taa-damma", "jim-damma"] },
        { id: "tuthaabu", arabic: "تُثَابُ", letters: ["taa", "thaa", "baa"], audioId: "tuthaabu", units: ["taa-damma", "thaa-madd-fatha", "baa-damma"] },
        { id: "dajiyjun", arabic: "ضَجِيجٌ", letters: ["dad", "jim"], audioId: "dajiyjun", units: ["dad-fatha", "jim-madd-kasra", "jim-tanwin-damma"] },
        { id: "aabiy", arabic: "أَبِي", letters: ["alif", "baa"], audioId: "aabiy", units: ["alif-fatha", "baa-madd-kasra"] },
        { id: "aaddaytu", arabic: "أَدَّيْتُ", letters: ["alif", "dal", "yeh", "taa"], audioId: "aaddaytu", units: ["alif-fatha", "dal-shadda-fatha", "yeh-sukoon", "taa-damma"] },
        { id: "aajjaja", arabic: "أَجَّجَ", letters: ["alif", "jim"], audioId: "aajjaja", units: ["alif-fatha", "jim-shadda-fatha", "jim-fatha"] },
        { id: "thaaabin", arabic: "ثَأَبٍ", letters: ["thaa", "alif", "baa"], audioId: "thaaabin", units: ["thaa-fatha", "alif-fatha", "baa-tanwin-kasra"] },
        { id: "shiriyrun", arabic: "شِرِّيرٌ", letters: ["sheen", "reh"], audioId: "shiriyrun", units: ["sheen-kasra", "reh-madd-shadda-kasra", "reh-tanwin-damma"] },
        { id: "huquwqin", arabic: "حُقُوقٍ", letters: ["haa", "qaf"], audioId: "huquwqin", units: ["haa-damma", "qaf-madd-damma", "qaf-tanwin-kasra"] },
        { id: "fiy", arabic: "فِي", letters: ["feh"], audioId: "fiy", units: ["feh-madd-kasra"] },
        { id: "kuttaabin", arabic: "كُتَّابٍ", letters: ["kaf", "taa", "baa"], audioId: "kuttaabin", units: ["kaf-damma", "taa-madd-shadda-fatha", "baa-tanwin-kasra"] },
        { id: "aadiybana", arabic: "أَدِيبًا", letters: ["alif", "dal", "baa"], audioId: "aadiybana", units: ["alif-fatha", "dal-madd-kasra", "baa-tanwin-fatha"] },
        { id: "labaza", arabic: "لَبَزَ", letters: ["lam", "baa", "zain"], audioId: "labaza", units: ["lam-fatha", "baa-fatha", "zain-fatha"] },
        { id: "aabitun", arabic: "آبِتٌ", letters: ["alif", "baa", "taa"], audioId: "aabitun", units: ["alif-madd-fatha", "baa-kasra", "taa-tanwin-damma"] },
        { id: "aatasa", arabic: "عَطَسَ", letters: ["ain", "tah", "seen"], audioId: "aatasa", units: ["ain-fatha", "tah-fatha", "seen-fatha"] },
        { id: "yahdiy", arabic: "يَهْدِي", letters: ["yeh", "heh", "dal"], audioId: "yahdiy", units: ["yeh-fatha", "heh-sukoon", "dal-madd-kasra"] },
        { id: "rukkaabin", arabic: "رُكَّابٍ", letters: ["reh", "kaf", "baa"], audioId: "rukkaabin", units: ["reh-damma", "kaf-madd-shadda-fatha", "baa-tanwin-kasra"] },
        { id: "aashjaarun", arabic: "أَشْجَارٌ", letters: ["alif", "sheen", "jim", "reh"], audioId: "aashjaarun", units: ["alif-fatha", "sheen-sukoon", "jim-madd-fatha", "reh-tanwin-damma"] },
        { id: "taajin", arabic: "تَاجٍ", letters: ["taa", "jim"], audioId: "taajin", units: ["taa-madd-fatha", "jim-tanwin-kasra"] },
        { id: "aaftakhiru", arabic: "أَفْتَخِرُ", letters: ["alif", "feh", "taa", "khaa", "reh"], audioId: "aaftakhiru", units: ["alif-fatha", "feh-sukoon", "taa-fatha", "khaa-kasra", "reh-damma"] },
        { id: "yastafiy", arabic: "يَصْطَفِي", letters: ["yeh", "sad", "tah", "feh"], audioId: "yastafiy", units: ["yeh-fatha", "sad-sukoon", "tah-fatha", "feh-madd-kasra"] },
        { id: "harajin", arabic: "حَرَجٍ", letters: ["haa", "reh", "jim"], audioId: "harajin", units: ["haa-fatha", "reh-fatha", "jim-tanwin-kasra"] },
        { id: "aakhraja", arabic: "أَخْرَجَ", letters: ["alif", "khaa", "reh", "jim"], audioId: "aakhraja", units: ["alif-fatha", "khaa-sukoon", "reh-fatha", "jim-fatha"] },
        { id: "wathaba", arabic: "وَثَبَ", letters: ["waw", "thaa", "baa"], audioId: "wathaba", units: ["waw-fatha", "thaa-fatha", "baa-fatha"] },
        { id: "khabutha", arabic: "خَبُثَ", letters: ["khaa", "baa", "thaa"], audioId: "khabutha", units: ["khaa-fatha", "baa-damma", "thaa-fatha"] },
        { id: "sabuwrun", arabic: "صَبُورٌ", letters: ["sad", "baa", "reh"], audioId: "sabuwrun", units: ["sad-fatha", "baa-madd-damma", "reh-tanwin-damma"] },
        { id: "fakka", arabic: "فَكَّ", letters: ["feh", "kaf"], audioId: "fakka", units: ["feh-fatha", "kaf-shadda-fatha"] },
        { id: "tabiaa", arabic: "طَبِعَ", letters: ["tah", "baa", "ain"], audioId: "tabiaa", units: ["tah-fatha", "baa-kasra", "ain-fatha"] },
        { id: "marahin", arabic: "مَرَحٍ", letters: ["meem", "reh", "haa"], audioId: "marahin", units: ["meem-fatha", "reh-fatha", "haa-tanwin-kasra"] },
        { id: "faqrana", arabic: "فَقْرًا", letters: ["feh", "qaf", "reh"], audioId: "faqrana", units: ["feh-fatha", "qaf-sukoon", "reh-tanwin-fatha"] },
        { id: "zabiybana", arabic: "زَبِيبًا", letters: ["zain", "baa"], audioId: "zabiybana", units: ["zain-fatha", "baa-madd-kasra", "baa-tanwin-fatha"] },
        { id: "dabita", arabic: "ضَبِطَ", letters: ["dad", "baa", "tah"], audioId: "dabita", units: ["dad-fatha", "baa-kasra", "tah-fatha"] },
        { id: "aaqauda", arabic: "أَقْعُدَ", letters: ["alif", "qaf", "ain", "dal"], audioId: "aaqauda", units: ["alif-fatha", "qaf-sukoon", "ain-damma", "dal-fatha"] },
        { id: "dajaajin", arabic: "دَجَاجٍ", letters: ["dal", "jim"], audioId: "dajaajin", units: ["dal-fatha", "jim-madd-fatha", "jim-tanwin-kasra"] },
        { id: "aathaathin", arabic: "أَثَاثٍ", letters: ["alif", "thaa"], audioId: "aathaathin", units: ["alif-fatha", "thaa-madd-fatha", "thaa-tanwin-kasra"] },
        { id: "aabati", arabic: "أَبَتِ", letters: ["alif", "baa", "taa"], audioId: "aabati", units: ["alif-fatha", "baa-fatha", "taa-kasra"] },
        { id: "aanwiy", arabic: "أَنْوِي", letters: ["alif", "noon", "waw"], audioId: "aanwiy", units: ["alif-fatha", "noon-sukoon", "waw-madd-kasra"] },
        { id: "zid", arabic: "زِدْ", letters: ["zain", "dal"], audioId: "zid", units: ["zain-kasra", "dal-sukoon"] },
        { id: "aafkaarun", arabic: "أَفْكَارٌ", letters: ["alif", "feh", "kaf", "reh"], audioId: "aafkaarun", units: ["alif-fatha", "feh-sukoon", "kaf-madd-fatha", "reh-tanwin-damma"] },
        { id: "aasraarana", arabic: "أَسْرَارًا", letters: ["alif", "seen", "reh"], audioId: "aasraarana", units: ["alif-fatha", "seen-sukoon", "reh-madd-fatha", "reh-tanwin-fatha"] },
        { id: "aurattibu", arabic: "أُرَتِّبُ", letters: ["alif", "reh", "taa", "baa"], audioId: "aurattibu", units: ["alif-damma", "reh-fatha", "taa-shadda-kasra", "baa-damma"] },
        { id: "faqiyrun", arabic: "فَقِيرٌ", letters: ["feh", "qaf", "reh"], audioId: "faqiyrun", units: ["feh-fatha", "qaf-madd-kasra", "reh-tanwin-damma"] },
        { id: "tarhamu", arabic: "تَرْحَمُ", letters: ["taa", "reh", "haa", "meem"], audioId: "tarhamu", units: ["taa-fatha", "reh-sukoon", "haa-fatha", "meem-damma"] },
        { id: "aaarib", arabic: "أَعْرِبْ", letters: ["alif", "ain", "reh", "baa"], audioId: "aaarib", units: ["alif-fatha", "ain-sukoon", "reh-kasra", "baa-sukoon"] },
        { id: "man", arabic: "مَنْ", letters: ["meem", "noon"], audioId: "man", units: ["meem-fatha", "noon-sukoon"] },
        { id: "hathiythana", arabic: "حَثِيثًا", letters: ["haa", "thaa"], audioId: "hathiythana", units: ["haa-fatha", "thaa-madd-kasra", "thaa-tanwin-fatha"] },
        { id: "taaabbata", arabic: "تَأَبَّطَ", letters: ["taa", "alif", "baa", "tah"], audioId: "taaabbata", units: ["taa-fatha", "alif-fatha", "baa-shadda-fatha", "tah-fatha"] },
        { id: "aabhathu", arabic: "أَبْحَثُ", letters: ["alif", "baa", "haa", "thaa"], audioId: "aabhathu", units: ["alif-fatha", "baa-sukoon", "haa-fatha", "thaa-damma"] },
        { id: "aadribu", arabic: "أَضْرِبُ", letters: ["alif", "dad", "reh", "baa"], audioId: "aadribu", units: ["alif-fatha", "dad-sukoon", "reh-kasra", "baa-damma"] },
        { id: "aaba", arabic: "آبَ", letters: ["alif", "baa"], audioId: "aaba", units: ["alif-madd-fatha", "baa-fatha"] },
        { id: "wahhaabin", arabic: "وَهَّابٍ", letters: ["waw", "heh", "baa"], audioId: "wahhaabin", units: ["waw-fatha", "heh-madd-shadda-fatha", "baa-tanwin-kasra"] },
        { id: "hazzana", arabic: "حَظًّا", letters: ["haa", "zah"], audioId: "hazzana", units: ["haa-fatha", "zah-shadda-tanwin-fatha"] },
        { id: "tadhuwbu", arabic: "تَذُوبُ", letters: ["taa", "thal", "baa"], audioId: "tadhuwbu", units: ["taa-fatha", "thal-madd-damma", "baa-damma"] },
        { id: "aashirun", arabic: "أَشِرٌ", letters: ["alif", "sheen", "reh"], audioId: "aashirun", units: ["alif-fatha", "sheen-kasra", "reh-tanwin-damma"] },
        { id: "darbana", arabic: "ضَرْبًا", letters: ["dad", "reh", "baa"], audioId: "darbana", units: ["dad-fatha", "reh-sukoon", "baa-tanwin-fatha"] },
        { id: "ghattaasana", arabic: "غَطَّاسًا", letters: ["ghain", "tah", "seen"], audioId: "ghattaasana", units: ["ghain-fatha", "tah-madd-shadda-fatha", "seen-tanwin-fatha"] },
        { id: "yatiymun", arabic: "يَتِيمٌ", letters: ["yeh", "taa", "meem"], audioId: "yatiymun", units: ["yeh-fatha", "taa-madd-kasra", "meem-tanwin-damma"] },
        { id: "taaba", arabic: "تَابَ", letters: ["taa", "baa"], audioId: "taaba", units: ["taa-madd-fatha", "baa-fatha"] },
        { id: "kadhdhaabun", arabic: "كَذَّابٌ", letters: ["kaf", "thal", "baa"], audioId: "kadhdhaabun", units: ["kaf-fatha", "thal-madd-shadda-fatha", "baa-tanwin-damma"] },
        { id: "ghariybana", arabic: "غَرِيبًا", letters: ["ghain", "reh", "baa"], audioId: "ghariybana", units: ["ghain-fatha", "reh-madd-kasra", "baa-tanwin-fatha"] },
        { id: "aaddakhiru", arabic: "أَدَّخِرُ", letters: ["alif", "dal", "khaa", "reh"], audioId: "aaddakhiru", units: ["alif-fatha", "dal-shadda-fatha", "khaa-kasra", "reh-damma"] },
        { id: "aabatta", arabic: "أَبَتَّ", letters: ["alif", "baa", "taa"], audioId: "aabatta", units: ["alif-fatha", "baa-fatha", "taa-shadda-fatha"] },
        { id: "tafkiyrana", arabic: "تَفْكِيرًا", letters: ["taa", "feh", "kaf", "reh"], audioId: "tafkiyrana", units: ["taa-fatha", "feh-sukoon", "kaf-madd-kasra", "reh-tanwin-fatha"] },
        { id: "nutqun", arabic: "نُطْقٌ", letters: ["noon", "tah", "qaf"], audioId: "nutqun", units: ["noon-damma", "tah-sukoon", "qaf-tanwin-damma"] },
        { id: "ardin", arabic: "أَرْضٍ", letters: ["reh", "dad"], audioId: "ardin", units: ["reh-sukoon", "dad-tanwin-kasra"] },
        { id: "tathbutu", arabic: "تَثْبُتُ", letters: ["taa", "thaa", "baa"], audioId: "tathbutu", units: ["taa-fatha", "thaa-sukoon", "baa-damma", "taa-damma"] }
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
        return eligible(WORDS, "words").concat(eligible(PSEUDO_WORDS, "pseudowords"), eligible(WORDS_REAL, "mots-reels"));
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

      // Formes soukoun/chadda/tanwin (et leurs combinaisons avec chadda ou
      // une prolongation) : ajoutees automatiquement pour les 28 lettres
      // (jamais saisies a la main, pour eviter les fautes de frappe).
      // Necessaire des que des mots reels a soukoun/chadda/tanwin entrent
      // dans WORDS, pour que unitsToArabic() (distracteurs, jeu Harakat)
      // sache les afficher. Le alif de soutien du tanwin fatha (ex. "بًا")
      // est inclus, comme en vraie orthographe - jamais pour tanwin
      // damma/kasra, qui n'en prennent pas.
      Object.keys(ALL_LETTERS_BY_ID).forEach(function (id) {
        var ch = ALL_LETTERS_BY_ID[id].char;
        UNIT_TEXT[id + "-sukoon"] = ch + "ْ";
        UNIT_TEXT[id + "-shadda-fatha"] = ch + "َّ";
        UNIT_TEXT[id + "-shadda-damma"] = ch + "ُّ";
        UNIT_TEXT[id + "-shadda-kasra"] = ch + "ِّ";
        UNIT_TEXT[id + "-tanwin-fatha"] = ch + "ًا";
        UNIT_TEXT[id + "-tanwin-damma"] = ch + "ٌ";
        UNIT_TEXT[id + "-tanwin-kasra"] = ch + "ٍ";
        UNIT_TEXT[id + "-shadda-tanwin-fatha"] = ch + "ًّا";
        UNIT_TEXT[id + "-shadda-tanwin-damma"] = ch + "ٌّ";
        UNIT_TEXT[id + "-shadda-tanwin-kasra"] = ch + "ٍّ";
        UNIT_TEXT[id + "-madd-shadda-fatha"] = ch + "َّا";
        UNIT_TEXT[id + "-madd-shadda-damma"] = ch + "ُّو";
        UNIT_TEXT[id + "-madd-shadda-kasra"] = ch + "ِّي";
      });

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
      // Formes admises dans le jeu "Placer les harakat" (buildHarakatPool) :
      // les 3 voyelles simples, plus soukoun et chadda+voyelle - possible
      // maintenant que l'audio de mots reels est joue en un seul fichier
      // (pas d'assemblage lettre par lettre a isoler). generateCloseVariants
      // ne modifie jamais ces formes (voir ses etapes 1/2), elles restent
      // donc telles quelles dans les variantes - d'ou l'ajout des entrees
      // UNIT_TEXT correspondantes ci-dessus.
      var HARAKAT_OPEN_FORMS = OPEN_FORMS.concat(["sukoon", "shadda-fatha", "shadda-damma", "shadda-kasra"]);

      function unitsToArabic(units) {
        return units.map(function (u) { return UNIT_TEXT[u]; }).join("");
      }

      // Jeu "Place les harakat" : uniquement les mots dont TOUTES les
      // unites sont en voyelle simple, soukoun ou chadda+voyelle (voir
      // HARAKAT_OPEN_FORMS) - jamais de prolongation ni de tanwin, car le
      // squelette de lettres affiche n'a pas de case pour ces formes-la.
      // L'enfant retrouve la bonne voyelle/soukoun/chadda par l'oreille, en
      // ecoutant l'audio complet du mot (jamais assemble lettre par lettre).
      function buildHarakatPool(moduleNumber) {
        return buildWordPool(moduleNumber).filter(function (w) {
          return w.units.every(function (u) { return HARAKAT_OPEN_FORMS.indexOf(unitForm(u)) !== -1; });
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
      var gameEndBadge = document.getElementById("gameEndBadge");
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
      var gameOrderPanel = document.getElementById("gameOrderPanel");
      var orderGrid = document.getElementById("orderGrid");
      var orderPool = document.getElementById("orderPool");
      var orderFeedback = document.getElementById("orderFeedback");
      var orderCheckBtn = document.getElementById("orderCheckBtn");
      var orderResetBtn = document.getElementById("orderResetBtn");
      var orderRevealBtn = document.getElementById("orderRevealBtn");
      var gameOrder5Panel = document.getElementById("gameOrder5Panel");
      var order5Round = document.getElementById("order5Round");
      var order5Grid = document.getElementById("order5Grid");
      var order5Pool = document.getElementById("order5Pool");
      var order5Feedback = document.getElementById("order5Feedback");
      var order5CheckBtn = document.getElementById("order5CheckBtn");
      var order5NextBtn = document.getElementById("order5NextBtn");
      var order5RevealBtn = document.getElementById("order5RevealBtn");
      var gamePuzzlePanel = document.getElementById("gamePuzzlePanel");
      var puzzleOpts = document.getElementById("puzzleOpts");
      var puzzleListenBtn = document.getElementById("puzzleListenBtn");
      var puzzleFeedback = document.getElementById("puzzleFeedback");
      var puzzleLegend = document.getElementById("puzzleLegend");
      var puzzleNextBtn = document.getElementById("puzzleNextBtn");
      var gameSoundPanel = document.getElementById("gameSoundPanel");
      var soundSetup = document.getElementById("soundSetup");
      var soundPlay = document.getElementById("soundPlay");
      var soundEnd = document.getElementById("soundEnd");
      var soundStartBtn = document.getElementById("soundStartBtn");
      var soundProgress = document.getElementById("soundProgress");
      var soundScore = document.getElementById("soundScore");
      var soundTimerNum = document.getElementById("soundTimerNum");
      var soundTimerBar = document.getElementById("soundTimerBar");
      var soundListenBtn = document.getElementById("soundListenBtn");
      var soundQuitBtn = document.getElementById("soundQuitBtn");
      var soundFeedback = document.getElementById("soundFeedback");
      var soundNextBtn = document.getElementById("soundNextBtn");
      var soundTable = document.getElementById("soundTable");
      var soundEndScore = document.getElementById("soundEndScore");
      var soundEndMessage = document.getElementById("soundEndMessage");
      var soundAgainBtn = document.getElementById("soundAgainBtn");
      var gameDictee1Panel = document.getElementById("gameDictee1Panel");
      var gameDictee1Words = document.getElementById("gameDictee1Words");
      var gameDictee1ListenBtn = document.getElementById("gameDictee1ListenBtn");
      var gameDictee1RevealBtn = document.getElementById("gameDictee1RevealBtn");
      var gameDictee1PrevBtn = document.getElementById("gameDictee1PrevBtn");
      var gameDictee1NextBtn = document.getElementById("gameDictee1NextBtn");

      var INSTRUCTION_TEXT = isGerman ? {
        sound: "Höre zu und wähle dann den Laut, den du gehört hast.",
        word: "Höre zu und wähle dann das Wort, das du gehört hast.",
        script: "Welche Schreibweise ist richtig?"
      } : isArabic ? {
        sound: "استمع ثم اختر الصوت الذي سمعته.",
        word: "استمع ثم اختر الكلمة التي سمعتها.",
        script: "ما الكتابة الصحيحة؟"
      } : isRussian ? {
        sound: "Послушай, затем выбери услышанный звук.",
        word: "Послушай, затем выбери услышанное слово.",
        script: "Какое написание правильное?"
      } : {
        sound: isEnglish ? "Listen, then choose the sound you heard." : "Écoute puis choisis le son que tu as entendu.",
        word: isEnglish ? "Listen, then choose the word you heard." : "Écoute puis choisis le mot que tu as entendu.",
        script: isEnglish ? "Which spelling is correct?" : "Quelle est la bonne écriture ?"
      };

      // Menu des jeux (nouvel ecran intermediaire entre la grille des
      // modules et l'interface complete d'un jeu) : une grande carte par
      // categorie, icone + titre uniquement (voir renderGameMenu).
      var GAME_MENU_ITEMS = isGerman ? {
        sound: { icon: "🎧", title: "Laut erkennen" },
        word: { icon: "📖", title: "Wort erkennen" },
        read: { icon: "🗣️", title: "Ein Wort lesen" },
        dictee: { icon: "✍️", title: "Reines Diktat" },
        harakat: { icon: "🖍️", title: "Setze die Vokalzeichen" },
        script: { icon: "✍️", title: "Die richtige Schreibweise" },
        sort: { icon: "☀️🌙", title: "Sonne oder Mond?" },
        sortall: { icon: "🗂️", title: "Sortiere alle Buchstaben" },
        orderall: { icon: "🔠", title: "Alle 28 Buchstaben" },
        order5: { icon: "🔢", title: "5 Buchstaben ordnen" }
      } : isArabic ? {
        sound: { icon: "🎧", title: "التعرّف على الصوت" },
        word: { icon: "📖", title: "التعرّف على الكلمة" },
        read: { icon: "🗣️", title: "قراءة كلمة" },
        dictee: { icon: "✍️", title: "إملاء خالص" },
        harakat: { icon: "🖍️", title: "ضع الحركات" },
        script: { icon: "✍️", title: "الكتابة الصحيحة" },
        sort: { icon: "☀️🌙", title: "شمسي أم قمري؟" },
        sortall: { icon: "🗂️", title: "رتّب كل الحروف" },
        orderall: { icon: "🔠", title: "الحروف الثمانية والعشرون" },
        order5: { icon: "🔢", title: "رتّب ٥ حروف" }
      } : isRussian ? {
        sound: { icon: "🎧", title: "Узнать звук" },
        word: { icon: "📖", title: "Узнать слово" },
        read: { icon: "🗣️", title: "Прочитать слово" },
        dictee: { icon: "✍️", title: "Диктант" },
        harakat: { icon: "🖍️", title: "Расставь огласовки" },
        script: { icon: "✍️", title: "Правильное написание" },
        sort: { icon: "☀️🌙", title: "Солнечная или лунная?" },
        sortall: { icon: "🗂️", title: "Рассортируй все буквы" },
        orderall: { icon: "🔠", title: "Все 28 букв" },
        order5: { icon: "🔢", title: "5 букв по порядку" }
      } : {
        sound: { icon: "🎧", title: isEnglish ? "Recognize the sound" : "Reconnaître le son" },
        word: { icon: "📖", title: isEnglish ? "Recognize the word" : "Reconnaître le mot" },
        read: { icon: "🗣️", title: isEnglish ? "Read a word" : "Lire un mot" },
        dictee: { icon: "✍️", title: isEnglish ? "Pure dictation" : "Dictée pure" },
        harakat: { icon: "🖍️", title: isEnglish ? "Place the harakāt" : "Place les harakāt" },
        script: { icon: "✍️", title: isEnglish ? "The correct spelling" : "La bonne écriture" },
        sort: { icon: "☀️🌙", title: isEnglish ? "Sun or moon?" : "Solaire ou lunaire ?" },
        sortall: { icon: "🗂️", title: isEnglish ? "Sort all the letters" : "Trie toutes les lettres" },
        orderall: { icon: "🔠", title: isEnglish ? "All 28 letters" : "Les 28 lettres" },
        order5: { icon: "🔢", title: isEnglish ? "5 letters in order" : "5 lettres dans l’ordre" }
      };
      var ORDER_MENU_ITEMS = [
        { category: "orderall", disabled: false },
        { category: "order5", disabled: false }
      ];
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
        { id: "tamr", correct: "التَّمْرُ", incorrect: "التَمْرُ", type: "sun", letter: "ت", minModule: 2 },
        { id: "thaalab", correct: "الثَّعْلَبُ", incorrect: "الثَعْلَبُ", type: "sun", letter: "ث", minModule: 3 },
        { id: "dars", correct: "الدَّرْسُ", incorrect: "الدَرْسُ", type: "sun", letter: "د", minModule: 4 },
        { id: "dhura", correct: "الذُّرَةُ", incorrect: "الذُرَةُ", type: "sun", letter: "ذ", minModule: 4 },
        { id: "rajul", correct: "الرَّجُلُ", incorrect: "الرَجُلُ", type: "sun", letter: "ر", minModule: 5 },
        { id: "zujaj", correct: "الزُّجَاجُ", incorrect: "الزُجَاجُ", type: "sun", letter: "ز", minModule: 5 },
        { id: "samak", correct: "السَّمَكُ", incorrect: "السَمَكُ", type: "sun", letter: "س", minModule: 6 },
        { id: "shams", correct: "الشَّمْسُ", incorrect: "الشَمْسُ", type: "sun", letter: "ش", minModule: 6 },
        { id: "saqr", correct: "الصَّقْرُ", incorrect: "الصَقْرُ", type: "sun", letter: "ص", minModule: 7 },
        { id: "difda", correct: "الضَّفْدَعُ", incorrect: "الضَفْدَعُ", type: "sun", letter: "ض", minModule: 7 },
        { id: "tifl", correct: "الطِّفْلُ", incorrect: "الطِفْلُ", type: "sun", letter: "ط", minModule: 8 },
        { id: "zalam", correct: "الظَّلَامُ", incorrect: "الظَلَامُ", type: "sun", letter: "ظ", minModule: 8 },
        { id: "lugha", correct: "اللُّغَةُ", incorrect: "اللُغَةُ", type: "sun", letter: "ل", minModule: 11 },
        { id: "najm", correct: "النَّجْمُ", incorrect: "النَجْمُ", type: "sun", letter: "ن", minModule: 11 },
        { id: "tajir", correct: "التَّاجِرُ", incorrect: "التَاجِرُ", type: "sun", letter: "ت", minModule: 5 },
        { id: "nazar", correct: "النَّظَرُ", incorrect: "النَظَرُ", type: "sun", letter: "ن", minModule: 11 },
        { id: "bab", correct: "الْبَابُ", incorrect: "الْبَّابُ", type: "moon", letter: "ب", minModule: 2 },
        { id: "jamal", correct: "الْجَمَلُ", incorrect: "الْجَّمَلُ", type: "moon", letter: "ج", minModule: 3 },
        { id: "hisan", correct: "الْحِصَانُ", incorrect: "الْحِّصَانُ", type: "moon", letter: "ح", minModule: 3 },
        { id: "khubz", correct: "الْخُبْزُ", incorrect: "الْخُّبْزُ", type: "moon", letter: "خ", minModule: 3 },
        { id: "asal", correct: "الْعَسَلُ", incorrect: "الْعَّسَلُ", type: "moon", letter: "ع", minModule: 9 },
        { id: "ghurab", correct: "الْغُرَابُ", incorrect: "الْغُّرَابُ", type: "moon", letter: "غ", minModule: 9 },
        { id: "faras", correct: "الْفَرَسُ", incorrect: "الْفَّرَسُ", type: "moon", letter: "ف", minModule: 10 },
        { id: "qamar", correct: "الْقَمَرُ", incorrect: "الْقَّمَرُ", type: "moon", letter: "ق", minModule: 10 },
        { id: "kalb", correct: "الْكَلْبُ", incorrect: "الْكَّلْبُ", type: "moon", letter: "ك", minModule: 10 },
        { id: "matar", correct: "الْمَطَرُ", incorrect: "الْمَّطَرُ", type: "moon", letter: "م", minModule: 11 },
        { id: "hilal", correct: "الْهِلَالُ", incorrect: "الْهِّلَالُ", type: "moon", letter: "ه", minModule: 12 },
        { id: "warda", correct: "الْوَرْدَةُ", incorrect: "الْوَّرْدَةُ", type: "moon", letter: "و", minModule: 12 },
        { id: "yad", correct: "الْيَدُ", incorrect: "الْيَّدُ", type: "moon", letter: "ي", minModule: 12 },
        { id: "bahr", correct: "الْبَحْرُ", incorrect: "الْبَّحْرُ", type: "moon", letter: "ب", minModule: 5 },
        { id: "kitab", correct: "الْكِتَابُ", incorrect: "الْكِّتَابُ", type: "moon", letter: "ك", minModule: 10 },
        { id: "farah", correct: "الْفَرْحُ", incorrect: "الْفَّرْحُ", type: "moon", letter: "ف", minModule: 10 }
      ];

      var HARAKAT_MARK = {
        fatha: "َ", damma: "ُ", kasra: "ِ", sukoon: "ْ",
        "shadda-fatha": "َّ", "shadda-damma": "ُّ", "shadda-kasra": "ِّ"
      };
      var HARAKAT_ORDER = ["fatha", "damma", "kasra", "sukoon", "shadda-fatha", "shadda-damma", "shadda-kasra"];
      var HARAKAT_LABEL = {};
      HARAKAT_ORDER.forEach(function (form) { HARAKAT_LABEL[form] = "ـ" + HARAKAT_MARK[form]; });
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
            badge.textContent = isGerman ? "🟢 Verfügbar" : isArabic ? "🟢 متاح" : isRussian ? "🟢 Доступно" : isEnglish ? "🟢 Available" : "🟢 Disponible";
          } else if (state === "unlocked") {
            badge.textContent = isGerman ? "🟢 Freigeschaltet" : isArabic ? "🟢 مفتوح" : isRussian ? "🟢 Открыто" : isEnglish ? "🟢 Unlocked" : "🟢 Débloqué";
          } else if (state === "override") {
            badge.textContent = isGerman ? "🟡 Zugriff erlaubt" : isArabic ? "🟡 الدخول مسموح" : isRussian ? "🟡 Доступ разрешён" : isEnglish ? "🟡 Access granted" : "🟡 Accès autorisé";
          } else {
            badge.textContent = isGerman ? "🔒 80 % empfohlen" : isArabic ? "🔒 يُنصح بنسبة 80%" : isRussian ? "🔒 Рекомендуется 80%" : isEnglish ? "🔒 80% recommended" : "🔒 80% recommandé";
          }
        });
      }

      // Sons ludiques synthetises par Web Audio (aucun fichier audio a
      // ajouter) : bonne / mauvaise reponse et signaux du compte a rebours.
      // Le contexte audio est cree/reveille au premier clic du joueur
      // (exigence de Safari/iOS), puis reutilise par les minuteries.
      var fxCtx = null;
      function fxContext() {
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          if (!fxCtx) { fxCtx = new AC(); }
          if (fxCtx.state === "suspended" && fxCtx.resume) { fxCtx.resume(); }
          return fxCtx;
        } catch (e) { return null; }
      }
      function fxTone(freq, delay, dur, type, vol, slideTo) {
        var ctx = fxContext();
        if (!ctx) return;
        try {
          var t0 = ctx.currentTime + delay;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = type || "sine";
          osc.frequency.setValueAtTime(freq, t0);
          if (slideTo) { osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur); }
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + dur + 0.03);
        } catch (e) { /* pas de son : le jeu continue */ }
      }
      // Sonnerie d'ecole (cloche electrique) : trois partiels metalliques
      // non harmoniques dont le volume est "frappe" ~18 fois par seconde
      // par le marteau, puis qui s'eteint (dring-dring-dring...).
      function fxSchoolBell() {
        var ctx = fxContext();
        if (!ctx) return;
        try {
          var t0 = ctx.currentTime;
          var dur = 1.5;
          var step = 0.055;
          var out = ctx.createGain();
          out.gain.setValueAtTime(0.0001, t0);
          for (var t = 0; t < dur; t += step) {
            var fade = t > dur - 0.35 ? (dur - t) / 0.35 : 1;
            out.gain.setValueAtTime(0.0001, t0 + t);
            out.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.2 * fade), t0 + t + 0.004);
            out.gain.exponentialRampToValueAtTime(0.03 * fade + 0.0001, t0 + t + step - 0.004);
          }
          out.gain.setValueAtTime(0.0001, t0 + dur);
          out.connect(ctx.destination);
          [[1760, 1], [2637, 0.7], [3520, 0.4]].forEach(function (partial) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(partial[0], t0);
            g.gain.setValueAtTime(partial[1], t0);
            osc.connect(g);
            g.connect(out);
            osc.start(t0);
            osc.stop(t0 + dur + 0.05);
          });
        } catch (e) { /* pas de son : le jeu continue */ }
      }
      var gameFx = {
        // petite fanfare montante (do-mi-sol-do) + note finale
        correct: function () {
          [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { fxTone(f, i * 0.085, 0.16, "triangle", 0.22); });
          fxTone(1318.5, 0.34, 0.32, "sine", 0.13);
        },
        // "womp womp" descendant, rigolo plutot que punitif
        wrong: function () {
          fxTone(330, 0, 0.2, "triangle", 0.26, 277);
          fxTone(277, 0.21, 0.4, "triangle", 0.26, 185);
        },
        // top depart du compte a rebours
        start: function () {
          fxTone(660, 0, 0.09, "sine", 0.16);
          fxTone(990, 0.1, 0.12, "sine", 0.16);
        },
        // bip des 3, 2, 1 dernieres secondes
        tick: function () { fxTone(880, 0, 0.1, "square", 0.08); },
        // fin du temps : sonnerie d'ecole
        timeUp: function () { fxSchoolBell(); }
      };
      function playResultFx(ok) { if (ok) { gameFx.correct(); } else { gameFx.wrong(); } }

      function playSound(item) {
        if (gameAudio) { gameAudio.pause(); }
        gameAudio = new Audio(item.audioBase + item.audioId + ".m4a?v=" + AUDIO_VERSION);
        ["play", "pause", "ended", "timeupdate", "loadedmetadata", "durationchange"].forEach(function (ev) {
          gameAudio.addEventListener(ev, dictee1SyncControls);
        });
        gameAudio.play().catch(function () {});
        dictee1SyncControls();
      }

      // Compteur de serie intuitif : "Question 3 / 10" + une rangee de 10
      // pastilles (vertes = juste, rouges = fausse, bleue = en cours) + le
      // score. On sait ainsi des le debut combien de questions seront posees.
      var PROGRESS_UNIT = {
        question: isGerman ? "Frage" : isArabic ? "السؤال" : isRussian ? "Вопрос" : "Question",
        word: isGerman ? "Wort" : isArabic ? "الكلمة" : isRussian ? "Слово" : isEnglish ? "Word" : "Mot",
        sorted: isGerman ? "Eingeordnet" : isArabic ? "مصنّفة" : isRussian ? "Распределено" : isEnglish ? "Sorted" : "Classées"
      };
      function progressReset(extraClass) {
        gameScoreEl.className = "game-score game-progress" + (extraClass ? " " + extraClass : "");
        gameScoreEl.textContent = "";
      }
      function progressLabel(text) {
        var label = document.createElement("span");
        label.className = "game-progress-label";
        label.textContent = text;
        gameScoreEl.appendChild(label);
      }
      function renderProgress(unit, showScore) {
        var st = gameState;
        var total = QUESTIONS_PER_ROUND;
        var n = Math.min(st.questionIndex, total);
        progressReset();
        progressLabel(unit + " " + n + " / " + total);
        var dots = document.createElement("span");
        dots.className = "game-progress-dots";
        dots.setAttribute("aria-hidden", "true");
        for (var i = 0; i < total; i++) {
          var dot = document.createElement("i");
          var r = st.results ? st.results[i] : undefined;
          dot.className = r === true ? "is-right" : r === false ? "is-wrong" : i < n - 1 ? "is-done" : i === n - 1 ? "is-current" : "";
          dots.appendChild(dot);
        }
        gameScoreEl.appendChild(dots);
        if (showScore) {
          var score = document.createElement("span");
          score.className = "game-progress-score";
          score.textContent = "✓ " + st.score;
          gameScoreEl.appendChild(score);
        }
      }
      function renderProgressBar(unit, done, total) {
        progressReset("game-progress-bar-mode");
        progressLabel(unit + " " + done + " / " + total);
        var bar = document.createElement("span");
        bar.className = "game-progress-bar";
        bar.setAttribute("aria-hidden", "true");
        var fill = document.createElement("i");
        fill.style.width = Math.round(done / total * 100) + "%";
        bar.appendChild(fill);
        gameScoreEl.appendChild(bar);
      }
      function renderScore() {
        renderProgress(PROGRESS_UNIT.question, true);
      }

      // Ecran de fin "joyeux" : couleur, emoji et animation selon le
      // resultat. >= 80 % = objectif atteint (vert + confettis), 50-79 %
      // = presque (orange), < 50 % = on retente (rouge/corail).
      var END_MOODS = {
        perfect: { emoji: "🏆" },
        win: { emoji: "🎉" },
        mid: { emoji: "👏" },
        lose: { emoji: "💪" }
      };
      var confettiTimer = null;
      var confettiWave2Timer = null;
      var PERFECT_LABEL = isGerman ? "Perfektes Ergebnis!" : isArabic ? "نتيجة مثالية!" : isRussian ? "Идеальный результат!" : isEnglish ? "Perfect score!" : "Score parfait !";

      function clearEndCelebration() {
        gameEnd.classList.remove("is-win", "is-mid", "is-lose", "is-perfect");
        var label = gameEnd.querySelector(".game-end-perfect-label");
        if (label) { label.remove(); }
        if (confettiWave2Timer) { clearTimeout(confettiWave2Timer); confettiWave2Timer = null; }
        if (gameEndBadge) { gameEndBadge.hidden = true; gameEndBadge.textContent = ""; }
        gameEnd.querySelectorAll(".game-confetti").forEach(function (old) { old.remove(); });
        if (confettiTimer) { clearTimeout(confettiTimer); confettiTimer = null; }
      }

      function launchConfetti(count, withStars) {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var box = document.createElement("div");
        box.className = "game-confetti";
        box.setAttribute("aria-hidden", "true");
        var colors = ["#4ADE80", "#FBBF24", "#60A5FA", "#F472B6", "#FB923C", "#A78BFA", "#2DD4BF"];
        for (var i = 0; i < count; i++) {
          var piece = document.createElement("span");
          piece.style.left = (Math.random() * 100) + "%";
          if (withStars && i % 4 === 0) {
            // etoiles dorees (score parfait)
            piece.textContent = "★";
            piece.className = "game-confetti-star";
            piece.style.color = i % 8 === 0 ? "#FDE68A" : "#FBBF24";
            piece.style.fontSize = (14 + Math.random() * 12) + "px";
            piece.style.animationDelay = (Math.random() * 1.4) + "s";
            piece.style.animationDuration = (2.6 + Math.random() * 2) + "s";
            box.appendChild(piece);
            continue;
          }
          piece.style.background = colors[i % colors.length];
          piece.style.animationDelay = (Math.random() * 1.2) + "s";
          piece.style.animationDuration = (2.4 + Math.random() * 1.8) + "s";
          piece.style.width = (6 + Math.random() * 6) + "px";
          piece.style.height = (10 + Math.random() * 8) + "px";
          box.appendChild(piece);
        }
        gameEnd.appendChild(box);
        confettiTimer = setTimeout(function () { box.remove(); confettiTimer = null; }, 6500);
      }

      function applyEndMood(pct) {
        // 100 % = score parfait : fete plus grande que le simple "objectif atteint"
        var mood = pct >= 100 ? "perfect" : pct >= 80 ? "win" : pct >= 50 ? "mid" : "lose";
        gameEnd.classList.add(mood === "perfect" ? "is-win" : "is-" + mood);
        if (mood === "perfect") {
          gameEnd.classList.add("is-perfect");
          var label = document.createElement("p");
          label.className = "game-end-perfect-label";
          label.textContent = PERFECT_LABEL;
          gameEnd.insertBefore(label, gameEnd.querySelector("h3"));
        }
        if (gameEndBadge) {
          gameEndBadge.textContent = END_MOODS[mood].emoji;
          gameEndBadge.hidden = false;
        }
        if (mood === "win") { launchConfetti(46, false); }
        if (mood === "perfect") {
          launchConfetti(90, true);
          // deuxieme volee de confettis pour prolonger la fete
          confettiWave2Timer = setTimeout(function () { confettiWave2Timer = null; launchConfetti(70, true); }, 2200);
        }
      }

      // Ecran de fin partage par les jeux qui n'ont pas la serie de 10
      // questions (Module 15, tri des lettres, alphabet dans l'ordre) :
      // meme DA que showEnd (score colore, emoji, confettis, score parfait).
      // opts : scoreText, pct, message, onReplay (relance le jeu), back
      // (affiche "Retour aux jeux" quand le jeu a un menu).
      var endReplayHandler = null;
      function showGameEnd(opts) {
        clearEndCelebration();
        gameBody.hidden = true;
        gameEnd.hidden = false;
        gameEndScore.textContent = opts.scoreText;
        applyEndMood(opts.pct);
        gameEndMessage.hidden = !opts.message;
        gameEndMessage.textContent = opts.message || "";
        gameContinueBtn.hidden = true;
        gameEndBackToMenuBtn.hidden = !opts.back;
        endReplayHandler = opts.onReplay || null;
      }

      function showEnd() {
        endReplayHandler = null;
        gameEndBackToMenuBtn.hidden = false;
        gameBody.hidden = true;
        gameEnd.hidden = false;
        gameEndScore.textContent = gameState.category === "read"
          ? (isGerman ? "Du hast " + QUESTIONS_PER_ROUND + " Wörter gelesen!" : isArabic ? "لقد قرأتَ " + QUESTIONS_PER_ROUND + " كلمات!" : isRussian ? "Ты прочитал(а) " + QUESTIONS_PER_ROUND + " слов!" : isEnglish ? "You read " + QUESTIONS_PER_ROUND + " words!" : "Tu as lu " + QUESTIONS_PER_ROUND + " mots !")
          : gameState.category === "dictee"
            ? (isGerman ? "Du hast " + QUESTIONS_PER_ROUND + " Wörter geschrieben!" : isArabic ? "لقد كتبتَ " + QUESTIONS_PER_ROUND + " كلمات!" : isRussian ? "Ты написал(а) " + QUESTIONS_PER_ROUND + " слов!" : isEnglish ? "You wrote " + QUESTIONS_PER_ROUND + " words!" : "Tu as écrit " + QUESTIONS_PER_ROUND + " mots !")
            : gameState.score + " / " + QUESTIONS_PER_ROUND;

        // Regle des 80% : recommande la suite ou l'entrainement, mais ne
        // bloque JAMAIS l'acces au module suivant - uniquement pour les
        // categories a score objectif (SCORED_CATEGORIES).
        var nextModuleBtn = document.querySelector('.js-open-game[data-module="' + (Number(gameState.moduleNumber) + 1) + '"]');
        clearEndCelebration();
        if (SCORED_CATEGORIES[gameState.category]) {
          var pct = Math.round((gameState.score / QUESTIONS_PER_ROUND) * 100);
          saveModuleBestPct(gameState.moduleNumber, pct);
          applyEndMood(pct);
          refreshModuleBadges();
          gameEndMessage.hidden = false;
          if (pct >= 80) {
            gameEndMessage.textContent = isGerman
              ? "Gut gemacht! Du beherrschst diese Stufe gut genug, um zum nächsten Modul überzugehen."
              : isArabic
              ? "أحسنت! أنت تتقن هذا المستوى بما يكفي للانتقال إلى الوحدة التالية."
              : isRussian
              ? "Отлично! Ты достаточно хорошо усвоил(а) этот уровень, чтобы перейти к следующему модулю."
              : isEnglish
              ? "Well done! You've mastered this level enough to move on to the next module."
              : "Bravo ! Tu maîtrises suffisamment ce niveau pour passer au module suivant.";
            gameContinueBtn.textContent = isGerman ? "Weiter zum nächsten Modul →" : isArabic ? "المتابعة إلى الوحدة التالية ←" : isRussian ? "Перейти к следующему модулю →" : isEnglish ? "Continue to next module →" : "Continuer vers le module suivant →";
          } else {
            gameEndMessage.textContent = isGerman
              ? "Du kannst zum nächsten Modul weitergehen, aber es wäre besser, dieses Modul noch ein wenig zu üben, um diese Laute wirklich zu beherrschen, bevor du fortfährst."
              : isArabic
              ? "يمكنك الانتقال إلى الوحدة التالية، لكن من الأفضل أن تتدرب أكثر قليلًا على هذه الوحدة لتتقن هذه الأصوات جيدًا قبل المتابعة."
              : isRussian
              ? "Ты можешь перейти к следующему модулю, но лучше ещё немного потренироваться на этом модуле, чтобы хорошо освоить эти звуки, прежде чем продолжать."
              : isEnglish
              ? "You can move on to the next module, but it would be better to practice this module a bit more to really master these sounds before continuing."
              : "Tu peux continuer vers le module suivant, mais il serait préférable de t'entraîner encore un peu sur ce module pour bien maîtriser les sons avant de poursuivre.";
            gameContinueBtn.textContent = isGerman ? "Trotzdem fortfahren →" : isArabic ? "المتابعة على أي حال ←" : isRussian ? "Продолжить в любом случае →" : isEnglish ? "Continue anyway →" : "Continuer quand même →";
          }
          gameContinueBtn.hidden = !nextModuleBtn;
        } else {
          gameEndMessage.hidden = true;
          gameContinueBtn.hidden = true;
        }
      }

      function nextQuestion() {
        clearWordReveal();
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

        if (gameState.category === "word") {
          // "Reconnaitre le mot" : les propositions n'apparaissent pas
          // d'emblee. Le joueur doit d'abord appuyer sur "Ecouter", et
          // elles s'affichent 3 secondes plus tard (voir gamePlayBtn).
          showWordHint(false);
        } else {
          renderQuizAnswers(choices);
        }
      }

      // fade = true : les propositions apparaissent l'une apres l'autre, en
      // fondu progressif (jeu "Reconnaitre le mot" apres l'ecoute).
      function renderQuizAnswers(choices, fade) {
        gameAnswers.innerHTML = "";
        gameAnswers.classList.toggle("game-answers-word", gameState.category === "word");
        choices.forEach(function (choice, i) {
          var btn = document.createElement("button");
          btn.type = "button";
          if (choice.kind === "word") {
            btn.className = "letterlab-cell game-answer game-answer-word";
            renderArabicText(btn, stretchArabic(choice.arabic));
          } else {
            btn.className = "letterlab-cell game-answer";
            renderLetterForm(btn, choice.text, choice.baseLen);
          }
          if (fade) {
            btn.classList.add("game-answer-fadein");
            btn.style.animationDelay = (i * WORD_FADE_STEP_S) + "s";
          }
          btn.addEventListener("click", function () { onAnswer(choice, btn); });
          gameAnswers.appendChild(btn);
        });
      }

      var WORD_REVEAL_DELAY_MS = 4500;
      var WORD_FADE_STEP_S = 0.8;
      var wordRevealTimer = null;
      var WORD_HINT_TXT = isGerman
        ? { press: "Tippe auf „Laut anhören“, um das Wort zu hören.", wait: "Hör gut zu … die Antworten erscheinen gleich." }
        : isArabic
        ? { press: "اضغط على «استمع إلى الصوت» لسماع الكلمة.", wait: "استمع جيدًا… ستظهر الاختيارات بعد ثوانٍ." }
        : isRussian
        ? { press: "Нажми «Слушать звук», чтобы услышать слово.", wait: "Слушай внимательно… варианты появятся через несколько секунд." }
        : isEnglish
        ? { press: "Press “Listen to the sound” to hear the word.", wait: "Listen carefully… the choices appear in a few seconds." }
        : { press: "Appuie sur « Écouter le son » pour entendre le mot.", wait: "Écoute bien… les propositions arrivent dans quelques secondes." };

      function clearWordReveal() {
        if (wordRevealTimer) { clearTimeout(wordRevealTimer); wordRevealTimer = null; }
      }

      function showWordHint(waiting) {
        gameAnswers.innerHTML = "";
        gameAnswers.classList.remove("game-answers-word");
        var hint = document.createElement("p");
        hint.className = "game-answers-hint";
        hint.textContent = waiting ? WORD_HINT_TXT.wait : WORD_HINT_TXT.press;
        gameAnswers.appendChild(hint);
      }

      // Bouton "Ecouter" du jeu "Reconnaitre le mot" : premier appui = lance
      // le mot et programme l'affichage des propositions ; appuis suivants
      // (ou apres l'affichage) = simple reecoute.
      function onQuizListen() {
        if (!gameState || !gameState.current || gameState.category === "script") return;
        var cur = gameState.current;
        playSound(cur.correct);
        if (gameState.category !== "word" || cur.revealed || wordRevealTimer) return;
        showWordHint(true);
        wordRevealTimer = setTimeout(function () {
          wordRevealTimer = null;
          if (!gameState || gameState.current !== cur) return;
          cur.revealed = true;
          renderQuizAnswers(cur.choices, true);
        }, WORD_REVEAL_DELAY_MS);
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
        gameReadListenBtn.textContent = isGerman ? "🔊 Anhören" : isArabic ? "🔊 استماع" : isRussian ? "🔊 Слушать" : isEnglish ? "🔊 Listen" : "🔊 Écouter";
        gameReadNextBtn.hidden = true;
        renderProgress(PROGRESS_UNIT.word, false);
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
        gameDicteeListenBtn.textContent = isGerman ? "🔊 Anhören" : isArabic ? "🔊 استماع" : isRussian ? "🔊 Слушать" : isEnglish ? "🔊 Listen" : "🔊 Écouter";
        gameDicteeRevealBtn.hidden = false;
        gameDicteeNextBtn.hidden = true;
        renderProgress(PROGRESS_UNIT.word, false);
      }

      // "J'ecoute et je place les harakat" : le squelette de lettres est
      // affiche, l'enfant doit entendre le mot et poser la bonne voyelle
      // (fatha/damma/kasra) sur chaque lettre avant de valider. Pool filtre
      // par buildHarakatPool (voyelles simples uniquement pour l'instant).
      function nextHarakatQuestion() {
        gameBody.classList.remove("is-harakat-answered");
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

      // Forme "tatwil + voyelle" : tatwil bleu fonce et voyelle rouge (copie rouge
      // sous une copie bleue du tatwil seul, exactement superposees). Meme rendu pour
      // les boutons a choisir et pour la voyelle posee dans une case : la voyelle est
      // ancree sur le tatwil, donc centree dans la case.
      function harakatFormEl(form) {
        var full = document.createElement("span");
        full.className = "harakat-form-full";
        full.textContent = HARAKAT_LABEL[form];
        var base = document.createElement("span");
        base.className = "harakat-form-base";
        base.setAttribute("aria-hidden", "true");
        base.textContent = "\u0640";
        var wrap = document.createElement("span");
        wrap.className = "harakat-form";
        wrap.appendChild(full);
        wrap.appendChild(base);
        return wrap;
      }

      function renderHarakatSlotContent(idx) {
        var slot = gameState.current.slots[idx];
        var placeholder = harakatSlots.children[idx].querySelector(".harakat-slot-placeholder");
        placeholder.textContent = "";
        if (slot.filled) { placeholder.appendChild(harakatFormEl(slot.filled)); }
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
          var wrap = harakatFormEl(form);
          btn.appendChild(wrap);
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
        gameState.results[gameState.questionIndex - 1] = isCorrect;
        playResultFx(isCorrect);

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
          ? (isGerman
              ? item.letter + " ist ein Sonnenbuchstabe: Die Schadda erscheint auf " + item.letter + "."
              : isArabic
              ? item.letter + " حرف شمسي: تظهر الشدّة على " + item.letter + "."
              : isRussian
              ? item.letter + " — солнечная буква: шадда появляется на " + item.letter + "."
              : isEnglish
              ? item.letter + " is a sun letter: the Shadda appears on " + item.letter + "."
              : item.letter + " est une lettre solaire : la Shadda apparaît sur " + item.letter + ".")
          : (isGerman
              ? item.letter + " ist ein Mondbuchstabe: keine Schadda, das « ل » wird ausgesprochen."
              : isArabic
              ? item.letter + " حرف قمري: بلا شدّة، وتُنطق « ل »."
              : isRussian
              ? item.letter + " — лунная буква: без шадды, « ل » произносится."
              : isEnglish
              ? item.letter + " is a moon letter: no Shadda, the ل is pronounced."
              : item.letter + " est une lettre lunaire : pas de Shadda, le ل se prononce.");

        gameFeedback.hidden = false;
        gameFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        gameFeedback.textContent = (isCorrect
          ? (isGerman ? "Richtig! " : isArabic ? "أحسنت! " : isRussian ? "Верно! " : isEnglish ? "Correct! " : "Bravo ! ")
          : (isGerman ? "Nicht ganz — " : isArabic ? "ليس تمامًا — " : isRussian ? "Не совсем — " : isEnglish ? "Not quite — " : "Ce n'était pas ça — ")) + explain;

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
        gameState.results[gameState.questionIndex - 1] = isCorrect;
        playResultFx(isCorrect);

        gameSortSunBtn.disabled = true;
        gameSortMoonBtn.disabled = true;
        btnEl.classList.add(isCorrect ? "is-correct" : "is-wrong");
        if (!isCorrect) {
          (item.type === "sun" ? gameSortSunBtn : gameSortMoonBtn).classList.add("is-correct");
        }

        var letterChar = ALL_LETTERS_BY_ID[item.id].char;
        var explain = item.type === "sun"
          ? (isGerman
              ? letterChar + " ist ein Sonnenbuchstabe."
              : isArabic
              ? letterChar + " حرف شمسي."
              : isRussian
              ? letterChar + " — солнечная буква."
              : isEnglish
              ? letterChar + " is a sun letter."
              : letterChar + " est une lettre solaire.")
          : (isGerman
              ? letterChar + " ist ein Mondbuchstabe."
              : isArabic
              ? letterChar + " حرف قمري."
              : isRussian
              ? letterChar + " — лунная буква."
              : isEnglish
              ? letterChar + " is a moon letter."
              : letterChar + " est une lettre lunaire.");

        gameSortFeedback.hidden = false;
        gameSortFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        gameSortFeedback.textContent = (isCorrect
          ? (isGerman ? "Richtig! " : isArabic ? "أحسنت! " : isRussian ? "Верно! " : isEnglish ? "Correct! " : "Bravo ! ")
          : (isGerman ? "Nicht ganz — " : isArabic ? "ليس تمامًا — " : isRussian ? "Не совсем — " : isEnglish ? "Not quite — " : "Ce n'était pas ça — ")) + explain;

        gameSortNextBtn.hidden = false;
        renderScore();
      }

      function onAnswer(choice, btnEl) {
        if (gameState.current.answered) return;
        gameState.current.answered = true;
        var isCorrect = choice.key === gameState.current.correct.key;
        if (isCorrect) { gameState.score += 1; }
        gameState.results[gameState.questionIndex - 1] = isCorrect;
        playResultFx(isCorrect);

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
          ? (isGerman ? "Richtig!" : isArabic ? "أحسنت!" : isRussian ? "Верно!" : isEnglish ? "Correct!" : "Bravo, c'est la bonne réponse !")
          : (isGerman ? "Nicht ganz — hier ist die richtige Antwort." : isArabic ? "ليس تمامًا — هذه هي الإجابة الصحيحة." : isRussian ? "Не совсем — вот правильный ответ." : isEnglish ? "Not quite — here is the right answer." : "Ce n'était pas ça — voici la bonne réponse.");

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
        // vue compacte : tout (voyelles, mot, "Mot suivant") tient sans defiler
        gameBody.classList.toggle("is-harakat-play", category === "harakat");
        gameSortPanel.hidden = category !== "sort";
        gameSortAllPanel.hidden = true;
        gameOrderPanel.hidden = true;
        gameSoundPanel.hidden = true;
        gameOrder5Panel.hidden = true;
        gamePuzzlePanel.hidden = true;
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
        gameState = { moduleNumber: moduleNumber, title: title, category: category, pool: pool, questionIndex: 0, score: 0, current: null, usedKeys: {}, results: [] };
        gameModalTitle.textContent = title;
        var letterCount = cumulativeLetterCount(moduleNumber);
        gameLevelInfo.textContent = isGerman
          ? "Bisher gelernte Buchstaben: " + letterCount
          : isArabic
          ? "الحروف المتعلَّمة: " + letterCount
          : isRussian
          ? "Изучено букв: " + letterCount
          : isEnglish
          ? "Letters learned so far: " + letterCount
          : "Lettres apprises : " + letterCount;
        gamePrestartWarning.hidden = true;
        gameMenuScreen.hidden = true;
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
        gameMenuHeading.textContent = isGerman ? "Spiele — Modul " + moduleNumber : isArabic ? "ألعاب — الوحدة " + moduleNumber : isRussian ? "Игры — модуль " + moduleNumber : isEnglish ? "Games — Module " + moduleNumber : "Jeux du Module " + moduleNumber;
        var letterCount = cumulativeLetterCount(moduleNumber);
        gameMenuLevelInfo.textContent = isGerman
          ? "Bisher gelernte Buchstaben: " + letterCount
          : isArabic
          ? "الحروف المتعلَّمة: " + letterCount
          : isRussian
          ? "Изучено букв: " + letterCount
          : isEnglish
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
        if (category === "orderall") {
          startOrderGame(menuTitle, true);
          return;
        }
        if (category === "order5") {
          startOrder5Game(menuTitle);
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
      var sortAllEndTimer = null;
      var orderEndTimer = null;

      function showSortAllPanel() {
        gameQuizPanel.hidden = true;
        gameReadPanel.hidden = true;
        gameDicteePanel.hidden = true;
        gameHarakatPanel.hidden = true;
        gameSortPanel.hidden = true;
        gameSortAllPanel.hidden = false;
        gameOrderPanel.hidden = true;
        gameSoundPanel.hidden = true;
        gameOrder5Panel.hidden = true;
        gamePuzzlePanel.hidden = true;
        gameDictee1Panel.hidden = true;
      }

      function startSortAllGame() {
        if (sortAllEndTimer) { clearTimeout(sortAllEndTimer); sortAllEndTimer = null; }
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
        renderProgressBar(PROGRESS_UNIT.sorted, 0, sortAllState.total);

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
        playResultFx(isCorrect);
        sortAllState.remaining -= 1;
        renderProgressBar(PROGRESS_UNIT.sorted, sortAllState.total - sortAllState.remaining, sortAllState.total);

        var tile = document.createElement("span");
        tile.className = "sortall-tile " + (isCorrect ? "is-correct" : "is-wrong");
        tile.textContent = ALL_LETTERS_BY_ID[id].char;
        (type === "sun" ? sortAllSunColumn : sortAllMoonColumn).appendChild(tile);

        renderSortAllPool();

        var letterChar = ALL_LETTERS_BY_ID[id].char;
        var explain = item.type === "sun"
          ? (isGerman ? letterChar + " ist ein Sonnenbuchstabe." : isArabic ? letterChar + " حرف شمسي." : isRussian ? letterChar + " — солнечная буква." : isEnglish ? letterChar + " is a sun letter." : letterChar + " est une lettre solaire.")
          : (isGerman ? letterChar + " ist ein Mondbuchstabe." : isArabic ? letterChar + " حرف قمري." : isRussian ? letterChar + " — лунная буква." : isEnglish ? letterChar + " is a moon letter." : letterChar + " est une lettre lunaire.");
        sortAllFeedback.hidden = false;
        sortAllFeedback.className = "game-feedback " + (isCorrect ? "is-correct" : "is-wrong");
        sortAllFeedback.textContent = (isCorrect
          ? (isGerman ? "Richtig! " : isArabic ? "أحسنت! " : isRussian ? "Верно! " : isEnglish ? "Correct! " : "Bravo ! ")
          : (isGerman ? "Nicht ganz — " : isArabic ? "ليس تمامًا — " : isRussian ? "Не совсем — " : isEnglish ? "Not quite — " : "Ce n'était pas ça — ")) + explain;

        if (sortAllState.remaining === 0) {
          sortAllFeedback.hidden = true;
          var sortAllDoneText = isGerman
            ? "Du hast " + sortAllState.correctCount + " / " + sortAllState.total + " Buchstaben richtig eingeordnet!"
            : isArabic
            ? "لقد صنّفتَ " + sortAllState.correctCount + " / " + sortAllState.total + " حرفًا بشكل صحيح!"
            : isRussian
            ? "Ты правильно рассортировал(а) " + sortAllState.correctCount + " / " + sortAllState.total + " букв!"
            : isEnglish
            ? "You correctly classified " + sortAllState.correctCount + " / " + sortAllState.total + " letters!"
            : "Tu as classé " + sortAllState.correctCount + " / " + sortAllState.total + " lettres correctement !";
          // Laisse voir le dernier retour, puis meme ecran de fin que les
          // autres jeux (score colore, emoji, confettis).
          var sortAllResult = { good: sortAllState.correctCount, total: sortAllState.total };
          sortAllEndTimer = setTimeout(function () {
            sortAllEndTimer = null;
            showGameEnd({
              scoreText: sortAllResult.good + " / " + sortAllResult.total,
              pct: Math.round(sortAllResult.good / sortAllResult.total * 100),
              message: sortAllDoneText,
              onReplay: startSortAllGame,
              back: true
            });
          }, 1400);
        }
      }

      // "L'alphabet dans l'ordre" (Module 14, jeu libre sans score ni audio) :
      // les 28 lettres melangees sont placees dans un tableau numerote ; la
      // verification se fait a la fin (bouton), les lettres fausses sont
      // marquees en rouge et peuvent etre retirees puis replacees.
      var ORDER_LANG = isGerman ? "de" : isArabic ? "ar" : isRussian ? "ru" : isEnglish ? "en" : "fr";
      var ORDER_TXT = {
        fr: { partial: "{n} / 28 lettres bien placées. Touche une lettre en rouge pour la retirer et la replacer.", done: "Bravo ! Les 28 lettres sont dans le bon ordre." },
        en: { partial: "{n} / 28 letters correctly placed. Touch a red letter to remove it and place it again.", done: "Well done! All 28 letters are in the right order." },
        ru: { partial: "Правильно размещено {n} / 28 букв. Коснись красной буквы, чтобы убрать её и поставить заново.", done: "Отлично! Все 28 букв стоят в правильном порядке." },
        de: { partial: "{n} / 28 Buchstaben richtig platziert. Tippe auf einen roten Buchstaben, um ihn zu entfernen und neu zu platzieren.", done: "Gut gemacht! Alle 28 Buchstaben stehen in der richtigen Reihenfolge." },
        ar: { partial: "{n} / 28 حرفًا في مكانه الصحيح. المس حرفًا أحمر لإزالته ثم ضعه من جديد.", done: "أحسنت! الحروف الثمانية والعشرون في ترتيبها الصحيح." }
      }[ORDER_LANG];
      var orderState = null;

      function orderIds() {
        var ids = [];
        MODULES.forEach(function (m) { ids = ids.concat(m.letterIds); });
        return ids;
      }

      // Les polices arabes ont des lettres dont l'encre est tres decalee par
      // rapport a la ligne de base (ج ح خ descendent, ك ف montent...) : on
      // mesure l'encre reelle de chaque lettre (canvas) et la position de sa
      // ligne de base dans la page, puis on la recentre verticalement au
      // milieu de la case (voir centerOrderLetters).
      var orderCtx = null;
      var orderInkCache = {};
      function orderInkCenterEm(ch) {
        if (orderInkCache[ch] !== undefined) return orderInkCache[ch];
        if (!orderCtx) { orderCtx = document.createElement("canvas").getContext("2d"); }
        orderCtx.font = "100px 'Amiri Quran', Amiri, Cairo, serif";
        var m = orderCtx.measureText(ch);
        if (m.actualBoundingBoxAscent === undefined) { return 0; }
        var v = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 200;
        if (document.fonts && document.fonts.check("16px 'Amiri Quran'")) { orderInkCache[ch] = v; }
        return v;
      }

      function orderLetterSpan(ch) {
        var span = document.createElement("span");
        span.className = "order-letter";
        span.setAttribute("data-ch", ch);
        span.textContent = ch;
        var marker = document.createElement("i");
        marker.className = "order-baseline";
        span.appendChild(marker);
        return span;
      }

      function centerOrderLetters(boxes) {
        (boxes || [orderGrid, orderPool]).forEach(function (box) {
          Array.prototype.forEach.call(box.querySelectorAll(".order-letter"), function (span) {
            var host = span.parentNode.getBoundingClientRect();
            if (!host.height) return;
            // Dans une case numerotee, on centre la lettre dans la zone sous
            // le numero (sinon elle colle au chiffre).
            var numEl = span.parentNode.querySelector(".order-num");
            var zoneTop = numEl ? numEl.getBoundingClientRect().bottom : host.top;
            span.style.top = "0px";
            var baselineY = span.querySelector(".order-baseline").getBoundingClientRect().bottom;
            var fontPx = parseFloat(getComputedStyle(span).fontSize);
            var inkY = baselineY - orderInkCenterEm(span.getAttribute("data-ch")) * fontPx;
            var centerY = zoneTop + (host.bottom - zoneTop) / 2;
            span.style.top = Math.round((centerY - inkY) * 10) / 10 + "px";
          });
        });
      }

      // Correction : apres une verification imparfaite, "Voir le tableau
      // correct" affiche la bonne grille sous la reponse du joueur (qui reste,
      // avec ses cases justes / fausses) pour pouvoir comparer.
      var orderCompareEls = [];
      var orderAnswerGrid = null;
      var orderScoreEl = null;

      // Resultat "x / 28" ludique : carte coloree selon le pourcentage (vert
      // des 80 %, orange de 50 a 79 %, rouge en dessous) avec emoji anime,
      // gros score, barre de progression et petit mot d'encouragement.
      var ORDER_SCORE_TXT = {
        fr: { high: "Presque parfait !", mid: "Bien joué, continue !", low: "Courage, tu vas y arriver !" },
        en: { high: "Almost perfect!", mid: "Well played, keep going!", low: "Keep it up, you’ll get there!" },
        ru: { high: "Почти идеально!", mid: "Хорошо, продолжай!", low: "Не сдавайся, у тебя получится!" },
        de: { high: "Fast perfekt!", mid: "Gut gemacht, weiter so!", low: "Nur Mut, du schaffst das!" },
        ar: { high: "تقريبًا مثالي!", mid: "أحسنت، واصل!", low: "تشجّع، ستنجح!" }
      }[ORDER_LANG];
      var ORDER_SCORE_EMOJI = { high: "🎉", mid: "👏", low: "💪" };
      function showOrderScore(good) {
        var total = orderState.ids.length;
        if (orderScoreEl) { orderScoreEl.remove(); }
        orderScoreEl = document.createElement("div");
        var pct = Math.round(good / total * 100);
        var tier = pct >= 80 ? "high" : pct >= 50 ? "mid" : "low";
        orderScoreEl.className = "order-score order-score-" + tier;
        var emoji = document.createElement("span");
        emoji.className = "order-score-emoji";
        emoji.setAttribute("aria-hidden", "true");
        emoji.textContent = ORDER_SCORE_EMOJI[tier];
        var num = document.createElement("span");
        num.className = "order-score-num";
        num.textContent = good + " / " + total;
        var bar = document.createElement("span");
        bar.className = "order-score-bar";
        var fill = document.createElement("i");
        fill.style.width = "0%";
        bar.appendChild(fill);
        var msg = document.createElement("span");
        msg.className = "order-score-msg";
        msg.textContent = ORDER_SCORE_TXT[tier];
        orderScoreEl.appendChild(emoji);
        orderScoreEl.appendChild(num);
        orderScoreEl.appendChild(bar);
        orderScoreEl.appendChild(msg);
        orderGrid.parentNode.insertBefore(orderScoreEl, orderGrid);
        // la barre se remplit apres l'apparition de la carte
        requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct + "%"; }); });
      }
      function hideOrderScore() {
        if (orderScoreEl) { orderScoreEl.remove(); orderScoreEl = null; }
      }
      function clearOrderCompare() {
        orderCompareEls.forEach(function (el) { el.remove(); });
        orderCompareEls = [];
        orderAnswerGrid = null;
        hideOrderScore();
      }

      function revealOrderTable() {
        if (!orderState || orderState.revealed) return;
        orderState.revealed = true;
        orderState.armedId = null;
        orderState.marks = orderState.slots.map(function (id, i) { return id === orderState.ids[i]; });
        var goodNow = orderState.marks.filter(Boolean).length;
        clearOrderCompare();
        showOrderScore(goodNow);
        var mine = document.createElement("p");
        mine.className = "order5-compare-label";
        mine.textContent = ORDER5_TXT.mineLabel;
        orderGrid.parentNode.insertBefore(mine, orderGrid);
        var label = document.createElement("p");
        label.className = "order5-compare-label";
        label.textContent = ORDER5_TXT.answerLabel;
        orderAnswerGrid = document.createElement("div");
        orderAnswerGrid.className = "order-grid order-answer";
        orderGrid.parentNode.insertBefore(label, orderPool);
        orderGrid.parentNode.insertBefore(orderAnswerGrid, orderPool);
        orderCompareEls = [mine, label, orderAnswerGrid];
        orderFeedback.hidden = false;
        orderFeedback.className = "game-feedback is-correct";
        orderFeedback.textContent = ORDER5_TXT.revealMsg;
        orderCheckBtn.hidden = true;
        orderRevealBtn.hidden = true;
        renderOrderGame();
        var scrollTarget = orderScoreEl || mine;
        if (scrollTarget.scrollIntoView) { scrollTarget.scrollIntoView({ block: "start", behavior: "smooth" }); }
      }

      function resetOrderGame() {
        if (orderEndTimer) { clearTimeout(orderEndTimer); orderEndTimer = null; }
        var ids = orderIds();
        clearOrderCompare();
        orderRevealBtn.hidden = true;
        orderState = { ids: ids, slots: ids.map(function () { return null; }), pool: shuffleArray(ids.slice()), armedId: null, marks: null, done: false, revealed: false };
        orderFeedback.hidden = true;
        orderFeedback.className = "game-feedback";
        orderFeedback.textContent = "";
        orderCheckBtn.hidden = false;
        renderOrderGame();
      }

      function clearOrderMarks() {
        orderState.marks = null;
        orderFeedback.hidden = true;
        hideOrderScore();
      }

      function renderOrderGame() {
        orderGrid.innerHTML = "";
        orderPool.innerHTML = "";
        orderState.slots.forEach(function (id, i) {
          var btn = document.createElement("button");
          btn.type = "button";
          var cls = "order-slot" + (id ? " is-filled" : "");
          if (orderState.marks && id) { cls += orderState.marks[i] ? " is-correct" : " is-wrong"; }
          btn.className = cls;
          btn.setAttribute("aria-label", String(i + 1));
          var num = document.createElement("span");
          num.className = "order-num";
          num.textContent = String(i + 1);
          btn.appendChild(num);
          if (id) { btn.appendChild(orderLetterSpan(ALL_LETTERS_BY_ID[id].char)); }
          btn.addEventListener("click", function () { placeOrderLetter(i); });
          orderGrid.appendChild(btn);
        });
        if (orderState.revealed && orderAnswerGrid) {
          orderAnswerGrid.innerHTML = "";
          orderState.ids.forEach(function (id, i) {
            var cell = document.createElement("div");
            cell.className = "order-slot is-filled is-correct";
            var num = document.createElement("span");
            num.className = "order-num";
            num.textContent = String(i + 1);
            cell.appendChild(num);
            cell.appendChild(orderLetterSpan(ALL_LETTERS_BY_ID[id].char));
            orderAnswerGrid.appendChild(cell);
          });
        }
        (orderState.revealed ? [] : orderState.pool).forEach(function (id) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "letterlab-cell sortall-letter" + (orderState.armedId === id ? " is-armed" : "");
          btn.appendChild(orderLetterSpan(ALL_LETTERS_BY_ID[id].char));
          btn.addEventListener("click", function () {
            if (orderState.done) return;
            orderState.armedId = orderState.armedId === id ? null : id;
            renderOrderGame();
          });
          orderPool.appendChild(btn);
        });
        orderCheckBtn.disabled = orderState.pool.length > 0;
        centerOrderLetters(orderAnswerGrid ? [orderGrid, orderAnswerGrid, orderPool] : null);
      }

      function placeOrderLetter(i) {
        if (!orderState || orderState.done || orderState.revealed) return;
        var current = orderState.slots[i];
        if (orderState.armedId) {
          if (current) { orderState.pool.push(current); }
          orderState.slots[i] = orderState.armedId;
          orderState.pool = orderState.pool.filter(function (id) { return id !== orderState.armedId; });
          orderState.armedId = null;
        } else if (current) {
          orderState.slots[i] = null;
          orderState.pool.push(current);
        } else {
          return;
        }
        clearOrderMarks();
        renderOrderGame();
      }

      function checkOrderGame() {
        if (!orderState || orderState.pool.length) return;
        var good = 0;
        orderState.marks = orderState.slots.map(function (id, i) {
          var ok = id === orderState.ids[i];
          if (ok) { good += 1; }
          return ok;
        });
        var allGood = good === orderState.ids.length;
        playResultFx(allGood);
        orderFeedback.hidden = false;
        orderFeedback.className = "game-feedback " + (allGood ? "is-correct" : "is-wrong");
        orderFeedback.textContent = allGood ? ORDER_TXT.done : ORDER_TXT.partial.replace("{n}", good);
        orderRevealBtn.hidden = allGood;
        if (allGood) { hideOrderScore(); } else { showOrderScore(good); }
        if (allGood) {
          orderState.done = true;
          orderCheckBtn.hidden = true;
          orderEndTimer = setTimeout(function () {
            orderEndTimer = null;
            showGameEnd({ scoreText: "28 / 28", pct: 100, message: ORDER_TXT.done, onReplay: resetOrderGame, back: true });
          }, 1200);
        }
        renderOrderGame();
      }

      // Module 14 : la carte ouvre un petit menu (les 28 lettres / 5 lettres
      // dans l'ordre), comme le Module 13.
      function startOrderMenu(title) {
        openGameMenu("14", title, ORDER_MENU_ITEMS);
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }

      function startOrderGame(title, fromMenu) {
        menuTitle = title;
        gameModalTitle.textContent = title;
        gamePrestartWarning.hidden = true;
        gameMenuScreen.hidden = true;
        gameEnd.hidden = true;
        gameBody.hidden = false;
        gameLevelInfo.textContent = "";
        gameScoreEl.textContent = "";
        gameBackToMenuBtn.hidden = !fromMenu;
        hideAllGamePanels();
        gameOrderPanel.hidden = false;
        gameSoundPanel.hidden = true;
        gameOrder5Panel.hidden = true;
        gamePuzzlePanel.hidden = true;
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        resetOrderGame();
        if (document.fonts && document.fonts.load) {
          document.fonts.load("24px 'Amiri Quran'", "\u0623\u0628").then(function () {
            if (orderState) { renderOrderGame(); }
          });
        }
      }

      // "5 lettres dans l'ordre" (Module 14, menu a 2 jeux) : serie de 3
      // manches. Chaque manche propose 5 lettres qui se suivent dans
      // l'alphabet (ex. ح خ د ذ ر), melangees ; on les remet dans l'ordre
      // (toucher une lettre, puis la case numerotee). Un point par lettre bien
      // placee a la premiere verification (score sur 15) ; en cas d'erreur,
      // on corrige et on revalide sans point de plus.
      var ORDER5_ROUNDS = 3;
      var ORDER5_SIZE = 5;
      var ORDER5_TXT = {
        fr: { revealMsg: "Compare avec ta réponse et retiens bien cet ordre !", mineLabel: "Ta réponse", answerLabel: "Bonne réponse", round: "Manche {n} / {t}", partial: "{n} / 5 lettres bien placées. Touche une lettre en rouge pour la retirer et la replacer.", done: "Bravo ! Les 5 lettres sont dans le bon ordre.", doneLate: "C’est juste ! (Seule la première vérification compte pour les points.)", next: "Manche suivante →", result: "Voir mon résultat →", great: "Excellent, tu connais très bien l’ordre des lettres !", ok: "Bien joué ! Encore un peu d’entraînement et ce sera parfait.", low: "Continue de t’entraîner : revois l’alphabet dans l’ordre, puis reviens jouer." },
        en: { revealMsg: "Compare it with your answer and remember this order!", mineLabel: "Your answer", answerLabel: "Correct answer", round: "Round {n} / {t}", partial: "{n} / 5 letters correctly placed. Touch a red letter to remove it and place it again.", done: "Well done! The 5 letters are in the right order.", doneLate: "Correct! (Only the first check counts for points.)", next: "Next round →", result: "See my result →", great: "Excellent, you know the order of the letters very well!", ok: "Well played! A little more practice and it will be perfect.", low: "Keep practising: go over the alphabet in order, then come back and play." },
        ru: { revealMsg: "Сравни со своим ответом и запомни этот порядок!", mineLabel: "Твой ответ", answerLabel: "Правильный ответ", round: "Раунд {n} / {t}", partial: "Правильно размещено {n} / 5 букв. Коснись красной буквы, чтобы убрать её и поставить заново.", done: "Отлично! Все 5 букв стоят в правильном порядке.", doneLate: "Верно! (Баллы засчитываются только за первую проверку.)", next: "Следующий раунд →", result: "Посмотреть результат →", great: "Отлично, ты очень хорошо знаешь порядок букв!", ok: "Хорошо сыграно! Ещё немного практики, и будет идеально.", low: "Продолжай тренироваться: повтори алфавит по порядку и возвращайся играть." },
        de: { revealMsg: "Vergleiche mit deiner Antwort und präg dir die Reihenfolge ein!", mineLabel: "Deine Antwort", answerLabel: "Richtige Antwort", round: "Runde {n} / {t}", partial: "{n} / 5 Buchstaben richtig platziert. Tippe auf einen roten Buchstaben, um ihn zu entfernen und neu zu platzieren.", done: "Gut gemacht! Die 5 Buchstaben stehen in der richtigen Reihenfolge.", doneLate: "Richtig! (Nur die erste Prüfung zählt für die Punkte.)", next: "Nächste Runde →", result: "Ergebnis ansehen →", great: "Ausgezeichnet, du kennst die Reihenfolge der Buchstaben sehr gut!", ok: "Gut gespielt! Noch etwas Übung und es wird perfekt.", low: "Übe weiter: Geh das Alphabet der Reihe nach durch und komm dann zurück zum Spielen." },
        ar: { revealMsg: "قارن مع إجابتك وتذكّر هذا الترتيب!", mineLabel: "إجابتك", answerLabel: "الإجابة الصحيحة", round: "الجولة {n} / {t}", partial: "{n} / 5 حروف في مكانها الصحيح. المس حرفًا أحمر لإزالته ثم ضعه من جديد.", done: "أحسنت! الحروف الخمسة في ترتيبها الصحيح.", doneLate: "صحيح! (تُحتسب النقاط من التحقق الأول فقط.)", next: "الجولة التالية ←", result: "عرض النتيجة ←", great: "ممتاز، أنت تعرف ترتيب الحروف جيدًا جدًا!", ok: "لعبٌ جيد! قليل من التدريب وسيكون الأداء مثاليًا.", low: "واصل التدرّب: راجع الأبجدية بالترتيب ثم عد للعب." }
      }[ORDER_LANG];
      var order5State = null;
      var order5AutoTimer = null;
      var ORDER5_AUTO_NEXT_MS = 2000;
      function clearOrder5Timer() {
        if (order5AutoTimer) { clearTimeout(order5AutoTimer); order5AutoTimer = null; }
      }
      // Affichage de la correction : ta combinaison reste en haut, la bonne
      // reponse apparait dessous (meme grille) pour comparer.
      var order5CompareEls = [];
      var order5AnswerGrid = null;
      function clearOrder5Compare() {
        order5CompareEls.forEach(function (el) { el.remove(); });
        order5CompareEls = [];
        order5AnswerGrid = null;
      }
      function buildOrder5Compare() {
        clearOrder5Compare();
        var mine = document.createElement("p");
        mine.className = "order5-compare-label";
        mine.textContent = ORDER5_TXT.mineLabel;
        order5Grid.parentNode.insertBefore(mine, order5Grid);
        var label = document.createElement("p");
        label.className = "order5-compare-label";
        label.textContent = ORDER5_TXT.answerLabel;
        order5AnswerGrid = document.createElement("div");
        order5AnswerGrid.className = "order-grid order5-grid order5-answer";
        order5Grid.parentNode.insertBefore(label, order5Pool);
        order5Grid.parentNode.insertBefore(order5AnswerGrid, order5Pool);
        order5CompareEls = [mine, label, order5AnswerGrid];
      }

      function order5Fill(text, n, t) { return text.replace("{n}", n).replace("{t}", t); }

      // Choix des 3 suites de 5 lettres d'une partie. Deux garde-fous pour que
      // "ca ne tourne pas toujours autour des memes lettres" :
      //  1. une suite dans chaque tiers de l'alphabet (debut, milieu, fin),
      //     sans chevauchement, melangees dans l'ordre des manches ;
      //  2. a l'interieur d'un tiers, les suites qui contiennent les lettres
      //     les moins vues sont favorisees (compteur memorise sur
      //     l'appareil, localStorage) : sans cela, les lettres du milieu
      //     (presentes dans 5 suites possibles) sortaient 5 fois plus que
      //     alif ou ya (presentes dans une seule).
      var ORDER5_SEEN_KEY = "ahl_order5_seen_v1";
      var ORDER5_TOTAL = 28;
      function order5LoadSeen() {
        try {
          var raw = JSON.parse(localStorage.getItem(ORDER5_SEEN_KEY));
          if (Array.isArray(raw) && raw.length === ORDER5_TOTAL) {
            return raw.map(function (n) { return Number(n) || 0; });
          }
        } catch (e) { /* stockage indisponible : tirage sans memoire */ }
        var empty = [];
        for (var i = 0; i < ORDER5_TOTAL; i++) { empty.push(0); }
        return empty;
      }
      function order5SaveSeen(seen) {
        try { localStorage.setItem(ORDER5_SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* ignore */ }
      }
      function order5PickStarts() {
        var seen = order5LoadSeen();
        var lastStart = ORDER5_TOTAL - ORDER5_SIZE;               // 23
        var zones = [[0, 7], [8, 15], [16, lastStart]];            // tiers de l'alphabet
        var picks = [];
        zones.forEach(function (zone) {
          // pas de chevauchement avec la suite du tiers precedent
          var from = Math.max(zone[0], picks.length ? picks[picks.length - 1] + ORDER5_SIZE : 0);
          var starts = [];
          var weights = [];
          for (var s = from; s <= zone[1]; s++) {
            var w = 0;
            for (var l = s; l < s + ORDER5_SIZE; l++) { w += 1 / Math.pow(1 + seen[l], 2); }
            starts.push(s);
            weights.push(w);
          }
          var total = weights.reduce(function (a, b) { return a + b; }, 0);
          var r = Math.random() * total;
          var pick = starts[starts.length - 1];
          for (var i = 0; i < starts.length; i++) {
            r -= weights[i];
            if (r <= 0) { pick = starts[i]; break; }
          }
          picks.push(pick);
        });
        picks.forEach(function (s) {
          for (var l = s; l < s + ORDER5_SIZE; l++) { seen[l] += 1; }
        });
        // compteurs relatifs et bornes : on retire le minimum commun et on
        // plafonne l'ecart, pour qu'un ancien historique ne fige pas le tirage
        var min = Math.min.apply(null, seen);
        seen = seen.map(function (n) { return Math.min(n - min, 8); });
        order5SaveSeen(seen);
        return shuffleArray(picks);
      }

      function order5StartRound() {
        clearOrder5Timer();
        var st = order5State;
        var all = orderIds();
        var ids = all.slice(st.starts[st.idx], st.starts[st.idx] + ORDER5_SIZE);
        var shuffled = ids.slice();
        var guard = 0;
        do { shuffled = shuffleArray(ids.slice()); guard++; }
        while (guard < 20 && shuffled.every(function (id, i) { return id === ids[i]; }));
        st.ids = ids;
        st.slots = ids.map(function () { return null; });
        st.pool = shuffled;
        st.armedId = null;
        st.marks = null;
        st.attempts = 0;
        st.solved = false;
        st.revealed = false;
        order5Round.textContent = order5Fill(ORDER5_TXT.round, st.idx + 1, ORDER5_ROUNDS);
        order5Feedback.hidden = true;
        order5Feedback.className = "game-feedback";
        order5Feedback.textContent = "";
        order5CheckBtn.hidden = false;
        order5NextBtn.hidden = true;
        order5RevealBtn.hidden = true;
        clearOrder5Compare();
        renderOrder5();
      }

      function renderOrder5() {
        var st = order5State;
        order5Grid.innerHTML = "";
        order5Pool.innerHTML = "";
        st.slots.forEach(function (id, i) {
          var btn = document.createElement("button");
          btn.type = "button";
          var cls = "order-slot" + (id ? " is-filled" : "");
          if (st.marks && id) { cls += st.marks[i] ? " is-correct" : " is-wrong"; }
          btn.className = cls;
          btn.setAttribute("aria-label", String(i + 1));
          var num = document.createElement("span");
          num.className = "order-num";
          num.textContent = String(i + 1);
          btn.appendChild(num);
          if (id) { btn.appendChild(orderLetterSpan(ALL_LETTERS_BY_ID[id].char)); }
          btn.addEventListener("click", function () { order5Place(i); });
          order5Grid.appendChild(btn);
        });
        if (st.revealed && order5AnswerGrid) {
          order5AnswerGrid.innerHTML = "";
          st.ids.forEach(function (id, i) {
            var cell = document.createElement("div");
            cell.className = "order-slot is-filled is-correct";
            var num = document.createElement("span");
            num.className = "order-num";
            num.textContent = String(i + 1);
            cell.appendChild(num);
            cell.appendChild(orderLetterSpan(ALL_LETTERS_BY_ID[id].char));
            order5AnswerGrid.appendChild(cell);
          });
        }
        (st.revealed ? [] : st.pool).forEach(function (id) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "letterlab-cell sortall-letter" + (st.armedId === id ? " is-armed" : "");
          btn.appendChild(orderLetterSpan(ALL_LETTERS_BY_ID[id].char));
          btn.addEventListener("click", function () {
            if (st.solved) return;
            st.armedId = st.armedId === id ? null : id;
            renderOrder5();
          });
          order5Pool.appendChild(btn);
        });
        order5CheckBtn.disabled = st.pool.length > 0;
        centerOrderLetters(order5AnswerGrid ? [order5Grid, order5AnswerGrid, order5Pool] : [order5Grid, order5Pool]);
      }

      function order5Place(i) {
        var st = order5State;
        if (!st || st.solved) return;
        var current = st.slots[i];
        if (st.armedId) {
          if (current) { st.pool.push(current); }
          st.slots[i] = st.armedId;
          st.pool = st.pool.filter(function (id) { return id !== st.armedId; });
          st.armedId = null;
        } else if (current) {
          st.slots[i] = null;
          st.pool.push(current);
        } else {
          return;
        }
        st.marks = null;
        order5Feedback.hidden = true;
        renderOrder5();
      }

      function order5Check() {
        var st = order5State;
        if (!st || st.pool.length || st.solved) return;
        var good = 0;
        st.marks = st.slots.map(function (id, i) {
          var ok = id === st.ids[i];
          if (ok) { good += 1; }
          return ok;
        });
        var allGood = good === st.ids.length;
        // 1 point par lettre bien placee a la PREMIERE verification de la
        // manche (5 lettres x 3 manches = 15 points) ; les corrections
        // ulterieures ne rapportent rien.
        if (st.attempts === 0) { st.score += good; }
        playResultFx(allGood);
        order5Feedback.hidden = false;
        order5Feedback.className = "game-feedback " + (allGood ? "is-correct" : "is-wrong");
        if (allGood) {
          st.solved = true;
          order5Feedback.textContent = st.attempts === 0 ? ORDER5_TXT.done : ORDER5_TXT.doneLate;
          order5CheckBtn.hidden = true;
          order5RevealBtn.hidden = true;
          order5NextBtn.textContent = st.idx + 1 >= ORDER5_ROUNDS ? ORDER5_TXT.result : ORDER5_TXT.next;
          order5NextBtn.hidden = false;
          // Apres une courte pause (pour voir la reussite), on passe tout
          // seul a la manche suivante ; le bouton permet de ne pas attendre.
          clearOrder5Timer();
          order5AutoTimer = setTimeout(function () { order5AutoTimer = null; order5Next(); }, ORDER5_AUTO_NEXT_MS);
        } else {
          st.attempts += 1;
          order5Feedback.textContent = order5Fill(ORDER5_TXT.partial, good, ORDER5_SIZE);
          // Apres 2 verifications ratees : possibilite de voir la correction
          // et de passer a la suite (sans point de plus).
          order5RevealBtn.hidden = st.attempts < 2;
        }
        renderOrder5();
      }

      // Affiche la bonne reponse (apres 2 essais rates) ; on passe a la suite
      // avec le bouton, sans avance automatique : le temps de la lire.
      function order5Reveal() {
        var st = order5State;
        if (!st || st.solved) return;
        // On GARDE la combinaison du joueur (cases justes en vert, fausses en
        // rouge) et on affiche la bonne reponse en dessous, pour comparer.
        st.marks = st.slots.map(function (id, i) { return id === st.ids[i]; });
        st.armedId = null;
        st.revealed = true;
        st.solved = true;
        clearOrder5Timer();
        buildOrder5Compare();
        order5Feedback.hidden = false;
        order5Feedback.className = "game-feedback is-correct";
        order5Feedback.textContent = ORDER5_TXT.revealMsg;
        order5CheckBtn.hidden = true;
        order5RevealBtn.hidden = true;
        order5NextBtn.textContent = st.idx + 1 >= ORDER5_ROUNDS ? ORDER5_TXT.result : ORDER5_TXT.next;
        order5NextBtn.hidden = false;
        renderOrder5();
      }

      function order5Next() {
        clearOrder5Timer();
        var st = order5State;
        if (!st || !st.solved) return;
        st.idx += 1;
        if (st.idx >= ORDER5_ROUNDS) {
          var maxScore = ORDER5_ROUNDS * ORDER5_SIZE;
          var pct = Math.round(st.score / maxScore * 100);
          showGameEnd({
            scoreText: st.score + " / " + maxScore,
            pct: pct,
            message: pct >= 80 ? ORDER5_TXT.great : pct >= 50 ? ORDER5_TXT.ok : ORDER5_TXT.low,
            onReplay: function () { startOrder5Game(menuTitle); },
            back: true
          });
          return;
        }
        order5StartRound();
      }

      function startOrder5Game(title) {
        clearOrder5Timer();
        clearOrder5Compare();
        menuTitle = title;
        gameModalTitle.textContent = title;
        gamePrestartWarning.hidden = true;
        gameMenuScreen.hidden = true;
        gameEnd.hidden = true;
        gameBody.hidden = false;
        gameLevelInfo.textContent = "";
        gameScoreEl.textContent = "";
        gameBackToMenuBtn.hidden = false;
        hideAllGamePanels();
        gameOrder5Panel.hidden = false;
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        order5State = { starts: order5PickStarts(), idx: 0, score: 0, ids: [], slots: [], pool: [], armedId: null, marks: null, attempts: 0, solved: false };
        order5StartRound();
        if (document.fonts && document.fonts.load) {
          document.fonts.load("24px 'Amiri Quran'", "أب").then(function () {
            if (order5State && !gameOrder5Panel.hidden) { renderOrder5(); }
          });
        }
      }

      // "Puzzle" (Module 16, jeu libre) : on entend un mot, puis on choisit sa
      // bonne ecriture parmi 4 propositions (1 bonne + 3 fausses). Les fausses
      // gardent les bonnes lettres mais cassent une ou deux liaisons : un madd
      // non attache alors qu'il devrait l'etre, une lettre attachee "par
      // derriere", toutes les lettres isolees... Serie de 5 mots.
      var PUZZLE_ROUNDS = 5;
      var PUZZLE_TXT = {
        fr: { listen: "🔊 Écouter le mot", again: "🔊 Réécouter", ok: "Bravo, c’est la bonne écriture !", ko: "Pas tout à fait — voici la bonne écriture.", legend: "Chaque lettre prend sa forme selon ses voisines :", next: "Mot suivant →", result: "Voir mon résultat →", great: "Excellent, tu reconnais très bien l’écriture des mots !", mid: "Bien joué ! Encore un peu d’entraînement et ce sera parfait.", low: "Continue de t’entraîner : observe bien comment les lettres se lient, puis reviens jouer.", forms: { isolated: "isolée", initial: "début", medial: "milieu", final: "fin" } },
        en: { listen: "🔊 Listen to the word", again: "🔊 Listen again", ok: "Well done, that is the correct spelling!", ko: "Not quite — here is the correct spelling.", legend: "Each letter takes its shape from its neighbours:", next: "Next word →", result: "See my result →", great: "Excellent, you recognise how words are written very well!", mid: "Well played! A little more practice and it will be perfect.", low: "Keep practising: look closely at how the letters join, then come back and play.", forms: { isolated: "isolated", initial: "initial", medial: "medial", final: "final" } },
        ru: { listen: "🔊 Послушать слово", again: "🔊 Послушать ещё раз", ok: "Верно, это правильное написание!", ko: "Не совсем — вот правильное написание.", legend: "Каждая буква меняет форму в зависимости от соседей:", next: "Следующее слово →", result: "Посмотреть результат →", great: "Отлично, ты очень хорошо знаешь, как пишутся слова!", mid: "Хорошо сыграно! Ещё немного практики, и будет идеально.", low: "Продолжай тренироваться: внимательно смотри, как соединяются буквы, и возвращайся играть.", forms: { isolated: "отдельная", initial: "в начале", medial: "в середине", final: "в конце" } },
        de: { listen: "🔊 Wort anhören", again: "🔊 Nochmal anhören", ok: "Richtig, das ist die richtige Schreibweise!", ko: "Nicht ganz — hier ist die richtige Schreibweise.", legend: "Jeder Buchstabe nimmt seine Form je nach Nachbarn an:", next: "Nächstes Wort →", result: "Ergebnis ansehen →", great: "Ausgezeichnet, du erkennst die Schreibweise der Wörter sehr gut!", mid: "Gut gespielt! Noch etwas Übung und es wird perfekt.", low: "Übe weiter: Achte genau darauf, wie sich die Buchstaben verbinden, und komm dann zurück zum Spielen.", forms: { isolated: "einzeln", initial: "Anfang", medial: "Mitte", final: "Ende" } },
        ar: { listen: "🔊 استمع إلى الكلمة", again: "🔊 استمع مرة أخرى", ok: "أحسنت، هذه هي الكتابة الصحيحة!", ko: "ليس تمامًا — هذه هي الكتابة الصحيحة.", legend: "يتخذ كل حرف شكله بحسب جاره:", next: "الكلمة التالية ←", result: "عرض النتيجة ←", great: "ممتاز، أنت تعرف كتابة الكلمات جيدًا جدًا!", mid: "لعبٌ جيد! قليل من التدريب وسيكون الأداء مثاليًا.", low: "واصل التدرّب: لاحظ جيدًا كيف تتصل الحروف ثم عد للعب.", forms: { isolated: "منفصل", initial: "أول", medial: "وسط", final: "آخر" } }
      }[ORDER_LANG];
      // Lettres arabes de base gerees (ni hamza sur ligne, ni ta marbouta, ni alif maqsura...).
      var PUZZLE_CONNECTS = "بتثجحخسشصضطظعغفقكلمنهي";                        // se lient a la lettre suivante
      var PUZZLE_NO_CONNECT = "اأإآدذرزو";                                   // ne se lient pas a la suivante
      var PUZZLE_MARK = /[ً-ْٰ]/;
      var PUZZLE_ZWJ = "‍";
      var PUZZLE_ZWNJ = "‌";
      var puzzleState = null;
      var puzzleWordCache = null;

      function puzzleConnects(ch) { return PUZZLE_CONNECTS.indexOf(ch) !== -1; }

      // "خَرَجَ" -> [{ ch: "خ", marks: "َ" }, ...]
      function puzzleClusters(text) {
        var out = [];
        text.split("").forEach(function (c) {
          if (PUZZLE_MARK.test(c) && out.length) { out[out.length - 1].marks += c; } else { out.push({ ch: c, marks: "" }); }
        });
        return out;
      }

      // Mots reels du site avec enregistrement, dont toutes les lettres sont gerees
      // et sans lam-alif (ligature qu'un caractere de jonction casserait).
      function puzzleWords() {
        if (puzzleWordCache) return puzzleWordCache;
        function ok(arabic) {
          var bare = arabic.replace(/[ً-ْٰ]/g, "");
          if (!bare || /\s/.test(bare)) return false;
          if (/ل[اأإآ]/.test(bare)) return false;
          return bare.split("").every(function (c) { return PUZZLE_CONNECTS.indexOf(c) !== -1 || PUZZLE_NO_CONNECT.indexOf(c) !== -1; }) && bare.length >= 3;
        }
        function from(list, folder) {
          return list.filter(function (w) { return w.audioId && w.arabic && ok(w.arabic); }).map(function (w) {
            return { key: folder + ":" + w.id, arabic: w.arabic, audio: ROOT_BASE + "assets/audio/" + folder + "/" + w.audioId + ".m4a?v=" + AUDIO_VERSION };
          });
        }
        puzzleWordCache = from(WORDS, "words").concat(from(WORDS_REAL, "mots-reels"));
        return puzzleWordCache;
      }

      function puzzleCorrectFlags(cl) {
        return cl.map(function (c, i) {
          return { pre: i > 0 && puzzleConnects(cl[i - 1].ch), post: i < cl.length - 1 && puzzleConnects(c.ch) };
        });
      }
      function puzzleCorrectForms(cl) {
        return puzzleCorrectFlags(cl).map(function (f) { return f.pre && f.post ? "medial" : f.pre ? "final" : f.post ? "initial" : "isolated"; });
      }
      function puzzleRender(cl, flags, spaced) {
        return cl.map(function (c, i) {
          return (flags[i].pre ? PUZZLE_ZWJ : PUZZLE_ZWNJ) + c.ch + c.marks + (flags[i].post ? PUZZLE_ZWJ : PUZZLE_ZWNJ);
        }).join(spaced ? " " : "");
      }
      // signature visuelle : une lettre qui ne se lie jamais vers l'avant n'a pas de "post"
      function puzzleSignature(cl, flags) {
        return cl.map(function (c, i) { return (flags[i].pre ? "1" : "0") + (puzzleConnects(c.ch) && flags[i].post ? "1" : "0"); }).join("");
      }

      // 3 fausses propositions bien differentes entre elles et de la bonne : on part de la
      // bonne ecriture et on "casse" une ou deux liaisons (coupee la ou elle devrait
      // exister, ou ajoutee "par derriere"), avec une preference pour un madd non attache.
      function puzzleWrongVariants(cl, good) {
        var flips = [];
        cl.forEach(function (c, i) {
          flips.push({ i: i, k: "pre" });
          if (puzzleConnects(c.ch)) { flips.push({ i: i, k: "post" }); }
        });
        var cands = [];
        var seen = {};
        seen[puzzleSignature(cl, good)] = true;
        function applied(set) {
          var f = good.map(function (x) { return { pre: x.pre, post: x.post }; });
          set.forEach(function (st) { f[st.i][st.k] = !f[st.i][st.k]; });
          return f;
        }
        function add(flags, weight) {
          var sg = puzzleSignature(cl, flags);
          if (seen[sg]) return;
          seen[sg] = true;
          cands.push({ flags: flags, sig: sg, weight: weight });
        }
        flips.forEach(function (st) { add(applied([st]), 2); });
        for (var x = 0; x < flips.length; x++) {
          for (var y = x + 1; y < flips.length; y++) { add(applied([flips[x], flips[y]]), 1); }
        }
        cands.forEach(function (c) {
          cl.forEach(function (cc, i) { if (/[اوي]/.test(cc.ch) && i > 0 && good[i].pre && !c.flags[i].pre) { c.weight += 3; } });
        });
        function dist(a, b) { var d = 0; for (var q = 0; q < a.length; q++) { if (a.charAt(q) !== b.charAt(q)) { d++; } } return d; }
        var picks = [];
        var chosen = [puzzleSignature(cl, good)];
        var pool = cands.slice();
        while (picks.length < 3 && pool.length) {
          var far = pool.filter(function (c) {
            return Math.min.apply(null, chosen.map(function (sg) { return dist(c.sig, sg); })) >= 2;
          });
          var from = far.length ? far : pool;
          var total = from.reduce(function (sum, c) { return sum + c.weight; }, 0);
          var r = Math.random() * total;
          var k = 0;
          for (; k < from.length - 1; k++) { r -= from[k].weight; if (r <= 0) break; }
          var pick = from[k];
          pool.splice(pool.indexOf(pick), 1);
          chosen.push(pick.sig);
          picks.push(puzzleRender(cl, pick.flags, false));
        }
        // de temps en temps, toutes les lettres isolees et espacees
        if (picks.length && Math.random() < 0.3) {
          picks[Math.floor(Math.random() * picks.length)] = puzzleRender(cl, cl.map(function () { return { pre: false, post: false }; }), true);
        }
        return picks;
      }

      function puzzlePlay() {
        var st = puzzleState;
        if (!st || !st.current) return;
        if (gameAudio) { gameAudio.pause(); }
        gameAudio = new Audio(st.current.word.audio);
        gameAudio.play().catch(function () {});
        puzzleListenBtn.textContent = PUZZLE_TXT.again;
      }

      function puzzleRenderProgress() {
        var st = puzzleState;
        progressReset();
        progressLabel(PROGRESS_UNIT.word + " " + Math.min(st.idx + 1, PUZZLE_ROUNDS) + " / " + PUZZLE_ROUNDS);
        var dots = document.createElement("span");
        dots.className = "game-progress-dots";
        dots.setAttribute("aria-hidden", "true");
        for (var i = 0; i < PUZZLE_ROUNDS; i++) {
          var dot = document.createElement("i");
          var r = st.results[i];
          dot.className = r === true ? "is-right" : r === false ? "is-wrong" : i === st.idx ? "is-current" : "";
          dots.appendChild(dot);
        }
        gameScoreEl.appendChild(dots);
        var score = document.createElement("span");
        score.className = "game-progress-score";
        score.textContent = "✓ " + st.score;
        gameScoreEl.appendChild(score);
      }

      function puzzleStartRound(autoPlay) {
        var st = puzzleState;
        var word = st.words[st.idx];
        var cl = puzzleClusters(word.arabic);
        var good = puzzleCorrectFlags(cl);
        var opts = shuffleArray([{ text: word.arabic, ok: true }].concat(puzzleWrongVariants(cl, good).map(function (t) { return { text: t, ok: false }; })));
        st.current = { word: word, cl: cl, opts: opts, answered: false };
        puzzleOpts.innerHTML = "";
        opts.forEach(function (o) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "puzzle-opt";
          btn.textContent = o.text;
          btn.addEventListener("click", function () { puzzleAnswer(o, btn); });
          o.el = btn;
          puzzleOpts.appendChild(btn);
        });
        puzzleFeedback.hidden = true;
        puzzleFeedback.className = "game-feedback";
        puzzleFeedback.textContent = "";
        puzzleLegend.hidden = true;
        puzzleLegend.innerHTML = "";
        puzzleNextBtn.hidden = true;
        puzzleListenBtn.textContent = PUZZLE_TXT.listen;
        puzzleRenderProgress();
        if (autoPlay) { puzzlePlay(); }
      }

      function puzzleAnswer(o, btn) {
        var st = puzzleState;
        var cur = st && st.current;
        if (!cur || cur.answered) return;
        cur.answered = true;
        st.results[st.idx] = o.ok;
        if (o.ok) { st.score += 1; }
        playResultFx(o.ok);
        cur.opts.forEach(function (x) { x.el.disabled = true; if (x.ok) { x.el.classList.add("is-correct"); } });
        if (!o.ok) { btn.classList.add("is-wrong"); }
        puzzleFeedback.hidden = false;
        puzzleFeedback.className = "game-feedback " + (o.ok ? "is-correct" : "is-wrong");
        puzzleFeedback.textContent = o.ok ? PUZZLE_TXT.ok : PUZZLE_TXT.ko;
        // forme de chaque lettre dans le mot
        var forms = puzzleCorrectForms(cur.cl);
        puzzleLegend.innerHTML = "";
        var intro = document.createElement("span");
        intro.className = "puzzle-legend-intro";
        intro.textContent = PUZZLE_TXT.legend;
        puzzleLegend.appendChild(intro);
        var tags = document.createElement("span");
        tags.className = "puzzle-legend-tags";
        cur.cl.forEach(function (c, i) {
          var tag = document.createElement("span");
          tag.className = "puzzle-tag puzzle-tag-" + forms[i];
          var letter = document.createElement("span");
          letter.className = "puzzle-tag-letter";
          letter.setAttribute("lang", "ar");
          letter.textContent = c.ch;
          tag.appendChild(letter);
          tag.appendChild(document.createTextNode(" " + PUZZLE_TXT.forms[forms[i]]));
          tags.appendChild(tag);
        });
        puzzleLegend.appendChild(tags);
        puzzleLegend.hidden = false;
        puzzleNextBtn.textContent = st.idx + 1 >= PUZZLE_ROUNDS ? PUZZLE_TXT.result : PUZZLE_TXT.next;
        puzzleNextBtn.hidden = false;
        puzzleRenderProgress();
      }

      function puzzleNext() {
        var st = puzzleState;
        if (!st || !st.current || !st.current.answered) return;
        st.idx += 1;
        if (st.idx >= PUZZLE_ROUNDS) {
          if (gameAudio) { gameAudio.pause(); }
          var pct = Math.round(st.score / PUZZLE_ROUNDS * 100);
          showGameEnd({
            scoreText: st.score + " / " + PUZZLE_ROUNDS,
            pct: pct,
            message: pct >= 80 ? PUZZLE_TXT.great : pct >= 50 ? PUZZLE_TXT.mid : PUZZLE_TXT.low,
            onReplay: function () { startPuzzleGame(menuTitle); },
            back: false
          });
          return;
        }
        // le clic sur "suivant" est un geste du joueur : le mot se lance tout seul
        puzzleStartRound(true);
      }

      function startPuzzleGame(title) {
        var words = shuffleArray(puzzleWords()).slice(0, PUZZLE_ROUNDS);
        if (words.length < PUZZLE_ROUNDS) return;
        menuTitle = title;
        gameModalTitle.textContent = title;
        gamePrestartWarning.hidden = true;
        gameMenuScreen.hidden = true;
        gameEnd.hidden = true;
        gameBody.hidden = false;
        gameLevelInfo.textContent = "";
        gameScoreEl.textContent = "";
        gameBackToMenuBtn.hidden = true;
        hideAllGamePanels();
        gamePuzzlePanel.hidden = false;
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        puzzleState = { words: words, idx: 0, results: [], score: 0, current: null };
        puzzleStartRound(false);
      }

      // "Retrouve le son dans le tableau" (Module 15, jeu libre chronometre) :
      // on entend un son (lettre + voyelle, madd ou tanwin, deja enregistre
      // pour les fascicules 1 a 3) et on touche, dans le tableau recapitulatif
      // du fascicule, la case qui correspond avant la fin du compte a rebours
      // (12 / 8 / 4 secondes selon la difficulte). 15 sons par partie.
      var SOUND_ROUNDS = 15;
      // Temps par son : tableaux de 4 lettres (12 / 8 / 4 s) ; toutes les
      // lettres (28), tableau plus grand a parcourir
      // (20 / 14 / 8 s).
      var SOUND_SECONDS = { easy: 12, medium: 8, hard: 4 };
      var SOUND_SECONDS_FULL = { easy: 20, medium: 14, hard: 8 };
      var SOUND_LEVEL_NAMES = {
        fr: ["Facile", "Intermédiaire", "Difficile", "s"],
        en: ["Easy", "Medium", "Hard", "s"],
        ru: ["Лёгкий", "Средний", "Сложный", "с"],
        de: ["Leicht", "Mittel", "Schwer", "s"],
        ar: ["سهل", "متوسط", "صعب", "ث"]
      }[ORDER_LANG];
      function soundIsFull(table) { return String(table).charAt(0) !== "g"; }
      function soundSecondsFor(table) { return soundIsFull(table) ? SOUND_SECONDS_FULL : SOUND_SECONDS; }
      var SOUND_KINDS = ["harakat", "moudoud", "tanwin"];
      var SOUND_HEAD_GROUPS = ["الحَرَكَاتُ", "المُدُودُ", "التَّنْوِينُ"];
      var SOUND_HEAD_FORMS = ["الفَتْحَةُ", "الضَّمَّةُ", "الكَسْرَةُ"];
      var SOUND_HEAD_LETTER = "الحُرُوفُ الهِجَائِيَّةُ";
      var SOUND_TXT = {
        fr: { correct: "Bravo !", wrong: "Raté — la bonne case est en vert.", timeout: "Temps écoulé ! La bonne case est en vert.", next: "Son suivant →", result: "Voir mon résultat →", progress: "Son {n} / {t}", score: "Score : {n}", listen: "🔊 Réécouter", quit: "Réglages", endScore: "Tu as trouvé {n} sons sur {t}.", great: "Excellent, tu reconnais très bien les sons !", ok: "Bien joué ! Encore un peu d’entraînement et ce sera parfait.", low: "Continue de t’entraîner : écoute les lettres dans le labo, puis reviens jouer." },
        en: { correct: "Well done!", wrong: "Missed — the right box is in green.", timeout: "Time’s up! The right box is in green.", next: "Next sound →", result: "See my result →", progress: "Sound {n} / {t}", score: "Score: {n}", listen: "🔊 Listen again", quit: "Settings", endScore: "You found {n} sounds out of {t}.", great: "Excellent, you recognise the sounds very well!", ok: "Well played! A little more practice and it will be perfect.", low: "Keep practising: listen to the letters in the lab, then come back and play." },
        ru: { correct: "Молодец!", wrong: "Неверно — правильная клетка выделена зелёным.", timeout: "Время вышло! Правильная клетка выделена зелёным.", next: "Следующий звук →", result: "Посмотреть результат →", progress: "Звук {n} / {t}", score: "Баллы: {n}", listen: "🔊 Послушать ещё раз", quit: "Настройки", endScore: "Ты угадал(а) {n} звуков из {t}.", great: "Отлично, ты очень хорошо узнаёшь звуки!", ok: "Хорошо сыграно! Ещё немного практики, и будет идеально.", low: "Продолжай тренироваться: послушай буквы в лаборатории и возвращайся играть." },
        de: { correct: "Bravo!", wrong: "Daneben – das richtige Feld ist grün.", timeout: "Zeit abgelaufen! Das richtige Feld ist grün.", next: "Nächster Laut →", result: "Ergebnis ansehen →", progress: "Laut {n} / {t}", score: "Punkte: {n}", listen: "🔊 Nochmal hören", quit: "Einstellungen", endScore: "Du hast {n} von {t} Lauten gefunden.", great: "Ausgezeichnet, du erkennst die Laute sehr gut!", ok: "Gut gespielt! Noch etwas Übung und es wird perfekt.", low: "Übe weiter: Höre dir die Buchstaben im Labor an und komm dann zurück zum Spielen." },
        ar: { correct: "أحسنت!", wrong: "إجابة خاطئة — المربع الصحيح باللون الأخضر.", timeout: "انتهى الوقت! المربع الصحيح باللون الأخضر.", next: "الصوت التالي ←", result: "عرض النتيجة ←", progress: "الصوت {n} / {t}", score: "النتيجة: {n}", listen: "🔊 أعد الاستماع", quit: "الإعدادات", endScore: "وجدتَ {n} أصواتًا من أصل {t}.", great: "ممتاز، أنت تميّز الأصوات جيدًا جدًا!", ok: "لعبٌ جيد! قليل من التدريب وسيكون الأداء مثاليًا.", low: "واصل التدرّب: استمع إلى الحروف في المختبر ثم عد للعب." }
      }[ORDER_LANG];
      var soundChoice = { table: "g1", level: "easy" };
      var soundState = null;
      var soundTimerId = null;
      var soundStartFallbackId = null;
      var soundAudioEl = null;

      function soundFill(text, n, t) {
        return text.replace("{n}", n).replace("{t}", t);
      }

      // Un tableau = 4 lettres, dans l'ordre de l'alphabet :
      // g1 = أ ب ت ث, g2 = ج ح خ د, ... g7 = ن ه و ي.
      var SOUND_GROUP_SIZE = 4;
      function soundLetters(table) {
        var t = String(table);
        var all = LETTERS_F1.concat(LETTERS_F2, LETTERS_F3);
        if (t === "all") return all;
        var g = parseInt(t.replace("g", ""), 10) || 1;
        return all.slice((g - 1) * SOUND_GROUP_SIZE, g * SOUND_GROUP_SIZE);
      }

      function soundStopTimer() {
        if (soundTimerId) { clearInterval(soundTimerId); soundTimerId = null; }
        if (soundStartFallbackId) { clearTimeout(soundStartFallbackId); soundStartFallbackId = null; }
      }

      function soundStop() {
        soundStopTimer();
        if (soundAudioEl) { soundAudioEl.pause(); soundAudioEl = null; }
        soundState = null;
      }

      function soundShow(which) {
        // En partie, le panneau prend toute la hauteur/largeur utile pour que
        // le tableau tienne a l'ecran sans defilement (voir .is-sound-play).
        gameBody.classList.toggle("is-sound-play", which === "play");
        if (which !== "play") { gameBody.classList.remove("is-sound-long"); }
        soundSetup.hidden = which !== "setup";
        soundPlay.hidden = which !== "play";
        soundEnd.hidden = which !== "end";
      }

      function showSoundSetup() {
        soundStop();
        soundShow("setup");
        gameSoundPanel.querySelectorAll("[data-sound-table]").forEach(function (b) {
          var on = b.getAttribute("data-sound-table") === soundChoice.table;
          b.classList.toggle("is-selected", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var levelSecs = soundSecondsFor(soundChoice.table);
        var levelIdx = { easy: 0, medium: 1, hard: 2 };
        gameSoundPanel.querySelectorAll("[data-sound-level]").forEach(function (b) {
          var lv = b.getAttribute("data-sound-level");
          b.textContent = SOUND_LEVEL_NAMES[levelIdx[lv]] + " \u00b7 " + levelSecs[lv] + " " + SOUND_LEVEL_NAMES[3];
          var on = lv === soundChoice.level;
          b.classList.toggle("is-selected", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
      }

      function soundHead(text, cls, style) {
        var d = document.createElement("div");
        d.className = "sound-th " + cls;
        d.textContent = text;
        if (style) { Object.keys(style).forEach(function (k) { d.style[k] = style[k]; }); }
        return d;
      }

      function soundCellKey(letter, kind, i) {
        return letter.id + "|" + kind + "|" + i;
      }

      // Tableau recapitulatif (comme dans le cahier) : colonne des lettres a
      // droite, puis harakat / madd / tanwin (fatha, damma, kasra chacun).
      function buildSoundTable(letters) {
        soundTable.innerHTML = "";
        soundTable.appendChild(soundHead(SOUND_HEAD_LETTER, "sound-th-letter", { gridRow: "span 2" }));
        SOUND_HEAD_GROUPS.forEach(function (g, k) {
          soundTable.appendChild(soundHead(g, "sound-th-group sound-kind-" + SOUND_KINDS[k], { gridColumn: "span 3" }));
        });
        SOUND_KINDS.forEach(function (kind) {
          SOUND_HEAD_FORMS.forEach(function (f) {
            soundTable.appendChild(soundHead(f, "sound-th-form sound-kind-" + kind));
          });
        });
        letters.forEach(function (letter) {
          var l = document.createElement("div");
          l.className = "sound-letter" + (TAILED_LETTERS[letter.char] ? " sound-tailed" : "") + (letter.id === "alif" ? " sound-alif" : "");
          var ink = document.createElement("span");
          ink.className = "sound-letter-ink";
          ink.textContent = letter.char;
          l.appendChild(ink);
          soundTable.appendChild(l);
          SOUND_KINDS.forEach(function (kind) {
            for (var i = 0; i < 3; i++) {
              var btn = document.createElement("button");
              btn.type = "button";
              btn.className = "sound-cell sound-kind-" + kind + (TAILED_LETTERS[letter.char] ? " sound-tailed" : "") + (letter.id === "alif" ? " sound-alif" : "");
              btn.setAttribute("data-key", soundCellKey(letter, kind, i));
              renderSoundForm(btn, letter[kind][i][0]);
              btn.addEventListener("click", onSoundCell);
              soundTable.appendChild(btn);
            }
          });
        });
      }

      // Forme "lettre + une seule marque" (fatha, damma, kasra, tanwin) : la
      // police place elle-meme la marque par rapport a la lettre (jamais de
      // chevauchement ni de marque qui glisse dans la case voisine), ce qui
      // exige que lettre + marque restent dans UN SEUL noeud texte. Or une
      // couleur ne peut pas separer la marque de sa lettre dans ce cas : on
      // superpose donc deux copies exactement alignees --
      //   dessous : lettre + marque, en ROUGE ;
      //   dessus  : la lettre seule, en bleu fonce (avec un fin contour de la
      //             meme couleur pour couvrir le liseré rouge de l'anti-
      //             crenelage), qui masque le rouge de la lettre.
      // Seule la marque reste donc visible en rouge, a sa place naturelle.
      // Les formes avec prolongation (madd, tanwin fatha) gardent le degrade
      // rouge de renderLetterForm (deja un seul noeud texte).
      function renderSoundForm(container, text) {
        if (text.length !== 2 || !COMBINING_MARKS[text.charAt(1)]) {
          renderLetterForm(container, text, 1);
          return;
        }
        var wrap = document.createElement("span");
        // marque au-dessus (fatha, damma, tanwin) ou en dessous (kasra,
        // kasratan) : decale la forme pour que lettre + marque restent
        // centrees dans la case (le tanwin damma est la marque la plus haute).
        var markCode = text.charCodeAt(1);
        wrap.className = "sound-form " + (markCode === 0x064C ? "sound-form-above-tall"
          : (markCode === 0x0650 || markCode === 0x064D) ? "sound-form-below" : "sound-form-above");
        var full = document.createElement("span");
        full.className = "sound-form-full";
        full.textContent = text;
        var base = document.createElement("span");
        base.className = "sound-form-base";
        base.setAttribute("aria-hidden", "true");
        base.textContent = text.charAt(0);
        wrap.appendChild(full);
        wrap.appendChild(base);
        container.appendChild(wrap);
      }

      function soundCellByKey(key) {
        return soundTable.querySelector('[data-key="' + key + '"]');
      }

      function soundPlayCurrent() {
        var t = soundState && soundState.current;
        if (!t) return null;
        if (soundAudioEl) { soundAudioEl.pause(); }
        soundAudioEl = new Audio(ROOT_BASE + "assets/audio/fascicule-" + t.letter.fascicule + "/" + t.audioId + ".m4a?v=" + AUDIO_VERSION);
        soundAudioEl.play().catch(function () {});
        return soundAudioEl;
      }

      function soundUpdateTimer() {
        var st = soundState;
        if (!st) { soundStopTimer(); return; }
        var total = st.secs * 1000;
        var rem = Math.max(0, st.deadline - Date.now());
        var secsLeft = Math.ceil(rem / 1000);
        // bip a 3, 2 puis 1 seconde restante (le buzzer de fin sonne a 0)
        if (secsLeft >= 1 && secsLeft <= 3 && st.lastTick !== secsLeft) {
          st.lastTick = secsLeft;
          gameFx.tick();
        }
        soundTimerNum.textContent = String(secsLeft);
        soundTimerBar.style.width = (rem / total * 100) + "%";
        soundTimerBar.parentNode.classList.toggle("is-low", rem <= total * 0.5);
        soundTimerBar.parentNode.classList.toggle("is-critical", rem <= total * 0.25);
        if (rem <= 0) { soundFinishRound(null); }
      }

      function soundBeginTimer(roundIdx) {
        var st = soundState;
        if (!st || st.idx !== roundIdx || st.locked || st.timerOn) return;
        st.timerOn = true;
        st.lastTick = null;
        st.deadline = Date.now() + st.secs * 1000;
        gameFx.start();
        soundUpdateTimer();
        soundTimerId = setInterval(soundUpdateTimer, 100);
      }

      function soundStartRound() {
        var st = soundState;
        soundStopTimer();
        fxContext();
        st.current = st.rounds[st.idx];
        st.locked = false;
        st.timerOn = false;
        soundTable.querySelectorAll(".sound-cell").forEach(function (c) {
          c.classList.remove("is-correct", "is-wrong");
        });
        soundFeedback.textContent = "";
        soundFeedback.className = "game-feedback sound-feedback";
        soundNextBtn.hidden = true;
        soundProgress.textContent = soundFill(SOUND_TXT.progress, st.idx + 1, st.rounds.length);
        soundScore.textContent = soundFill(SOUND_TXT.score, st.score, st.rounds.length);
        var secs = st.secs;
        soundTimerNum.textContent = String(secs);
        soundTimerBar.style.width = "100%";
        soundTimerBar.parentNode.classList.remove("is-low", "is-critical");
        // Le compte a rebours demarre quand le son est reellement lance
        // (ou apres 0,8 s au plus tard) : un fichier lent a charger ne
        // doit pas manger le temps du joueur, surtout en mode difficile.
        var idx = st.idx;
        var audio = soundPlayCurrent();
        if (audio) { audio.addEventListener("playing", function () { soundBeginTimer(idx); }); }
        soundStartFallbackId = setTimeout(function () { soundBeginTimer(idx); }, 800);
      }

      function soundFinishRound(clickedKey) {
        var st = soundState;
        if (!st || st.locked) return;
        st.locked = true;
        soundStopTimer();
        var correctKey = st.current.key;
        var ok = clickedKey === correctKey;
        var correctCell = soundCellByKey(correctKey);
        correctCell.classList.add("is-correct");
        if (ok) {
          st.score += 1;
          gameFx.correct();
          soundFeedback.textContent = SOUND_TXT.correct;
        } else {
          if (clickedKey) { gameFx.wrong(); } else { gameFx.timeUp(); }
          if (clickedKey) { soundCellByKey(clickedKey).classList.add("is-wrong"); }
          soundFeedback.textContent = clickedKey ? SOUND_TXT.wrong : SOUND_TXT.timeout;
          if (correctCell.scrollIntoView) { correctCell.scrollIntoView({ block: "center", behavior: "smooth" }); }
        }
        soundFeedback.className = "game-feedback sound-feedback " + (ok ? "is-correct" : "is-wrong");
        soundScore.textContent = soundFill(SOUND_TXT.score, st.score, st.rounds.length);
        soundNextBtn.textContent = st.idx + 1 >= st.rounds.length ? SOUND_TXT.result : SOUND_TXT.next;
        soundNextBtn.hidden = false;
      }

      function onSoundCell(e) {
        var st = soundState;
        if (!st || st.locked) return;
        soundFinishRound(e.currentTarget.getAttribute("data-key"));
      }

      function soundNext() {
        var st = soundState;
        if (!st || !st.locked) return;
        st.idx += 1;
        if (st.idx >= st.rounds.length) {
          if (soundAudioEl) { soundAudioEl.pause(); }
          // Meme ecran de fin que les autres jeux (score colore, emoji,
          // confettis) : >= 80 % vert, 50-79 % orange, < 50 % rouge.
          var endPct = Math.round(st.score / st.rounds.length * 100);
          showGameEnd({
            scoreText: st.score + " / " + st.rounds.length,
            pct: endPct,
            message: endPct >= 80 ? SOUND_TXT.great : endPct >= 50 ? SOUND_TXT.ok : SOUND_TXT.low,
            onReplay: showSoundSetup,
            back: false
          });
          return;
        }
        soundStartRound();
      }

      function soundBeginGame() {
        var letters = soundLetters(soundChoice.table);
        var pool = [];
        letters.forEach(function (letter) {
          SOUND_KINDS.forEach(function (kind) {
            for (var i = 0; i < 3; i++) {
              pool.push({ letter: letter, audioId: letter[kind][i][1], key: soundCellKey(letter, kind, i) });
            }
          });
        });
        soundStop();
        soundState = {
          level: soundChoice.level,
          secs: soundSecondsFor(soundChoice.table)[soundChoice.level],
          rounds: shuffleArray(pool).slice(0, SOUND_ROUNDS),
          idx: 0,
          score: 0,
          current: null,
          locked: false,
          timerOn: false,
          deadline: 0
        };
        soundShow("play");
        // Plus de 4 lettres : lignes plus basses, le tableau se parcourt en defilant.
        gameBody.classList.toggle("is-sound-long", letters.length > SOUND_GROUP_SIZE);
        buildSoundTable(letters);
        gameBody.scrollTop = 0;
        soundStartRound();
        if (document.fonts && document.fonts.load) {
          document.fonts.load("24px 'Amiri Quran'", "بَ").then(function () {
            soundTable.querySelectorAll(".letterlab-form").forEach(function (w) {
              if (w.childNodes.length === 1 && w.firstChild.nodeType === 3) { colorizeProlongation(w, 1); }
            });
          });
        }
      }

      function startSoundGame(title) {
        menuTitle = title;
        gameModalTitle.textContent = title;
        gamePrestartWarning.hidden = true;
        gameMenuScreen.hidden = true;
        gameEnd.hidden = true;
        gameBody.hidden = false;
        gameLevelInfo.textContent = "";
        gameScoreEl.textContent = "";
        gameBackToMenuBtn.hidden = true;
        hideAllGamePanels();
        gameSoundPanel.hidden = false;
        gameModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        soundListenBtn.textContent = SOUND_TXT.listen;
        soundQuitBtn.textContent = SOUND_TXT.quit;
        showSoundSetup();
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
        gameBody.classList.remove("is-sound-play", "is-sound-long", "is-harakat-play", "is-harakat-answered");
        gameQuizPanel.hidden = true;
        gameReadPanel.hidden = true;
        gameDicteePanel.hidden = true;
        gameHarakatPanel.hidden = true;
        gameSortPanel.hidden = true;
        gameSortAllPanel.hidden = true;
        gameOrderPanel.hidden = true;
        gameSoundPanel.hidden = true;
        gameOrder5Panel.hidden = true;
        gamePuzzlePanel.hidden = true;
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
        gameMenuHeading.textContent = isGerman
          ? dictee1Level.titleDe + " — wähle: " + dictee1Level.unitDe
          : isArabic
          ? dictee1Level.titleAr + " — اختر: " + dictee1Level.unitAr
          : isRussian
          ? dictee1Level.titleRu + " — выбери: " + dictee1Level.unitRu.toLowerCase()
          : (isEnglish ? dictee1Level.titleEn : dictee1Level.titleFr) +
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
        if (gameAudio) { gameAudio.pause(); gameAudio = null; }
        dictee1SyncControls();

        var unit = isGerman ? dictee1Level.unitDe : isArabic ? dictee1Level.unitAr : isRussian ? dictee1Level.unitRu : isEnglish ? dictee1Level.unitEn : dictee1Level.unitFr;
        gameLevelInfo.textContent = unit + " " + (dictee1State.index + 1) + " / " + entries.length +
          (display ? " — " + display.header : "");
        gameScoreEl.textContent = "";

        gameDictee1Words.innerHTML = "";
        gameDictee1Words.hidden = true;
        gameDictee1ListenBtn.textContent = isGerman ? "🔊 Anhören" : isArabic ? "🔊 استماع" : isRussian ? "🔊 Слушать" : isEnglish ? "🔊 Listen" : "🔊 Écouter";
        gameDictee1RevealBtn.hidden = false;
        gameDictee1PrevBtn.hidden = dictee1State.index === 0;
        gameDictee1PrevBtn.textContent = isGerman ? "← Zurück" : isArabic ? "→ السابق" : isRussian ? "← Предыдущая " + unit.toLowerCase() : isEnglish ? "← Previous " + unit.toLowerCase() : "← " + unit + " précédente";
        gameDictee1NextBtn.textContent = dictee1State.index + 1 < entries.length
          ? (isGerman ? "Weiter →" : isArabic ? "التالي ←" : isRussian ? "Следующая " + unit.toLowerCase() + " →" : isEnglish ? "Next " + unit.toLowerCase() + " →" : unit + " suivante →")
          : (isGerman ? "Von vorn beginnen →" : isArabic ? "البدء من جديد ←" : isRussian ? "Начать сначала →" : isEnglish ? "Restart from the beginning →" : "Recommencer au début →");
      }

      function showDictee1Words() {
        var entry = dictee1State.current;
        gameDictee1Words.innerHTML = "";
        gameDictee1Words.classList.toggle("is-single", entry.items.length <= 1);
        entry.items.forEach(function (word, index) {
          var cell = document.createElement("span");
          cell.className = "dictee1-word-cell";
          var num = document.createElement("span");
          num.className = "dictee1-word-num";
          num.textContent = String(index + 1);
          cell.appendChild(num);
          var span = document.createElement("span");
          span.className = "dictee1-word";
          renderArabicText(span, stretchArabic(word));
          cell.appendChild(span);
          gameDictee1Words.appendChild(cell);
        });
        gameDictee1Words.hidden = false;
      }

      function closeGame() {
        gameModal.classList.remove("is-open");
        gameBackToMenuBtn.hidden = false;
        document.body.style.overflow = "";
        gamePrestartWarning.hidden = true;
        if (gameAudio) { gameAudio.pause(); }
        soundStop();
        gameBody.classList.remove("is-sound-play", "is-sound-long", "is-harakat-play", "is-harakat-answered");
        clearWordReveal();
        clearEndCelebration();
        endReplayHandler = null;
        gameEndBackToMenuBtn.hidden = false;
        clearOrder5Timer();
        if (sortAllEndTimer) { clearTimeout(sortAllEndTimer); sortAllEndTimer = null; }
        if (orderEndTimer) { clearTimeout(orderEndTimer); orderEndTimer = null; }
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
        gamePrestartMessage.textContent = isGerman
          ? "Du hast die empfohlenen 80 % in Modul " + prevModule + " noch nicht erreicht (dein bisher bestes Ergebnis: " + prevPct + " %). Wir empfehlen, es noch ein wenig zu üben, um es wirklich zu beherrschen, bevor du fortfährst."
          : isArabic
          ? "لم تصل بعد إلى نسبة 80% الموصى بها في الوحدة " + prevModule + " (أفضل نتيجة لك حتى الآن: " + prevPct + "%). ننصحك بالتدرب أكثر قليلًا لإتقانها قبل المتابعة."
          : isRussian
          ? "Ты ещё не достиг(ла) рекомендуемых 80% в модуле " + prevModule + " (твой лучший результат: " + prevPct + "%). Советуем ещё немного потренироваться, чтобы хорошо его освоить, прежде чем продолжать."
          : isEnglish
          ? "You haven't yet reached the 80% recommended on Module " + prevModule + " (your best score so far: " + prevPct + "%). We suggest practicing it a bit more to really master it before continuing."
          : "Tu n'as pas encore atteint les 80% recommandés sur le Module " + prevModule + " (ton meilleur score jusqu'ici : " + prevPct + "%). Nous te conseillons de t'entraîner encore un peu pour bien le maîtriser avant de continuer.";
        gamePrestartBackBtn.textContent = isGerman ? "← Zurück zu Modul " + prevModule : isArabic ? "→ العودة إلى الوحدة " + prevModule : isRussian ? "← Назад к модулю " + prevModule : isEnglish ? "← Back to Module " + prevModule : "← Retour au Module " + prevModule;
        gamePrestartBackBtn.disabled = !prevBtn;
        gamePrestartContinueBtn.textContent = isGerman
          ? "Trotzdem zu Modul " + moduleNumber + " →"
          : isArabic
          ? "المتابعة إلى الوحدة " + moduleNumber + " على أي حال ←"
          : isRussian
          ? "Всё равно перейти к модулю " + moduleNumber + " →"
          : isEnglish
          ? "Continue anyway to Module " + moduleNumber + " →"
          : "Accéder quand même au Module " + moduleNumber + " →";
        gameModalTitle.textContent = title;
        // Le rappel s'affiche SEUL : aucun jeu (ni celui du module precedent)
        // ne doit rester visible ou actif derriere lui. Le jeu du module N-1
        // ne s'ouvre qu'avec "Retour au Module N-1".
        if (gameAudio) { gameAudio.pause(); }
        soundStop();
        clearWordReveal();
        clearEndCelebration();
        endReplayHandler = null;
        clearOrder5Timer();
        if (sortAllEndTimer) { clearTimeout(sortAllEndTimer); sortAllEndTimer = null; }
        if (orderEndTimer) { clearTimeout(orderEndTimer); orderEndTimer = null; }
        hideAllGamePanels();
        gameMenuScreen.hidden = true;
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
        // "Retour au Module N-1" ouvre ce module comme si on avait touche sa
        // carte : s'il est lui-meme verrouille (80 % du module precedent non
        // atteints), on affiche d'abord son propre rappel, et ainsi de suite.
        var prevTitle = prevBtn.getAttribute("data-title");
        if (moduleUnlockState(String(prevModule)) === "locked") {
          openPrestartWarning(String(prevModule), prevTitle);
          return;
        }
        startGame(String(prevModule), prevTitle);
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
      document.querySelectorAll(".js-open-order-game").forEach(function (btn) {
        btn.addEventListener("click", function () {
          startOrderMenu(btn.getAttribute("data-title"));
        });
      });
      orderCheckBtn.addEventListener("click", checkOrderGame);
      orderResetBtn.addEventListener("click", resetOrderGame);
      orderRevealBtn.addEventListener("click", revealOrderTable);
      order5CheckBtn.addEventListener("click", order5Check);
      order5NextBtn.addEventListener("click", order5Next);
      order5RevealBtn.addEventListener("click", order5Reveal);
      document.querySelectorAll(".js-open-puzzle-game").forEach(function (btn) {
        btn.addEventListener("click", function () {
          startPuzzleGame(btn.getAttribute("data-title"));
        });
      });
      puzzleListenBtn.addEventListener("click", puzzlePlay);
      puzzleNextBtn.addEventListener("click", puzzleNext);
      document.querySelectorAll(".js-open-sound-game").forEach(function (btn) {
        btn.addEventListener("click", function () {
          startSoundGame(btn.getAttribute("data-title"));
        });
      });
      gameSoundPanel.querySelectorAll("[data-sound-table]").forEach(function (b) {
        b.addEventListener("click", function () {
          soundChoice.table = b.getAttribute("data-sound-table");
          showSoundSetup();
        });
      });
      gameSoundPanel.querySelectorAll("[data-sound-level]").forEach(function (b) {
        b.addEventListener("click", function () {
          soundChoice.level = b.getAttribute("data-sound-level");
          showSoundSetup();
        });
      });
      soundStartBtn.addEventListener("click", soundBeginGame);
      soundListenBtn.addEventListener("click", function () { if (soundState) { soundPlayCurrent(); } });
      soundNextBtn.addEventListener("click", soundNext);
      soundQuitBtn.addEventListener("click", showSoundSetup);
      soundAgainBtn.addEventListener("click", showSoundSetup);
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
        clearOrder5Timer();
        gameBody.hidden = true;
        gameMenuScreen.hidden = false;
      });
      gameEndBackToMenuBtn.addEventListener("click", function () {
        gameEnd.hidden = true;
        gameMenuScreen.hidden = false;
      });
      var LISTEN_AGAIN_LABEL = isGerman ? "🔊 Nochmal anhören" : isArabic ? "🔊 استمع مرة أخرى" : isRussian ? "🔊 Послушать ещё раз" : isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
      // Apres un bouton "suivant" (geste du joueur) : lance l'audio de la
      // nouvelle question sans passer par "Ecouter" (sauf si la serie est
      // terminee). Le bouton "Ecouter" reste visible, devenu "Reecouter".
      function autoPlayCurrent(listenBtn) {
        if (!gameState || !gameState.current || !gameEnd.hidden) return;
        playSound(gameState.current.correct);
        if (listenBtn) { listenBtn.textContent = LISTEN_AGAIN_LABEL; }
      }
      // ---- Barre de lecture des dictees (5 niveaux) : lecture, pause, stop,
      // recul / avance de 3 secondes, avec le temps ecoule. Elle agit sur
      // l'audio courant (gameAudio) ; l'entree n'est creee qu'au premier
      // appui sur "lecture".
      var DICTEE1_SKIP_SECONDS = 3;
      var DICTEE1_CTRL_TXT = {
        fr: { back: "Reculer de 3 secondes", play: "Lecture", pause: "Pause", stop: "Stop", fwd: "Avancer de 3 secondes", bar: "Contrôles audio" },
        en: { back: "Back 3 seconds", play: "Play", pause: "Pause", stop: "Stop", fwd: "Forward 3 seconds", bar: "Audio controls" },
        ru: { back: "Назад на 3 секунды", play: "Воспроизвести", pause: "Пауза", stop: "Стоп", fwd: "Вперёд на 3 секунды", bar: "Управление аудио" },
        de: { back: "3 Sekunden zurück", play: "Wiedergabe", pause: "Pause", stop: "Stopp", fwd: "3 Sekunden vor", bar: "Audio-Steuerung" },
        ar: { back: "رجوع 3 ثوانٍ", play: "تشغيل", pause: "إيقاف مؤقت", stop: "إيقاف", fwd: "تقديم 3 ثوانٍ", bar: "أزرار التحكم بالصوت" }
      };
      var D1T = isGerman ? DICTEE1_CTRL_TXT.de : isArabic ? DICTEE1_CTRL_TXT.ar : isRussian ? DICTEE1_CTRL_TXT.ru : isEnglish ? DICTEE1_CTRL_TXT.en : DICTEE1_CTRL_TXT.fr;
      var D1_ICONS = {
        back: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M11 6 4 12l7 6V6Zm9 0-7 6 7 6V6Z" fill="currentColor"/></svg>',
        play: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor"/></svg>',
        pause: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" fill="currentColor"/></svg>',
        stop: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>',
        fwd: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m13 6 7 6-7 6V6ZM4 6l7 6-7 6V6Z" fill="currentColor"/></svg>'
      };
      var d1Ctrl = null;
      function dictee1BuildControls() {
        var bar = document.createElement("div");
        bar.className = "audio-controls";
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", D1T.bar);
        function mk(kind, extra) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "audio-btn audio-btn-" + kind;
          b.setAttribute("aria-label", D1T[kind]);
          b.title = D1T[kind];
          b.innerHTML = (kind === "back" ? '<span class="audio-btn-sec">\u22123\u00a0s</span>' : "") + D1_ICONS[kind] + (kind === "fwd" ? '<span class="audio-btn-sec">+3\u00a0s</span>' : "");
          bar.appendChild(b);
          return b;
        }
        d1Ctrl = {
          bar: bar,
          back: mk("back"), play: mk("play"), pause: mk("pause"), stop: mk("stop"), fwd: mk("fwd"),
          time: document.createElement("p")
        };
        d1Ctrl.time.className = "audio-time";
        d1Ctrl.time.setAttribute("aria-live", "off");
        gameDictee1ListenBtn.parentNode.insertBefore(bar, gameDictee1RevealBtn);
        gameDictee1ListenBtn.parentNode.insertBefore(d1Ctrl.time, gameDictee1RevealBtn);

        d1Ctrl.play.addEventListener("click", function () {
          if (!dictee1State || !dictee1State.current) return;
          if (gameAudio && gameAudio.paused && !gameAudio.ended && gameAudio.currentTime > 0) {
            gameAudio.play().catch(function () {});
          } else {
            gameDictee1ListenBtn.click();
          }
        });
        d1Ctrl.pause.addEventListener("click", function () { if (gameAudio) { gameAudio.pause(); } });
        d1Ctrl.stop.addEventListener("click", function () {
          if (!gameAudio) return;
          gameAudio.pause();
          gameAudio.currentTime = 0;
          dictee1SyncControls();
        });
        d1Ctrl.back.addEventListener("click", function () {
          if (!gameAudio) return;
          gameAudio.currentTime = Math.max(0, gameAudio.currentTime - DICTEE1_SKIP_SECONDS);
          dictee1SyncControls();
        });
        d1Ctrl.fwd.addEventListener("click", function () {
          if (!gameAudio) return;
          var d = gameAudio.duration;
          var t = gameAudio.currentTime + DICTEE1_SKIP_SECONDS;
          gameAudio.currentTime = isFinite(d) ? Math.min(d, t) : t;
          dictee1SyncControls();
        });
        dictee1SyncControls();
      }
      function d1Fmt(sec) {
        sec = isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
        return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2);
      }
      function dictee1SyncControls() {
        if (!d1Ctrl) return;
        var a = gameAudio;
        var playing = !!a && !a.paused && !a.ended;
        d1Ctrl.play.disabled = playing;
        d1Ctrl.pause.disabled = !playing;
        d1Ctrl.stop.disabled = !a || (!playing && !(a.currentTime > 0));
        d1Ctrl.back.disabled = !a;
        d1Ctrl.fwd.disabled = !a;
        d1Ctrl.bar.classList.toggle("is-playing", playing);
        d1Ctrl.time.textContent = d1Fmt(a ? a.currentTime : 0) + " / " + d1Fmt(a ? a.duration : 0);
      }
      dictee1BuildControls();

      gameDictee1ListenBtn.addEventListener("click", function () {
        if (!dictee1State || !dictee1State.current) return;
        playSound({ audioBase: ROOT_BASE + "assets/audio/" + dictee1Level.audioFolder + "/", audioId: dictee1State.current.id });
        gameDictee1ListenBtn.textContent = isGerman ? "🔊 Nochmal anhören" : isArabic ? "🔊 استمع مرة أخرى" : isRussian ? "🔊 Послушать ещё раз" : isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
      });
      gameDictee1RevealBtn.addEventListener("click", function () {
        if (!dictee1State || !dictee1State.current) return;
        showDictee1Words();
        gameDictee1RevealBtn.hidden = true;
      });
      // Le bouton precedent est cache sur le premier element (voir
      // renderDictee1Letter) : pas besoin de boucler en arriere. Le
      // bouton suivant, lui, boucle sur les 28 lettres (recommence a
      // l'alif apres yaa) plutot que de forcer un ecran de fin : avec
      // le choix libre de la lettre (voir openDictee1LetterMenu), il
      // n'y a plus de "fin" naturelle de parcours a imposer.
      function autoPlayDictee1() {
        if (!dictee1State || !dictee1State.current) return;
        playSound({ audioBase: ROOT_BASE + "assets/audio/" + dictee1Level.audioFolder + "/", audioId: dictee1State.current.id });
        gameDictee1ListenBtn.textContent = LISTEN_AGAIN_LABEL;
      }
      gameDictee1PrevBtn.addEventListener("click", function () {
        if (!dictee1State || dictee1State.index === 0) return;
        dictee1State.index -= 1;
        renderDictee1Letter();
        autoPlayDictee1();
      });
      gameDictee1NextBtn.addEventListener("click", function () {
        if (!dictee1State) return;
        dictee1State.index = (dictee1State.index + 1) % dictee1Level.entries.length;
        renderDictee1Letter();
        autoPlayDictee1();
      });
      gamePlayBtn.addEventListener("click", onQuizListen);
      gameNextBtn.addEventListener("click", function () {
        nextQuestion();
        // "Reconnaitre le son" / "Reconnaitre le mot" : apres "Question
        // suivante", le son se lance tout seul (le clic compte comme geste
        // du joueur, donc Safari/iOS l'autorise) ; le bouton "Ecouter le son"
        // reste la pour reecouter. La 1re question de la serie, elle,
        // attend toujours l'appui.
        if (gameState && (gameState.category === "word" || gameState.category === "sound") &&
            gameEnd.hidden && gameState.current && !gameState.current.answered && !gameState.current.revealed) {
          onQuizListen();
        }
      });
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
        gameReadListenBtn.textContent = isGerman ? "🔊 Nochmal anhören" : isArabic ? "🔊 استمع مرة أخرى" : isRussian ? "🔊 Послушать ещё раз" : isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
        gameReadNextBtn.hidden = false;
      });
      gameReadNextBtn.addEventListener("click", nextQuestion);
      gameDicteeListenBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current) return;
        playSound(gameState.current.correct);
        gameDicteeListenBtn.textContent = isGerman ? "🔊 Nochmal anhören" : isArabic ? "🔊 استمع مرة أخرى" : isRussian ? "🔊 Послушать ещё раз" : isEnglish ? "🔊 Listen again" : "🔊 Réécouter";
      });
      gameDicteeRevealBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current) return;
        gameDicteeWord.hidden = false;
        gameDicteeRevealBtn.hidden = true;
        gameDicteeNextBtn.hidden = false;
      });
      gameDicteeNextBtn.addEventListener("click", function () {
        nextQuestion();
        // Dictee pure : le mot suivant se dicte tout seul.
        autoPlayCurrent(gameDicteeListenBtn);
      });
      gameHarakatListenBtn.addEventListener("click", function () {
        if (gameState && gameState.current) playSound(gameState.current.correct);
      });
      gameHarakatCheckBtn.addEventListener("click", function () {
        if (!gameState || !gameState.current || gameState.current.checked) return;
        gameState.current.checked = true;
        // apres la verification : on masque les voyelles a poser (desactivees) et la
        // consigne pour que le mot correct et "Mot suivant" restent visibles sans defiler
        gameBody.classList.add("is-harakat-answered");
        var allCorrect = true;
        gameState.current.slots.forEach(function (slot, idx) {
          var isRight = slot.filled === unitForm(slot.unitId);
          if (!isRight) allCorrect = false;
          harakatSlots.children[idx].classList.add(isRight ? "is-correct" : "is-wrong");
        });
        if (allCorrect) { gameState.score += 1; }
        gameState.results[gameState.questionIndex - 1] = allCorrect;
        playResultFx(allCorrect);

        Array.prototype.forEach.call(harakatPicker.children, function (b) { b.disabled = true; });
        gameHarakatCheckBtn.hidden = true;
        gameHarakatFeedback.hidden = false;
        gameHarakatFeedback.className = "game-feedback " + (allCorrect ? "is-correct" : "is-wrong");
        gameHarakatFeedback.textContent = allCorrect
          ? (isGerman ? "Richtig!" : isArabic ? "أحسنت!" : isRussian ? "Верно!" : isEnglish ? "Correct!" : "Bravo, c'est la bonne réponse !")
          : (isGerman ? "Nicht ganz — hier ist die richtige Antwort." : isArabic ? "ليس تمامًا — هذه هي الإجابة الصحيحة." : isRussian ? "Не совсем — вот правильный ответ." : isEnglish ? "Not quite — here is the right answer." : "Ce n'était pas ça — voici la bonne réponse.");
        gameHarakatCorrect.hidden = false;
        renderArabicText(gameHarakatCorrect, stretchArabic(gameState.current.correct.arabic));
        gameHarakatNextBtn.hidden = false;
        renderScore();
      });
      gameHarakatNextBtn.addEventListener("click", function () {
        nextQuestion();
        // Place les harakat : le mot suivant se lit tout seul.
        autoPlayCurrent(gameHarakatListenBtn);
      });
      gameReplayBtn.addEventListener("click", function () {
        if (endReplayHandler) {
          var replay = endReplayHandler;
          endReplayHandler = null;
          clearEndCelebration();
          gameEnd.hidden = true;
          gameBody.hidden = false;
          replay();
          return;
        }
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
