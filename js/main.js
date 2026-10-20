/* ============================================================================
   Betreutes Wohnen Münster — JavaScript
   ⚠️ NICHT ÄNDERN (Technik). Diese Datei verbessert die Bedienung
   (Karussell-Pfeile, Menü, sanfte Effekte). Die Website funktioniert
   auch komplett OHNE JavaScript — alles hier ist rein zusätzlich.
   ========================================================================== */
"use strict";

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Kennzeichnung „JavaScript aktiv“ — CSS nutzt .js als Schalter,
     damit ohne JavaScript nichts versteckt oder ausgeblendet wird. */
  document.documentElement.classList.add("js");

  /* --------------------------------------------------------------
     Mobiles Menü
     -------------------------------------------------------------- */
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.getElementById("hauptmenue");
  if (toggle && nav) {
    toggle.hidden = false;
    nav.classList.add("is-collapsed");

    const setOpen = (open) => {
      nav.classList.toggle("is-collapsed", !open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => {
      setOpen(nav.classList.contains("is-collapsed"));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------
     Karussell (Fotos + Grundrisse — gleiche Komponente)
     Ohne JavaScript: wischbare Scroll-Liste. Mit JavaScript:
     immer sichtbare Pfeile, Statusanzeige, Tastaturbedienung.
     -------------------------------------------------------------- */
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const viewport = root.querySelector(".carousel__viewport");
    const track = root.querySelector(".carousel__track");
    const slides = Array.from(root.querySelectorAll(".carousel__slide"));
    const controls = root.querySelector("[data-carousel-controls]");
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    const status = root.querySelector("[data-carousel-status]");
    if (!viewport || !track || slides.length === 0 || !controls) return;

    controls.hidden = false;
    /* Wortstamm („Bild“/„Grundriss“) aus dem vorbefüllten Status übernehmen */
    const label = (status && status.textContent.trim().split(" ")[0]) || "Bild";

    /* Logischer Index: Klicks/Tasten stützen sich hierauf, nicht auf die
       Live-Scrollposition — sonst verschluckt eine laufende sanfte
       Scroll-Animation jeden zweiten schnellen Klick. */
    let current = 0;

    const posIndex = () =>
      Math.max(0, Math.min(slides.length - 1,
        Math.round(viewport.scrollLeft / viewport.clientWidth)));

    /* aria-disabled statt disabled: Der Knopf bleibt fokussierbar,
       Tastaturnutzer verlieren am Anfang/Ende nicht ihre Fokusposition. */
    const setDisabled = (btn, val) => {
      if (btn) btn.setAttribute("aria-disabled", String(val));
    };
    const isDisabled = (btn) => btn.getAttribute("aria-disabled") === "true";

    const update = () => {
      if (status) status.textContent = label + " " + (current + 1) + " von " + slides.length;
      setDisabled(prevBtn, current === 0);
      setDisabled(nextBtn, current === slides.length - 1);
    };

    const goTo = (i) => {
      current = Math.max(0, Math.min(slides.length - 1, i));
      update();
      viewport.scrollTo({
        left: current * viewport.clientWidth,
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    };

    if (prevBtn) prevBtn.addEventListener("click", () => {
      if (!isDisabled(prevBtn)) goTo(current - 1);
    });
    if (nextBtn) nextBtn.addEventListener("click", () => {
      if (!isDisabled(nextBtn)) goTo(current + 1);
    });

    viewport.addEventListener("keydown", (e) => {
      const keys = { ArrowLeft: -1, ArrowRight: 1 };
      if (e.key in keys) {
        e.preventDefault();
        goTo(current + keys[e.key]);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(slides.length - 1);
      }
    });

    /* Nach manuellem Wischen/Scrollen (oder Scroll-Ende) den logischen
       Index mit der tatsächlichen Position abgleichen — entprellt. */
    let settle = 0;
    viewport.addEventListener("scroll", () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        current = posIndex();
        update();
      }, 120);
    }, { passive: true });
    window.addEventListener("resize", () => {
      current = posIndex();
      update();
      /* Position hart nachziehen — sonst bleibt der Viewport nach einem
         Resize (z. B. Gerätedrehung) zwischen zwei Bildern stehen. */
      viewport.scrollTo({ left: current * viewport.clientWidth, behavior: "auto" });
    });
    update();
  });

  /* --------------------------------------------------------------
     Sanftes Einblenden beim Scrollen (data-reveal)
     -------------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* --------------------------------------------------------------
     Kopfzeile: verdichtet sich beim Scrollen ·
     Hero: dezenter Parallax-Versatz ·
     Panorama: Foto gleitet leicht in seinem Rahmen ·
     „Zurück nach oben“-Knopf
     -------------------------------------------------------------- */
  const header = document.querySelector("[data-header]");
  const heroMedia = document.querySelector("[data-parallax] img");
  const frames = Array.from(document.querySelectorAll("[data-parallax-frame]"));
  const toTop = document.querySelector("[data-to-top]");
  let ticking = false;

  /* Rahmen-Parallax: Taucht der Rahmen unten auf, ist das Foto ganz nach
     oben verschoben; verlässt er den Bildschirm oben, ganz nach unten —
     dazwischen gleichmäßig. Der Weg ist auf den Überstand des Fotos über
     den Rahmen begrenzt (CSS), daher bleiben die Bildkanten immer verdeckt. */
  const moveFrames = () => {
    const vh = window.innerHeight;
    frames.forEach((frame) => {
      const img = frame.querySelector("img");
      const box = frame.getBoundingClientRect();
      if (!img || box.bottom < 0 || box.top > vh) return;
      /* 1 px Sicherheitsabstand gegen Rundung, damit nie eine Haarlinie
         Hintergrund am Bildrand aufblitzt */
      const reserve = Math.max(0, (img.getBoundingClientRect().height - box.height) / 2 - 1);
      const pos = (box.top + box.height / 2 - vh / 2) / ((vh + box.height) / 2);
      const shift = -Math.max(-1, Math.min(1, pos)) * reserve;
      img.style.setProperty("--parallax-y", shift.toFixed(1) + "px");
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 12);
      if (heroMedia && !reduceMotion.matches && y < window.innerHeight * 1.5) {
        heroMedia.style.setProperty("--parallax-y", (y * 0.16).toFixed(1) + "px");
      }
      if (frames.length && !reduceMotion.matches) moveFrames();
      if (toTop) toTop.hidden = y < window.innerHeight * 2;
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* --------------------------------------------------------------
     Erreichbarkeit: „heute“-Markierung + Live-Ampel.
     Beides rechnet in DEUTSCHER Zeit (Europe/Berlin), nicht in der
     Gerätezeit des Besuchers — ein Tablet mit ausländischer
     Zeitzoneneinstellung zeigte sonst einen falschen Status.
     Fallback: Gerätezeit, wenn der Browser keine Zeitzonen-
     Umrechnung beherrscht (dann für deutsche Geräte identisch).
     Die Sprechzeiten kommen aus den data-von/data-bis-Attributen
     der Tabelle; unplausible Angaben (Tippfehler des Pflegenden)
     werden ignoriert. Ohne gültiges Fenster bleibt die Ampel
     verborgen — die Tabelle ist immer die verlässliche Quelle.
     -------------------------------------------------------------- */
  const tagNamen = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const jetztInDeutschland = () => {
    try {
      const teile = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Berlin", weekday: "short",
        hour: "numeric", minute: "numeric", hourCycle: "h23",
      }).formatToParts(new Date());
      const wert = (typ) => (teile.find((t) => t.type === typ) || {}).value;
      const tag = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wert("weekday"));
      const min = Number(wert("hour")) * 60 + Number(wert("minute"));
      if (tag >= 0 && !Number.isNaN(min)) return { tag: tag, min: min };
    } catch (e) { /* sehr alte Browser: unten der Fallback */ }
    const d = new Date();
    return { tag: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
  };

  const hoursTabelle = document.querySelector(".hours-table");
  if (hoursTabelle) {
    const ampel = document.querySelector("[data-erreichbar]");
    const ampelText = ampel && ampel.querySelector("[data-erreichbar-text]");
    const ZEIT_OK = /^\d{1,2}:\d{2}$/;
    const minuten = (hhmm) => {
      const t = hhmm.split(":");
      return Number(t[0]) * 60 + Number(t[1]);
    };
    const fenster = Array.from(hoursTabelle.querySelectorAll("tr[data-von][data-bis]"))
      .map((zeile) => ({
        tag: Number(zeile.getAttribute("data-tag")),
        von: zeile.getAttribute("data-von"),
        bis: zeile.getAttribute("data-bis"),
      }))
      .filter((f) => f.tag >= 0 && f.tag <= 6 &&
        ZEIT_OK.test(f.von) && ZEIT_OK.test(f.bis) && minuten(f.von) < minuten(f.bis));

    /* „heute“-Zeile setzen (und bei Mitternachtswechsel weiterwandern) */
    const markiereHeute = (tag) => {
      hoursTabelle.querySelectorAll("tr.is-today").forEach((zeile) => {
        zeile.classList.remove("is-today");
        const alt = zeile.querySelector(".hours-table__today-tag");
        if (alt) alt.remove();
      });
      const zeile = hoursTabelle.querySelector('tr[data-tag="' + tag + '"]');
      if (zeile) {
        zeile.classList.add("is-today");
        const mark = document.createElement("span");
        mark.className = "hours-table__today-tag";
        mark.textContent = "heute";
        zeile.querySelector("th").appendChild(mark);
      }
    };

    const aktualisieren = () => {
      const jetzt = jetztInDeutschland();
      markiereHeute(jetzt.tag);
      if (!ampel || !ampelText || fenster.length === 0) return; /* Ampel bleibt verborgen */

      const offen = fenster.some((f) =>
        f.tag === jetzt.tag && jetzt.min >= minuten(f.von) && jetzt.min < minuten(f.bis));

      ampel.classList.toggle("hours-card__status--offen", offen);
      ampel.classList.toggle("hours-card__status--zu", !offen);
      /* Die „heute“-Zeile wird nur während eines offenen Fensters grün —
         außerhalb bleibt sie neutral (kein Widerspruch zur roten Ampel). */
      hoursTabelle.classList.toggle("is-offen", offen);

      if (offen) {
        ampelText.textContent = "Jetzt telefonisch erreichbar";
      } else {
        /* Nächstes Zeitfenster suchen (heute später oder in den
           kommenden 7 Tagen) und benennen. */
        let naechstes = null;
        for (let i = 0; i <= 7 && !naechstes; i++) {
          const t = (jetzt.tag + i) % 7;
          const kandidaten = fenster
            .filter((f) => f.tag === t && (i > 0 || jetzt.min < minuten(f.von)))
            .sort((a, b) => minuten(a.von) - minuten(b.von));
          if (kandidaten.length) naechstes = { f: kandidaten[0], inTagen: i };
        }
        if (naechstes) {
          const wann = naechstes.inTagen === 0 ? "heute"
            : naechstes.inTagen === 1 ? "morgen"
            : "am " + tagNamen[naechstes.f.tag];
          ampelText.textContent =
            "Zurzeit nicht erreichbar – wieder " + wann + " ab " + naechstes.f.von + " Uhr";
        } else {
          ampelText.textContent = "Zurzeit nicht erreichbar";
        }
      }
      ampel.hidden = false;
    };
    aktualisieren();
    setInterval(aktualisieren, 60000);
  }

  /* --------------------------------------------------------------
     Zoombare Lagekarte
     Ohne JS: die Karte ist ein statisches, gestochen scharfes Bild.
     Mit JS: Zoomen/Verschieben per Maus, Tasten und Zwei-Finger-Geste.
     (Ein Finger scrollt weiterhin die Seite — kein „Scroll-Fänger“.)
     -------------------------------------------------------------- */
  document.querySelectorAll("[data-map]").forEach((box) => {
    const frame = box.querySelector(".mapbox__frame");
    const img = box.querySelector(".mapbox__img");
    const controls = box.querySelector("[data-map-controls]");
    if (!frame || !img) return;

    const MIN = 1, MAX = 6;
    let sc = 1, tx = 0, ty = 0;
    const pointers = new Map();
    let pinchDist = 0, pinchMid = null;

    const clamp = () => {
      const w = frame.clientWidth, h = frame.clientHeight;
      tx = Math.min(0, Math.max(w * (1 - sc), tx));
      ty = Math.min(0, Math.max(h * (1 - sc), ty));
    };
    const apply = (animate) => {
      frame.classList.toggle("is-panning", !animate);
      img.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${sc.toFixed(3)})`;
    };
    const zoomAt = (factor, cx, cy, animate) => {
      const ns = Math.min(MAX, Math.max(MIN, sc * factor));
      if (ns === sc) return;
      tx = cx - ((cx - tx) / sc) * ns;
      ty = cy - ((cy - ty) / sc) * ns;
      sc = ns;
      clamp();
      apply(animate);
    };
    const rel = (e) => {
      const r = frame.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    // aktivieren (Progressive Enhancement)
    frame.setAttribute("data-enhanced", "");
    frame.tabIndex = 0;
    frame.setAttribute("role", "application");
    frame.setAttribute("aria-label",
      "Zoombare Lagekarte. Mit Plus und Minus zoomen, mit den Pfeiltasten verschieben, mit 0 zurücksetzen.");
    /* Die inhaltsreiche Bildbeschreibung (alt) bleibt so auch am
       fokussierten Rahmen hörbar — role="application" klammert den
       Teilbaum sonst aus dem Screenreader-Lesemodus aus. */
    if (img.id) frame.setAttribute("aria-describedby", img.id);
    if (controls) { controls.hidden = false; controls.removeAttribute("aria-hidden"); }
    const hinweis = box.querySelector("[data-map-hinweis]");
    if (hinweis) hinweis.hidden = false;

    // Mausrad NUR mit Strg/Cmd (sonst scrollt die Seite normal weiter —
    // kein „Scroll-Fänger“). Primäre Bedienung: die +/−-Knöpfe und Finger.
    let radRuhe = 0;
    frame.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const [cx, cy] = rel(e);
      zoomAt(Math.exp(-e.deltaY * 0.0016), cx, cy, false);
      /* is-panning (setzt Cursor/Transition) nach dem Radstoß lösen */
      clearTimeout(radRuhe);
      radRuhe = setTimeout(() => frame.classList.remove("is-panning"), 160);
    }, { passive: false });

    // Zeiger (Maus ziehen · Zwei-Finger-Geste)
    frame.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".mapbox__btn")) return;
      pointers.set(e.pointerId, e);
      const touch = e.pointerType === "touch";
      if (pointers.size === 2) {
        const p = [...pointers.values()];
        pinchDist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
        const r = frame.getBoundingClientRect();
        pinchMid = [(p[0].clientX + p[1].clientX) / 2 - r.left, (p[0].clientY + p[1].clientY) / 2 - r.top];
      } else if (!touch) {
        frame.setPointerCapture(e.pointerId);
        frame.classList.add("is-panning");
      }
    });
    frame.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, e);
      if (pointers.size === 2) {
        e.preventDefault();
        const p = [...pointers.values()];
        const d = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
        /* Zwei-Finger-Geste kann zugleich verschieben (Mittelpunkt-Drift)
           und zoomen (Abstandsänderung) — wie in Karten-Apps üblich. */
        const r = frame.getBoundingClientRect();
        const mx = (p[0].clientX + p[1].clientX) / 2 - r.left;
        const my = (p[0].clientY + p[1].clientY) / 2 - r.top;
        if (pinchMid) { tx += mx - pinchMid[0]; ty += my - pinchMid[1]; }
        pinchMid = [mx, my];
        if (pinchDist > 0 && d !== pinchDist) {
          zoomAt(d / pinchDist, mx, my, false);
        } else {
          clamp();
          apply(false);
        }
        pinchDist = d;
      } else if (e.pointerType !== "touch") {
        tx += e.clientX - prev.clientX;
        ty += e.clientY - prev.clientY;
        clamp();
        apply(false);
      }
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) frame.classList.remove("is-panning");
    };
    frame.addEventListener("pointerup", up);
    frame.addEventListener("pointercancel", up);

    // Tastatur
    frame.addEventListener("keydown", (e) => {
      const c = [frame.clientWidth / 2, frame.clientHeight / 2];
      const step = 60;
      const k = { "+": 1, "=": 1, "-": 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, "0": 1 };
      if (!(e.key in k)) return;
      e.preventDefault();
      if (e.key === "+" || e.key === "=") zoomAt(1.35, c[0], c[1], true);
      else if (e.key === "-") zoomAt(1 / 1.35, c[0], c[1], true);
      else if (e.key === "0") { sc = 1; tx = 0; ty = 0; apply(true); }
      else {
        if (e.key === "ArrowUp") ty += step;
        if (e.key === "ArrowDown") ty -= step;
        if (e.key === "ArrowLeft") tx += step;
        if (e.key === "ArrowRight") tx -= step;
        clamp(); apply(true);
      }
    });

    // Knöpfe
    if (controls) {
      controls.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-map-zoom]");
        if (!btn) return;
        const c = [frame.clientWidth / 2, frame.clientHeight / 2];
        const mode = btn.getAttribute("data-map-zoom");
        if (mode === "in") zoomAt(1.4, c[0], c[1], true);
        else if (mode === "out") zoomAt(1 / 1.4, c[0], c[1], true);
        else { sc = 1; tx = 0; ty = 0; apply(true); }
      });
    }
    window.addEventListener("resize", () => { clamp(); apply(false); });
  });

  /* --------------------------------------------------------------
     Fußbereich: Jahr automatisch aktualisieren
     -------------------------------------------------------------- */
  const year = document.querySelector("[data-jahr]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
