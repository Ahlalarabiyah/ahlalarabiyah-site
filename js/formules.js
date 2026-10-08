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
