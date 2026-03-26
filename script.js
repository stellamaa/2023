import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const outro = document.querySelector(".outro");
  if (outro) {
    let knitEl = outro.querySelector(".outro-knit");
    if (!knitEl) {
      knitEl = document.createElement("div");
      knitEl.className = "outro-knit";
      outro.appendChild(knitEl);
    }

    const outroText = (outro.querySelector("p")?.textContent || "").trim();

    const buildKnit = () => {
      knitEl.innerHTML = "";
      if (!outroText) return;

      // Measure a single word block to size the grid.
      const probe = document.createElement("span");
      probe.className = "knit-word";
      probe.textContent = outroText;
      knitEl.appendChild(probe);
      const probeRect = probe.getBoundingClientRect();
      // Dense packing: minimal padding, no gaps.
      const cellW = Math.max(22, Math.ceil(probeRect.width));
      const cellH = Math.max(12, Math.ceil(probeRect.height));
      probe.remove();

      const rect = outro.getBoundingClientRect();
      // Overscan so the wall stays filled across the full 200vh scroll.
      const cols = Math.ceil((rect.width * 2.5) / cellW);
      const rows = Math.ceil((rect.height * 2.4) / cellH);

      knitEl.style.gridTemplateColumns = `repeat(${cols}, ${cellW}px)`;
      knitEl.style.gridAutoRows = `${cellH}px`;

      const items = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const span = document.createElement("span");
          span.className = "knit-word";
          // No gaps between tiles: also remove any trailing space.
          const base = `${outroText}`.replace(/\s+$/g, "");
          span.dataset.base = base;
          span.textContent = base;
          knitEl.appendChild(span);
          items.push(span);
        }
      }

      // Letter-jumble: mostly keep base, occasionally swap a few characters.
      const alphabet = "abcdefghijklmnopqrstuvwxyz.";
      const randChar = () => alphabet[(Math.random() * alphabet.length) | 0];
      const insertDots = (base) => {
        if (!base) return base;
        const dots = " ";
        const idx = (Math.random() * (base.length + 2)) | 0;
        return `${base.slice(0, idx)}${dots}${base.slice(idx)}`;
      };
      const jumbleOnce = (base) => {
        if (!base) return base;
        const chars = base.split("");
        const edits = 1 + ((Math.random() * 0) | 0); // 1-3 edits
        for (let i = 0; i < edits; i += 1) {
          const idx = (Math.random() * chars.length) | 0;
          const ch = chars[idx];
          if (ch === " " || ch === "." || ch === "," || ch === "'") continue;
          chars[idx] = randChar();
        }
        return chars.join("");
      };

      if (knitEl._jumbleTimer) window.clearInterval(knitEl._jumbleTimer);
      knitEl._jumbleTimer = window.setInterval(() => {
        for (let i = 0; i < items.length; i += 1) {
          const el = items[i];
          const base = el.dataset.base || "";
          // Most of the time, show the original; sometimes show a jumbled variant.
          if (Math.random() < 0.7) {
            if (Math.random() < 0.06) el.textContent = insertDots(base);
            else if (el.textContent !== base) el.textContent = base;
          } else {
            if (Math.random() < 0.22) el.textContent = insertDots(jumbleOnce(base));
            else el.textContent = jumbleOnce(base);
          }
        }
      }, 200);
    };

    let resizeTimer = null;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildKnit, 120);
    };

    buildKnit();
    window.addEventListener("resize", onResize, { passive: true });
  }

  const poem3 = document.querySelector(".poem3");
  if (poem3) {
    const trailLayer = document.createElement("div");
    trailLayer.className = "poem3-trail";
    poem3.appendChild(trailLayer);

    const poemText = `I'm whiter than milk. Than death in a cup.`;
    const maxFrags = 32;
    const minDist = 10;
    const minMs = 35;
    let lastX = null;
    let lastY = null;
    let lastT = 0;
    let fragIndex = 0;

    const spawn = (x, y) => {
      const el = document.createElement("div");
      el.className = "poem-frag";
      el.textContent = poemText;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.zIndex = `${1000 + (fragIndex % maxFrags)}`;

      const dir = fragIndex % 2 === 0 ? 1 : -1;
      fragIndex += 1;

      trailLayer.appendChild(el);

      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.68, rotation: 0, x: 0, y: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
        },
      );

      gsap.to(el, {
        rotation: dir * gsap.utils.random(2, 3),
        x: dir * gsap.utils.random(10, 22),
        y: gsap.utils.random(-6, 10),
        duration: 0.9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
      });

      gsap.to(el, {
        opacity: 0,
        duration: 1.15,
        ease: "power1.out",
        delay: 0.25,
        onComplete: () => el.remove(),
      });

      while (trailLayer.children.length > maxFrags) {
        trailLayer.firstElementChild?.remove();
      }
    };

    const onMove = (e) => {
      const rect = poem3.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = performance.now();
      if (lastX !== null && lastY !== null) {
        const dx = x - lastX;
        const dy = y - lastY;
        if (dx * dx + dy * dy < minDist * minDist) return;
        if (now - lastT < minMs) return;
      }

      lastX = x;
      lastY = y;
      lastT = now;
      spawn(x, y);
    };

    poem3.addEventListener("mousemove", onMove);
    poem3.addEventListener("mouseleave", () => {
      lastX = null;
      lastY = null;
    });
  }

  const heroCopySplit = SplitText.create(".hero-copy p", {
    type: "words",
    wordsClass: "word",
  });

  let isHeroCopyHidden = false;

  ScrollTrigger.create({
    trigger: ".hero",
    start: "top top",
    end: `+${window.innerHeight * 3.5}px`,
    pin: true,
    pinSpacing: false,
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;

      const heroHeaderProgress = Math.min(progress / 0.29, 1);
      gsap.set(".hero-header", { yPercent: -heroHeaderProgress * 100 });

      const heroWordsProgress = Math.max(
        0,
        Math.min((progress - 0.29) / 0.21, 1),
      );
      const totalWords = heroCopySplit.words.length;
      heroCopySplit.words.forEach((word, i) => {
        const wordStart = i / totalWords;
        const wordEnd = (i + 1) / totalWords;
        const wordOpacity = Math.max(
          0,
          Math.min((heroWordsProgress - wordStart) / (wordEnd - wordStart), 1),
        );
        gsap.set(word, { opacity: wordOpacity });
      });

      if (progress > 0.64 && !isHeroCopyHidden) {
        isHeroCopyHidden = true;
        gsap.to(".hero-copy p", { opacity: 0, duration: 0.2 });
      } else if (progress <= 0.64 && isHeroCopyHidden) {
        isHeroCopyHidden = false;
        gsap.to(".hero-copy p", { opacity: 1, duration: 0.2 });
      }

      const heroImgProgress = Math.max(
        0,
        Math.min((progress - 0.71) / 0.29, 1),
      );
      const heroImgWidth = gsap.utils.interpolate(
        window.innerWidth,
        150,
        heroImgProgress,
      );
      const heroImgHeight = gsap.utils.interpolate(
        window.innerHeight,
        150,
        heroImgProgress,
      );
      gsap.set(".hero-img", {
        width: heroImgWidth,
        height: heroImgHeight,
      });
    },
  });

  const aboutSection = document.querySelector(".about");
  if (aboutSection) {
    const overlay = document.createElement("div");
    overlay.className = "about-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const overlayImg = document.createElement("img");
    overlayImg.alt = "";
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    const open = (src) => {
      overlayImg.src = src;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      overlayImg.style.objectFit = "contain";
      document.body.style.overflow = "hidden";
      overlayImg.style.backgroundColor = "white";
    };
    const close = () => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    aboutSection.addEventListener("click", (e) => {
      const container = e.target.closest(".about-imgs-col .img");
      if (!container) return;
      const img = container.querySelector("img");
      if (!img) return;
      e.stopPropagation();
      const src = img.currentSrc || img.src;
      open(src);
    });

    overlay.addEventListener("click", () => close());

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  const aboutImgCols = [
    { id: "#about-imgs-col-1", y: -500 },
    { id: "#about-imgs-col-2", y: -250 },
    { id: "#about-imgs-col-3", y: -250 },
    { id: "#about-imgs-col-4", y: -500 },
  ];

  aboutImgCols.forEach(({ id, y }) => {
    gsap.to(id, {
      y,
      scrollTrigger: {
        trigger: ".about",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  const poem2Pin = document.querySelector(".poem2-pin");
  const poem2Trail = document.querySelector(".poem2-trail");
  if (poem2Pin && poem2Trail) {
    const trailStartY = 700;
    gsap.set(poem2Trail, { y: trailStartY });

    // Keep poem2 pinned while the page continues through the audio section.
    ScrollTrigger.create({
      trigger: ".poem2-pin",
      start: "top top",
      endTrigger: ".muzak",
      end: "bottom bottom",
      pin: true,
      pinSpacing: true,
    });

    // Bring the trail up to meet the last line early, then keep it at the top.
    gsap.to(poem2Trail, {
      y: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".poem2-pin",
        start: "top top",
        end: "+=140%",
        scrub: 1,
      },
    });
  }

  // Show the muzak controls as an overlay while scrolling the muzak section.
  const muzakSection = document.querySelector(".muzak");
  const muzakFloat = document.querySelector(".muzak-float");
  if (muzakSection && muzakFloat) {
    ScrollTrigger.create({
      trigger: muzakSection,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => muzakFloat.classList.add("is-active"),
      onEnterBack: () => muzakFloat.classList.add("is-active"),
      onLeave: () => muzakFloat.classList.remove("is-active"),
      onLeaveBack: () => muzakFloat.classList.remove("is-active"),
    });
  }

  // Audio buttons that can play simultaneously, looped.
  const muzakButtons = Array.from(document.querySelectorAll(".muzak-btn"));
  if (muzakButtons.length) {
    // Served from `public/muzak/*` so it works in production builds too.
    const muzakSrcByKey = {
      1: "/muzak/1.mp3",
      2: "/muzak/2.mp3",
      3: "/muzak/3.mp3",
      4: "/muzak/4.mp3",
    };

    const players = new Map();

    const getPlayer = (btn) => {
      const key = btn.getAttribute("data-key");
      const src = key ? muzakSrcByKey[key] : null;
      if (!src) return null;
      if (players.has(src)) return players.get(src);
      const a = new Audio(src);
      a.loop = true;
      a.preload = "auto";
      a.playsInline = true;
      players.set(src, a);
      return a;
    };

    const setUI = (btn, isPlaying) => {
      btn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      btn.textContent = isPlaying ? "pause" : "play";
    };

    muzakButtons.forEach((btn) => {
      setUI(btn, false);
      btn.addEventListener("click", async () => {
        const player = getPlayer(btn);
        if (!player) return;

        if (player.paused) {
          try {
            await player.play();
            setUI(btn, true);
          } catch {
            // Autoplay restrictions or decode issues: keep UI as play.
            setUI(btn, false);
          }
        } else {
          player.pause();
          setUI(btn, false);
        }
      });
    });
  }
});
