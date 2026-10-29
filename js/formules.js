(function () {
  "use strict";

  // Liens de paiement Stripe : voir js/checkout-links.js (a renseigner la-bas).
  var CHECKOUT_LINKS = window.AHL_CHECKOUT_LINKS || {};

  // Textes affiches par le script, dans la langue de la page (fr par defaut).
  var LANG = (document.documentElement.lang || "fr").slice(0, 2);
  var TXT = {
    fr: {
      choose: "Choisis ta formule", allIn: "tous inclus", payAll: "Payer {p} \u00b7 tous les modules",
      chooseMore: "Choisis encore {n}", pay: "Payer {p} \u00b7 modules {m}",
      already: "Tu as d\u00e9j\u00e0 choisi {n} : retires-en un pour en changer.",
      shareText: "Rejoins-moi sur Ahl Al Arabiyah ! Avec mon code {c}, tu as 10% de r\u00e9duction sur ton premier achat.",
      copied: "Message copi\u00e9 : colle-le pour inviter ton ami.",
      mod: function (n) { return n + " " + (n > 1 ? "modules" : "module"); }
    },
    en: {
      choose: "Choose your plan", allIn: "all included", payAll: "Pay {p} \u00b7 all modules",
      chooseMore: "Choose {n} more", pay: "Pay {p} \u00b7 modules {m}",
      already: "You have already chosen {n}: remove one to change.",
      shareText: "Join me on Ahl Al Arabiyah! With my code {c}, you get 10% off your first purchase.",
      copied: "Message copied: paste it to invite your friend.",
      mod: function (n) { return n + " " + (n > 1 ? "modules" : "module"); }
    },
    ru: {
      choose: "Выбери тариф", allIn: "всё включено", payAll: "Оплатить {p} \u00b7 все модули",
      chooseMore: "Выбери ещё {n}", pay: "Оплатить {p} \u00b7 модули {m}",
      already: "Уже выбрано: {n}. Убери один, чтобы изменить выбор.",
      shareText: "Присоединяйся ко мне в Ahl Al Arabiyah! С моим кодом {c} ты получишь скидку 10% на первую покупку.",
      copied: "Сообщение скопировано: вставь его, чтобы пригласить друга.",
      mod: function (n) { var m10 = n % 10, m100 = n % 100; return n + " " + (m10 === 1 && m100 !== 11 ? "модуль" : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? "модуля" : "модулей")); }
    },
    de: {
      choose: "W\u00e4hle deinen Tarif", allIn: "alles inklusive", payAll: "{p} bezahlen \u00b7 alle Module",
      chooseMore: "W\u00e4hle noch {n}", pay: "{p} bezahlen \u00b7 Module {m}",
      already: "Du hast schon {n} gew\u00e4hlt: Entferne eines, um zu wechseln.",
      shareText: "Komm zu Ahl Al Arabiyah! Mit meinem Code {c} bekommst du 10 % Rabatt auf deinen ersten Kauf.",
      copied: "Nachricht kopiert: F\u00fcge sie ein, um deinen Freund einzuladen.",
      mod: function (n) { return n + " " + (n > 1 ? "Module" : "Modul"); }
    },
    ar: {
      choose: "اختر باقتك", allIn: "كل شيء مشمول", payAll: "ادفع {p} \u00b7 كل الوحدات",
      chooseMore: "اختر {n} أخرى", pay: "ادفع {p} \u00b7 الوحدات {m}",
      already: "لقد اخترت بالفعل {n}: أزل واحدة لتغيّر اختيارك.",
      shareText: "انضمّ إليّ في Ahl Al Arabiyah! برمزي {c} تحصل على خصم 10٪ على أول عملية شراء.",
      copied: "تم نسخ الرسالة: الصقها لدعوة صديقك.",
      mod: function (n) { return n === 1 ? "وحدة واحدة" : n === 2 ? "وحدتان" : n <= 10 ? n + " وحدات" : n + " وحدة"; }
    }
  };
  var T = TXT[LANG] || TXT.fr;

  // ---- Paiement par module : formule (1 / 3 / 6 / tous) puis choix des modules ----
  // La personne choisit d'abord sa formule, puis coche exactement ce nombre
  // de modules (modules 1 et 2 gratuits : on choisit parmi les modules 3 a 12).
  // Les modules choisis sont transmis au paiement Stripe via
  // client_reference_id ("modules-2-5-9" / "modules-all"), visible dans le
  // tableau de bord Stripe pour savoir quoi debloquer.
  var picker = document.getElementById("modulePicker");
  if (picker) {
    var PLANS = {
      "1": { key: "module-1", count: 1, price: "3,99\u00a0\u20ac", label: "1 module" },
      "3": { key: "module-3", count: 3, price: "9,99\u00a0\u20ac", label: "3 modules" },
      "6": { key: "module-6", count: 6, price: "19,99\u00a0\u20ac", label: "6 modules" },
      "12": { key: "module-12", count: 0, price: "29,99\u00a0\u20ac", label: "Tous les modules" }
    };
    var planBtns = picker.querySelectorAll("[data-module-plan]");
    var chipBtns = picker.querySelectorAll(".module-chip");
    var counterEl = document.getElementById("pickerCounter");
    var hintEl = document.getElementById("pickerHint");
    var payEl = document.getElementById("modulePay");
    var state = { plan: null, picked: [] };

    function fmt(str, vars) {
      return str.replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; });
    }

    function payHref(plan, picked) {
      var base = CHECKOUT_LINKS[plan.key];
      if (typeof base !== "string" || !/^https:\/\//.test(base)) return "";
      try {
        var u = new URL(base);
        u.searchParams.set("client_reference_id", plan.count ? "modules-" + picked.join("-") : "modules-all");
        return u.toString();
      } catch (e) { return ""; }
    }

    function renderPicker() {
      var plan = state.plan ? PLANS[state.plan] : null;
      var all = plan && plan.count === 0;
      planBtns.forEach(function (b) {
        var on = b.getAttribute("data-module-plan") === state.plan;
        b.classList.toggle("is-selected", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      var picked = all ? [] : state.picked.slice().sort(function (a, b) { return a - b; });
      chipBtns.forEach(function (c) {
        var n = Number(c.getAttribute("data-module"));
        var on = all || picked.indexOf(n) !== -1;
        c.classList.toggle("is-selected", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
        c.disabled = !plan || all;
      });
      if (!plan) {
        counterEl.textContent = "";
        hintEl.textContent = "";
        setPay(false, T.choose, "");
        return;
      }
      if (all) {
        counterEl.textContent = "\u2014 " + T.allIn;
        setPay(true, fmt(T.payAll, { p: plan.price }), payHref(plan, []));
        return;
      }
      counterEl.textContent = "\u2014 " + picked.length + " / " + plan.count;
      if (picked.length < plan.count) {
        var left = plan.count - picked.length;
        setPay(false, fmt(T.chooseMore, { n: T.mod(left) }), "");
      } else {
        setPay(true, fmt(T.pay, { p: plan.price, m: picked.join(", ") }), payHref(plan, picked));
      }
    }

    function setPay(ready, label, href) {
      payEl.textContent = label;
      payEl.classList.toggle("is-ready", ready);
      if (ready && href) {
        payEl.href = href;
        payEl.target = "_blank";
        payEl.rel = "noopener noreferrer";
        payEl.removeAttribute("aria-disabled");
      } else {
        payEl.removeAttribute("target");
        payEl.setAttribute("href", "#");
        payEl.setAttribute("aria-disabled", "true");
      }
    }

    payEl.addEventListener("click", function (e) {
      if (payEl.getAttribute("aria-disabled") === "true") { e.preventDefault(); }
    });

    planBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.plan = b.getAttribute("data-module-plan");
        var plan = PLANS[state.plan];
        if (plan.count === 0) { state.picked = []; }
        else if (state.picked.length > plan.count) { state.picked = state.picked.slice(-plan.count); }
        hintEl.textContent = "";
        renderPicker();
      });
    });

    chipBtns.forEach(function (c) {
      c.addEventListener("click", function () {
        var plan = state.plan ? PLANS[state.plan] : null;
        if (!plan || plan.count === 0) return;
        var n = Number(c.getAttribute("data-module"));
        var at = state.picked.indexOf(n);
        hintEl.textContent = "";
        if (at !== -1) {
          state.picked.splice(at, 1);
        } else if (plan.count === 1) {
          state.picked = [n];
        } else if (state.picked.length >= plan.count) {
          hintEl.textContent = fmt(T.already, { n: T.mod(plan.count) });
        } else {
          state.picked.push(n);
        }
        renderPicker();
      });
    });

    renderPicker();
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-plan]"), function (el) {
    var url = CHECKOUT_LINKS[el.getAttribute("data-plan")];
    if (typeof url === "string" && /^https:\/\//.test(url)) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    } else {
      el.setAttribute("role", "button");
      el.setAttribute("aria-disabled", "true");
      el.addEventListener("click", function (e) { e.preventDefault(); });
    }
  });

  // ---- Parrainage ----
  // Chaque utilisateur de l'application aura son propre code (ex. "moh123"). Le site n'a pas
  // encore de comptes : tant que l'application ne fournit pas le code ici, le bouton reste
  // inactif (comme les boutons de paiement sans lien). Une fois renseigne, "Partager mon
  // code" ouvre le partage du telephone (ou copie le message dans le presse-papiers).
  var REFERRAL_CODE = "";
  var shareBtn = document.getElementById("referralShare");
  var shareStatus = document.getElementById("referralStatus");
  if (shareBtn) {
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(REFERRAL_CODE)) {
      shareBtn.setAttribute("aria-disabled", "true");
      shareBtn.classList.add("is-inactive");
      shareBtn.addEventListener("click", function (e) { e.preventDefault(); });
    } else {
      shareBtn.addEventListener("click", function () {
        var text = fmt(T.shareText, { c: REFERRAL_CODE });
        var url = "https://ahlalarabiyah.com/";
        function done(msg) { if (shareStatus) { shareStatus.textContent = msg; } }
        if (navigator.share) {
          navigator.share({ title: "Ahl Al Arabiyah", text: text, url: url }).catch(function () {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text + " " + url).then(function () { done(T.copied); }, function () { done(text + " " + url); });
        } else {
          done(text + " " + url);
        }
      });
    }
  }
})();
