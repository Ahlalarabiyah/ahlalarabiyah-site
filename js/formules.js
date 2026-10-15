(function () {
  "use strict";

  // Liens de paiement Stripe (Payment Links), un par prix : collez ici
  // l'URL "https://buy.stripe.com/..." de chaque produit. Tant qu'un lien
  // est vide, le bouton correspondant reste inactif (aucun paiement).
  var CHECKOUT_LINKS = {
    "module-1": "",
    "module-3": "",
    "module-6": "",
    "module-12": "",
    "base-month": "",
    "base-year": "",
    "dictees-option-month": "",
    "dictees-option-once": "",
    "all-month": "",
    "all-year": "",
    "dictee-1": "",
    "dictee-2": "",
    "dictee-3": "",
    "dictee-4": "",
    "dictee-5": "",
    "dictee-pack": "",
    "lifetime": ""
  };

  // ---- Paiement par module : formule (1 / 3 / 6 / tous) puis choix des modules ----
  // La personne choisit d'abord sa formule, puis coche exactement ce nombre
  // de modules (Module 1 offert : on choisit parmi les modules 2 a 12).
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

    function plural(n, one, many) { return n + " " + (n > 1 ? many : one); }

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
        setPay(false, "Choisis ta formule", "");
        return;
      }
      if (all) {
        counterEl.textContent = "\u2014 tous inclus";
        setPay(true, "Payer " + plan.price + " \u00b7 tous les modules", payHref(plan, []));
        return;
      }
      counterEl.textContent = "\u2014 " + picked.length + " / " + plan.count;
      if (picked.length < plan.count) {
        var left = plan.count - picked.length;
        setPay(false, "Choisis encore " + plural(left, "module", "modules"), "");
      } else {
        setPay(true, "Payer " + plan.price + " \u00b7 modules " + picked.join(", "), payHref(plan, picked));
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
          hintEl.textContent = "Tu as d\u00e9j\u00e0 choisi " + plural(plan.count, "module", "modules") + " : retires-en un pour en changer.";
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
})();
