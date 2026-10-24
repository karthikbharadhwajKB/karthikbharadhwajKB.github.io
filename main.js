(() => {
  "use strict";

  const root = document.documentElement;
  const KEY = "kk-theme";
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)");

  const stored = () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  };
  const store = (value) => {
    try { localStorage.setItem(KEY, value); } catch {}
  };
  const onChange = (mql, fn) => {
    if (mql.addEventListener) mql.addEventListener("change", fn);
    else if (mql.addListener) mql.addListener(fn);
  };

  const isDark = () => {
    const t = root.getAttribute("data-theme");
    return t ? t === "dark" : mq.matches;
  };

  const btn = document.getElementById("theme-toggle");

  function paintToggle() {
    if (!btn) return;
    const dark = isDark();
    btn.querySelector(".theme-label").textContent = dark ? "Light" : "Dark";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.classList.toggle("is-dark", dark);
  }

  function syncTheme() {
    const s = stored();
    if (s === "dark" || s === "light") root.setAttribute("data-theme", s);
    paintToggle();
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store(next);
      paintToggle();
    });
    onChange(mq, paintToggle);
    window.addEventListener("pageshow", syncTheme);
    window.addEventListener("storage", (e) => { if (e.key === KEY) syncTheme(); });
    paintToggle();
  }

  document.querySelectorAll("[data-toggle]").forEach((b) => {
    const target = document.getElementById(b.getAttribute("data-toggle"));
    if (!target) return;
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", target.id);
    b.addEventListener("click", () => {
      const open = target.hidden;
      target.hidden = !open;
      b.setAttribute("aria-expanded", String(open));
      b.textContent = open ? "Hide BibTeX" : "BibTeX";
    });
  });

  root.classList.remove("no-js");

  if (rm.matches) return;

  const items = document.querySelectorAll(".reveal, .line-reveal");
  if (items.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.style.setProperty("--reveal-delay", `${Math.min(n++, 5) * 70}ms`);
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

    const painted = performance.getEntriesByType("paint").length > 0;
    let first = 0;
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        if (painted) el.classList.add("was-painted");
        else el.style.setProperty("--reveal-delay", `${250 + Math.min(first++, 10) * 60}ms`);
        el.classList.add("is-visible");
      } else {
        io.observe(el);
      }
    });

    const show = (el) => { el.classList.add("is-visible"); io.unobserve(el); };

    document.addEventListener("focusin", (e) => {
      const r = e.target.closest && e.target.closest(".reveal:not(.is-visible)");
      if (r) show(r);
    });
    onChange(rm, (e) => {
      if (e.matches) document.querySelectorAll(".reveal:not(.is-visible), .line-reveal:not(.is-visible)").forEach(show);
    });

    root.classList.add("motion");
  }

  if (window.matchMedia("(pointer: fine)").matches) {
    const glow = document.createElement("div");
    glow.className = "glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.prepend(glow);
    root.classList.add("has-glow");

    const home = () => [window.innerWidth / 2, -window.innerHeight * 0.1];
    let [cx, cy] = home(), tx = cx, ty = cy, raf = 0, moved = false;
    const place = () => { glow.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`; };
    const reset = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      [cx, cy] = home();
      tx = cx; ty = cy;
      place();
    };
    const tick = () => {
      if (rm.matches) { raf = 0; return; }
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      place();
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    place();

    window.addEventListener("pointermove", (e) => {
      if (rm.matches) return;
      moved = true;
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    window.addEventListener("resize", () => { if (!moved) reset(); });
    onChange(rm, (e) => { if (e.matches) reset(); });
  }
})();
