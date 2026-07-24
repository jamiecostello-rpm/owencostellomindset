/* Owen Costello — interactions
   Plain, commented, hand-editable. Three jobs: smooth scroll, scroll reveals,
   and opening the Calendly popup from any "book a call" button. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Current year in the footer ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. Header shadow/blur once you scroll past the top ---------- */
  var header = document.querySelector("[data-header]");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 12) header.setAttribute("data-scrolled", "");
    else header.removeAttribute("data-scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- 3. Mobile menu ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-mobile-menu]");
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ---------- 4. Smooth scrolling (Lenis if available) ---------- */
  var lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Anchor links scroll smoothly and account for the fixed header.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) {
        lenis.scrollTo(target, { offset: -70 });
      } else {
        var y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });

  /* ---------- 5. Scroll reveals (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. Gentle parallax on framed images ---------- */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (!reduceMotion && parallaxEls.length) {
    function updateParallax() {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        // distance of element centre from viewport centre, scaled small
        var offset = (rect.top + rect.height / 2 - vh / 2) * -0.04;
        el.style.transform = "translateY(" + offset.toFixed(1) + "px)";
      });
      requestAnimationFrame(updateParallax);
    }
    requestAnimationFrame(updateParallax);
  }

  /* ---------- 7. World map: legend pill <-> map pin cross-highlight ----------
     Pills and pins share a data-country value. Hovering (or focusing) either
     one lights up both, so the legend doubles as a key to the map. */
  var countryEls = document.querySelectorAll("[data-country]");
  function setHot(key, on) {
    countryEls.forEach(function (el) {
      if (el.getAttribute("data-country") === key) {
        el.classList.toggle("is-hot", on);
      }
    });
  }
  countryEls.forEach(function (el) {
    var key = el.getAttribute("data-country");
    el.addEventListener("mouseenter", function () { setHot(key, true); });
    el.addEventListener("mouseleave", function () { setHot(key, false); });
    el.addEventListener("focus", function () { setHot(key, true); });
    el.addEventListener("blur", function () { setHot(key, false); });
  });

  /* ---------- 8. Calendly popup from any [data-calendly] button ---------- */
  document.querySelectorAll("[data-calendly]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var url = btn.getAttribute("href");
      if (window.Calendly && url) {
        e.preventDefault();
        window.Calendly.initPopupWidget({ url: url });
      }
      // If Calendly hasn't loaded, the link just opens normally — still works.
    });
  });
})();
